# Domain Lifecycle & Business Logic

## Overview

Django manages the complete lifecycle of domains from registration through renewal, expiry, and deletion. This includes automated processes (cron jobs, Celery tasks) and business rules (pricing, validation, fraud detection).

---

## Domain Lifecycle States

```
┌─────────┐    Register    ┌──────────┐    Payment    ┌──────────┐
│ SEARCH  │───────────────►│ PENDING  │──────────────►│  ACTIVE  │
└─────────┘                │ (ORDER)  │   Confirmed   │          │
                           └──────────┘               └────┬─────┘
                                │                         │
                                │ Cancelled               │ Expiry
                                │ / Failed                │ approaching
                                ▼                         ▼
                           ┌──────────┐           ┌──────────┐
                           │ CANCELLED│           │ EXPIRING │
                           └──────────┘           │ (warned) │
                                                  └────┬─────┘
                                                       │
                                                Not renewed
                                                       │
                                                       ▼
                                                  ┌──────────┐
                                                  │ EXPIRED  │
                                                  └────┬─────┘
                                                       │
                                              ┌────────┤────────┐
                                              │        │        │
                                         Grace    Redemption  Delete
                                         Period    Period
                                         (30d)     (pending)
                                              │        │        │
                                              ▼        ▼        ▼
                                         ┌──────┐ ┌──────┐ ┌──────┐
                                         │RENEW │ │PARKED│ │DELETED│
                                         └──────┘ └──────┘ └──────┘
```

---

## Domain State Machine

### Database Status Values

| Status | Description | User Can Access? | Auto-Actions |
|---|---|---|---|
| `pending` | Order created, awaiting payment | Read-only | Expire after 2h if no payment |
| `active` | Registered and live | Full access | DNS works, auto-renew check |
| `expired` | Past expiry date | Read-only + Renew | Grace period starts |
| `grace_period` | 30 days after expiry | Renew only | Warn user daily |
| `redemption` | Pending deletion by registry | Admin only | Escalate to admin |
| `transferred_out` | Moved to another registrar | No | Archive data |
| `suspended` | Suspended by TCRA or abuse | No | Notify admin |

---

## Automated Tasks (Celery Beat)

### `tasks/domain_lifecycle.py`

```python
from celery import shared_task
from celery.schedules import crontab
from datetime import datetime, timedelta
from django.db import connection
from services.resellerclub import resellerclub
from services.sms_service import sms_service
from services.mpesa import selcom
from services.pricing import calculate_renewal_price


# ─── EXPIRY MANAGEMENT ───────────────────────────────────────

@shared_task
def check_expiring_domains():
    """
    Run daily at 8:00 AM EAT.
    Check for domains expiring in 60, 30, 7 days.
    Send SMS reminders and create in-app notifications.
    """
    thresholds = {
        60: 'expiry_60_days',
        30: 'expiry_30_days',
        7: 'expiry_7_days',
    }
    
    today = datetime.utcnow()
    
    for days, template_key in thresholds.items():
        start = today + timedelta(days=days - 1)
        end = today + timedelta(days=days + 1)
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT d.id, d.name, d.expiry_date, d.user_id,
                       p.phone, p.locale, p.email
                FROM domains d
                JOIN profiles p ON d.user_id = p.id
                WHERE d.expiry_date BETWEEN %s AND %s
                  AND d.status = 'active'
            """, [start, end])
            
            expiring = cursor.fetchall()
        
        for domain_id, domain_name, expiry_date, user_id, phone, locale, email in expiring:
            locale = locale or 'sw'
            
            # Send SMS
            renewal_price = calculate_renewal_price(domain_name)
            
            sms_service.send_templated(
                to=phone,
                template_key=template_key,
                variables={
                    'domain': domain_name,
                    'expiry_date': expiry_date.strftime('%d/%m/%Y'),
                    'renewal_price': format_tzs(renewal_price),
                },
                locale=locale,
            )
            
            # Create in-app notification
            create_notification(
                user_id=user_id,
                type='domain_expiry',
                title=locale == 'sw'
                    ? f'Jina {domain_name} litakwisha siku {days}!'
                    : f'Domain {domain_name} expires in {days} days!',
                action_url=f'/dashboard/domains/{domain_id}',
            )


@shared_task
def mark_expired_domains():
    """
    Run daily at midnight EAT.
    Mark domains whose expiry date has passed.
    """
    today = datetime.utcnow().date()
    
    with connection.cursor() as cursor:
        # Mark expired
        cursor.execute("""
            UPDATE domains 
            SET status = 'expired', updated_at = NOW()
            WHERE expiry_date::date < %s
              AND status = 'active'
        """, [today])
        
        expired_count = cursor.rowcount
    
    if expired_count > 0:
        print(f"[DomainHub] Marked {expired_count} domains as expired")
        
        # Notify owners
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT d.name, d.id, p.phone, p.locale
                FROM domains d
                JOIN profiles p ON d.user_id = p.id
                WHERE d.status = 'expired'
                  AND d.expiry_date::date < %s
            """, [today])
            
            for domain_name, domain_id, phone, locale in cursor.fetchall():
                sms_service.send_templated(
                    to=phone,
                    template_key='domain_expired',
                    variables={'domain': domain_name},
                    locale=locale or 'sw',
                )


@shared_task
def check_grace_period_domains():
    """
    Run daily at midnight.
    Domains expired for > 30 days enter redemption period.
    """
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    with connection.cursor() as cursor:
        cursor.execute("""
            UPDATE domains 
            SET status = 'redemption', updated_at = NOW()
            WHERE status = 'expired'
              AND expiry_date < %s
        """, [thirty_days_ago])


# ─── AUTO-RENEWAL ────────────────────────────────────────────

@shared_task
def process_auto_renewals():
    """
    Run daily at 6:00 AM EAT.
    Process auto-renewal for domains expiring within 14 days.
    """
    today = datetime.utcnow()
    renew_window = today + timedelta(days=14)
    
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT d.id, d.name, d.user_id, d.expiry_date,
                   p.phone, p.locale, p.payment_method
            FROM domains d
            JOIN profiles p ON d.user_id = p.id
            WHERE d.expiry_date BETWEEN %s AND %s
              AND d.status = 'active'
              AND d.auto_renew = true
              AND d.auto_renew_processed = false
        """, [today, renew_window])
        
        auto_renewals = cursor.fetchall()
    
    for domain_id, domain_name, user_id, expiry, phone, locale, method in auto_renewals:
        renewal_price = calculate_renewal_price(domain_name)
        
        try:
            # Attempt payment
            if method == 'mpesa':
                result = selcom.initiate_stk_push(
                    phone_number=phone,
                    amount=renewal_price,
                    order_id=f"autorenew-{domain_id}",
                    description=f"Auto-renewal: {domain_name}",
                )
            # Add other methods...
            
            if result.get('status') == 'pending':
                # Mark as processed to avoid duplicate charges
                cursor.execute("""
                    UPDATE domains 
                    SET auto_renew_processed = true
                    WHERE id = %s
                """, [domain_id])
                
                print(f"[Auto-Renew] Payment initiated for {domain_name}")
                
        except Exception as e:
            print(f"[Auto-Renew] Failed for {domain_name}: {e}")
            
            # Notify user
            sms_service.send_templated(
                to=phone,
                template_key='payment_failed',
                variables={'amount': renewal_price},
                locale=locale or 'sw',
            )


# ─── DOMAIN SYNC (ResellerClub) ──────────────────────────────

@shared_task
def sync_domain_statuses():
    """
    Run daily at 3:00 AM EAT.
    Sync domain statuses from ResellerClub to local DB.
    """
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT id, name FROM domains WHERE status = 'active'
        """)
        domains = cursor.fetchall()
    
    for domain_id, domain_name in domains:
        try:
            details = resellerclub.get_domain_details(domain_name)
            expiry_date = details.get('expiresdate')
            
            if expiry_date:
                cursor.execute("""
                    UPDATE domains 
                    SET expiry_date = %s, updated_at = NOW()
                    WHERE id = %s
                """, [expiry_date, domain_id])
        except Exception as e:
            print(f"[Sync] Failed for {domain_name}: {e}")


# ─── CELERY BEAT SCHEDULE ────────────────────────────────────

CELERY_BEAT_SCHEDULE = {
    # Domain lifecycle
    'check-expiring-domains': {
        'task': 'tasks.domain_lifecycle.check_expiring_domains',
        'schedule': crontab(hour=5, minute=0),  # 8:00 AM EAT (UTC+3)
    },
    'mark-expired-domains': {
        'task': 'tasks.domain_lifecycle.mark_expired_domains',
        'schedule': crontab(hour=21, minute=0),  # Midnight EAT
    },
    'check-grace-period': {
        'task': 'tasks.domain_lifecycle.check_grace_period_domains',
        'schedule': crontab(hour=21, minute=30),
    },
    'process-auto-renewals': {
        'task': 'tasks.domain_lifecycle.process_auto_renewals',
        'schedule': crontab(hour=3, minute=0),  # 6:00 AM EAT
    },
    'sync-domain-statuses': {
        'task': 'tasks.domain_lifecycle.sync_domain_statuses',
        'schedule': crontab(hour=0, minute=0),  # 3:00 AM EAT
    },
    
    # Payment reconciliation
    'reconcile-payments': {
        'task': 'tasks.payment.reconcile_pending_payments',
        'schedule': 300.0,  # Every 5 minutes
    },
    'expire-old-payments': {
        'task': 'tasks.payment.expire_old_payments',
        'schedule': 600.0,  # Every 10 minutes
    },
}
```

---

## Business Logic Rules

### `services/pricing.py`

```python
# Pricing calculation engine

# Base prices in TZS (can be overridden from ResellerClub)
BASE_PRICES = {
    '.co.tz': {'register': 25000, 'renew': 30000, 'transfer': 35000},
    '.tz': {'register': 35000, 'renew': 40000, 'transfer': 40000},
    '.ac.tz': {'register': 15000, 'renew': 20000, 'transfer': 25000},
    '.or.tz': {'register': 15000, 'renew': 20000, 'transfer': 25000},
    '.go.tz': {'register': 15000, 'renew': 20000, 'transfer': 25000},
    '.com': {'register': 35000, 'renew': 38000, 'transfer': 38000},
    '.net': {'register': 38000, 'renew': 40000, 'transfer': 40000},
    '.org': {'register': 35000, 'renew': 38000, 'transfer': 38000},
    '.africa': {'register': 30000, 'renew': 35000, 'transfer': 35000},
    '.io': {'register': 55000, 'renew': 55000, 'transfer': 55000},
}

# Multi-year discounts
MULTI_YEAR_DISCOUNTS = {
    2: 0.05,   # 5% off for 2 years
    3: 0.10,   # 10% off for 3 years
    5: 0.15,   # 15% off for 5 years
    10: 0.20,  # 20% off for 10 years
}


def calculate_registration_price(domain_name: str, years: int = 1) -> dict:
    """
    Calculate the total price for domain registration.
    
    Returns:
        {
            "tld": ".co.tz",
            "per_year": 25000,
            "total": 25000,
            "discount": 0,
            "discount_percent": 0,
            "renewal_price_per_year": 30000,  # Show renewal upfront!
        }
    """
    tld = extract_tld(domain_name)
    base_price = BASE_PRICES.get(tld, {}).get('register', 40000)
    renewal_price = BASE_PRICES.get(tld, {}).get('renew', 40000)
    
    discount_percent = MULTI_YEAR_DISCOUNTS.get(years, 0)
    discount = int(base_price * years * discount_percent)
    total = base_price * years - discount
    
    return {
        "tld": tld,
        "per_year": base_price,
        "years": years,
        "total": total,
        "discount": discount,
        "discount_percent": discount_percent,
        "renewal_price_per_year": renewal_price,  # CRITICAL: Show renewal!
    }


def calculate_renewal_price(domain_name: str, years: int = 1) -> int:
    """Calculate renewal price."""
    tld = extract_tld(domain_name)
    per_year = BASE_PRICES.get(tld, {}).get('renew', 40000)
    
    discount_percent = MULTI_YEAR_DISCOUNTS.get(years, 0)
    return int(per_year * years * (1 - discount_percent))


def calculate_bundle_price(bundle_id: str) -> dict:
    """
    Calculate bundle pricing.
    
    Bundles:
    - starter: domain + 1-page website
    - business: domain + 5-page website + email
    - premium: domain + full website + email + SSL
    """
    bundles = {
        'starter': {
            'domain': 25000,    # .co.tz registration
            'website': 50000,   # AI website builder
            'total': 65000,     # vs 75000 separately (13% off)
            'discount': 10000,
        },
        'business': {
            'domain': 25000,
            'website': 50000,
            'email': 60000,     # 5 email accounts
            'total': 115000,    # vs 135000 separately (15% off)
            'discount': 20000,
        },
        'premium': {
            'domain': 25000,
            'website': 80000,
            'email': 60000,
            'ssl': 30000,
            'total': 170000,    # vs 195000 separately (13% off)
            'discount': 25000,
        },
    }
    
    return bundles.get(bundle_id, {})


def extract_tld(domain_name: str) -> str:
    """Extract TLD from domain name."""
    parts = domain_name.rsplit('.', 1)
    if len(parts) == 2:
        return f'.{parts[1]}'
    return '.com'


def format_tzs(amount: int) -> str:
    """Format amount as TZS string."""
    return f"TZS {amount:,}"
```

---

## Input Validation

### `utils/validators.py`

```python
import re
from typing import Optional


def validate_domain_name(domain: str) -> dict:
    """
    Validate a domain name.
    
    Rules:
    - 3-63 characters
    - Letters, numbers, hyphens only
    - Cannot start or end with hyphen
    - Cannot have consecutive hyphens
    - Valid TLD required
    
    Returns:
        {"valid": True} or {"valid": False, "error": "reason"}
    """
    if not domain:
        return {"valid": False, "error": "Domain name is required"}
    
    domain = domain.strip().lower()
    
    # Length check
    if len(domain) < 3:
        return {"valid": False, "error": "Domain must be at least 3 characters"}
    
    if len(domain) > 63:
        return {"valid": False, "error": "Domain must be less than 63 characters"}
    
    # Character check
    if not re.match(r'^[a-z0-9]([a-z0-9-]*[a-z0-9])?$', domain):
        return {"valid": False, "error": "Domain contains invalid characters"}
    
    # No consecutive hyphens
    if '--' in domain:
        return {"valid": False, "error": "Domain cannot have consecutive hyphens"}
    
    # TLD check
    valid_tlds = [
        'co.tz', 'tz', 'ac.tz', 'or.tz', 'go.tz', 'ne.tz',
        'com', 'net', 'org', 'io', 'africa', 'info', 'biz',
    ]
    
    parts = domain.rsplit('.', 1)
    if len(parts) != 2:
        return {"valid": False, "error": "Invalid domain format"}
    
    # Check for .xx.tz style TLDs
    if len(parts) == 2:
        tld = parts[1]
        if tld not in ['tz', 'com', 'net', 'org', 'io', 'africa', 'info', 'biz']:
            return {"valid": False, "error": f"Unsupported TLD: .{tld}"}
    
    return {"valid": True, "domain": domain}


def validate_phone_number(phone: str) -> dict:
    """
    Validate Tanzanian phone number.
    
    Accepts:
    - 0712345678
    - +255712345678
    - 255712345678
    """
    phone = phone.strip().replace(' ', '').replace('-', '')
    
    pattern = r'^(?:\+?255|0)?7[0-9]{8}$'
    if not re.match(pattern, phone):
        return {"valid": False, "error": "Invalid Tanzanian phone number"}
    
    # Normalize
    if phone.startswith('+'):
        phone = phone[1:]
    elif phone.startswith('0'):
        phone = '255' + phone[1:]
    
    return {"valid": True, "phone": phone}


def validate_email(email: str) -> dict:
    """Validate email address."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return {"valid": False, "error": "Invalid email address"}
    return {"valid": True, "email": email.strip().lower()}


def sanitize_user_input(text: str) -> str:
    """
    Sanitize user input to prevent XSS and injection.
    """
    import html
    return html.escape(text.strip())
```

---

## Fraud Detection

### `utils/fraud_detection.py`

```python
from datetime import datetime, timedelta
from django.db import connection


async def check_registration_fraud(user_id: str, domain_name: str) -> dict:
    """
    Check for suspicious domain registration patterns.
    
    Returns:
        {
            "risk_level": "low" | "medium" | "high",
            "reasons": ["..."],
            "block": False,
        }
    """
    risk_level = "low"
    reasons = []
    block = False
    
    # Rule 1: Too many registrations in 24 hours (> 10)
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT COUNT(*) FROM domains
            WHERE user_id = %s AND created_at > NOW() - INTERVAL '24 hours'
        """, [user_id])
        count_24h = cursor.fetchone()[0]
    
    if count_24h > 10:
        risk_level = "high"
        reasons.append("Too many registrations in 24 hours")
        block = True
    elif count_24h > 5:
        risk_level = "medium"
        reasons.append("Many registrations in 24 hours")
    
    # Rule 2: Suspicious TLD patterns (.tk, .ml, .ga are free TLDs often used for abuse)
    suspicious_tlds = ['.tk', '.ml', '.ga', '.cf', '.gq']
    for tld in suspicious_tlds:
        if domain_name.endswith(tld):
            risk_level = "high"
            reasons.append(f"Suspicious TLD: {tld}")
            block = True
    
    # Rule 3: Too many failed payments
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT COUNT(*) FROM payments
            WHERE user_id = %s 
              AND status = 'failed'
              AND created_at > NOW() - INTERVAL '1 hour'
        """, [user_id])
        failed_payments = cursor.fetchone()[0]
    
    if failed_payments > 5:
        risk_level = "high"
        reasons.append("Too many failed payment attempts")
        block = True
    
    return {
        "risk_level": risk_level,
        "reasons": reasons,
        "block": block,
    }
```

---

## AI Website Builder Integration

### `services/ai_builder.py`

```python
import httpx
import os
from typing import Optional


class AIWebsiteBuilderService:
    """
    Generate website content using AI (OpenAI).
    Stores generated pages in Supabase DB.
    """
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.model = "gpt-4o-mini"
    
    async def generate_website(
        self,
        business_name: str,
        business_type: str,
        description: str,
        locale: str = 'sw',
        features: list[str] = None,
    ) -> dict:
        """
        Generate a complete landing page for a business.
        
        Args:
            business_name: Name of the business
            business_type: Type (restaurant, shop, service, etc.)
            description: Brief business description
            locale: 'sw' for Swahili, 'en' for English
            features: List of desired features
        
        Returns:
            {
                "html": "<html>...</html>",
                "sections": ["hero", "about", "services", "contact"],
                "preview_url": "/preview/uuid",
            }
        """
        system_prompt = self._build_system_prompt(locale)
        user_prompt = self._build_user_prompt(
            business_name, business_type, description, features
        )
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    'Authorization': f'Bearer {self.api_key}',
                    'Content-Type': 'application/json',
                },
                json={
                    'model': self.model,
                    'messages': [
                        {'role': 'system', 'content': system_prompt},
                        {'role': 'user', 'content': user_prompt},
                    ],
                    'max_tokens': 4000,
                    'temperature': 0.7,
                },
            )
        
        result = response.json()
        html_content = result['choices'][0]['message']['content']
        
        # Save to Supabase
        page_id = await self._save_page(user_id, html_content)
        
        return {
            "html": html_content,
            "page_id": page_id,
            "sections": ["hero", "about", "services", "contact"],
        }
    
    def _build_system_prompt(self, locale: str) -> str:
        if locale == 'sw':
            return (
                "Wewe ni msanidi programu wa tovuti mwenye ujuzi. "
                "Tengeneza ukurasa wa landing wa HTML wa kisasa, "
                "mwepesi, na mzuri kwa biashara ndogo za Kitanzania. "
                "Tumia Tailwind CSS kwa styling. "
                "Panga kwa Kiswahili. "
                "Panga sehemu: hero, kuhusu, huduma, wasiliana."
            )
        return (
            "You are an expert web developer. Generate a modern, clean, "
            "responsive HTML landing page using Tailwind CSS for small "
            "Tanzanian businesses. Include sections: hero, about, "
            "services, contact. Use professional design."
        )
    
    def _build_user_prompt(self, name, type, desc, features) -> str:
        features_str = ", ".join(features or [])
        return (
            f"Business: {name}\n"
            f"Type: {type}\n"
            f"Description: {desc}\n"
            f"Features needed: {features_str}\n"
            f"Generate a complete HTML page with inline Tailwind CSS."
        )
    
    async def _save_page(self, user_id: str, html: str) -> str:
        """Save generated page to Supabase database."""
        import uuid
        page_id = str(uuid.uuid4())
        
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO website_pages (id, user_id, html, created_at)
                VALUES (%s, %s, %s, NOW())
            """, [page_id, user_id, html])
        
        return page_id


# Singleton
ai_builder = AIWebsiteBuilderService()
```
