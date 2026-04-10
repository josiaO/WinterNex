# SMS Notifications

## Overview

DomainHub uses SMS as the **primary notification channel** for the Tanzanian market, where mobile phone penetration is high and SMS is more reliable than email. Django handles all SMS sending through a background task queue.

**SMS Provider Options:**
| Provider | Region | Features | Cost (TZS) |
|---|---|---|---|
| Africa's Talking | Africa | Delivery reports, bulk, schedules | ~15/SMS |
| Twilio | Global | Multi-channel, verified sender | ~30/SMS |
| Bongo Live | Tanzania | Local provider, low cost | ~10/SMS |

---

## SMS Template System

### Templates in Swahili + English

```python
# services/sms_service.py

SMS_TEMPLATES = {
    # Domain Registration
    'domain_registered': {
        'sw': (
            "Karibu! Jina lako la tovuti {domain} limeandikishwa kwa mafanikio.\n"
            "Kikwazo: {expiry_date}\n"
            "Asante kwa kutumia DomainHub."
        ),
        'en': (
            "Welcome! Your domain {domain} has been registered successfully.\n"
            "Expires: {expiry_date}\n"
            "Thank you for using DomainHub."
        ),
    },
    
    # Payment Confirmation
    'payment_confirmed': {
        'sw': (
            "Malipo yako ya {amount} TZS kwa {description} yamekamilika.\n"
            "Namba ya risiti: {receipt}\n"
            "Asante!"
        ),
        'en': (
            "Your payment of {amount} TZS for {description} is confirmed.\n"
            "Receipt #: {receipt}\n"
            "Thank you!"
        ),
    },
    
    # Payment Failed
    'payment_failed': {
        'sw': (
            "Malipo yako ya {amount} TZS hayajakamilika.\n"
            "Tafadhali jaribu tena au wasiliana nasi kupitia WhatsApp."
        ),
        'en': (
            "Your payment of {amount} TZS was not completed.\n"
            "Please try again or contact us via WhatsApp."
        ),
    },
    
    # Domain Expiry Warning (60 days)
    'expiry_60_days': {
        'sw': (
            "TAARIFA: Jina lako la tovuti {domain} litakwisha mnamo {expiry_date} "
            "(siku 60).\n"
            "Sasisha sasa ili kuepuka kutokuwa na jina.\n"
            "Bei ya kusasisha: {renewal_price} TZS/mwaka\n"
            "Nenda: https://domainhub.co.tz/dashboard"
        ),
        'en': (
            "NOTICE: Your domain {domain} expires on {expiry_date} (60 days).\n"
            "Renew now to avoid losing your domain.\n"
            "Renewal price: {renewal_price} TZS/year\n"
            "Go to: https://domainhub.co.tz/dashboard"
        ),
    },
    
    # Domain Expiry Warning (30 days)
    'expiry_30_days': {
        'sw': (
            "HATARI: Jina lako {domain} litakwisha mnamo {expiry_date} "
            "(siku 30)!\n"
            "Lipa sasa kupitia M-Pesa: {mpesa_instructions}"
        ),
        'en': (
            "WARNING: Your domain {domain} expires on {expiry_date} (30 days)!\n"
            "Pay now via M-Pesa: {mpesa_instructions}"
        ),
    },
    
    # Domain Expiry Warning (7 days)
    'expiry_7_days': {
        'sw': (
            "HATARI KUBWA: Jina lako {domain} litakwisha siku 7!\n"
            "Sasisha MARA MOJA kupitia M-Pesa.\n"
            "Simu: {support_phone}"
        ),
        'en': (
            "CRITICAL: Your domain {domain} expires in 7 days!\n"
            "Renew IMMEDIATELY via M-Pesa.\n"
            "Call: {support_phone}"
        ),
    },
    
    # Domain Expired
    'domain_expired': {
        'sw': (
            "Jina lako la tovuti {domain} limekwisha!\n"
            "Unaweza kulisasisha ndani ya siku 30 kabla ya kuwekwa kwa wengine.\n"
            "Sasisha sasa: https://domainhub.co.tz/renew"
        ),
        'en': (
            "Your domain {domain} has expired!\n"
            "You can renew it within 30 days before it becomes available to others.\n"
            "Renew now: https://domainhub.co.tz/renew"
        ),
    },
    
    # Auto-Renewal Success
    'auto_renewal_success': {
        'sw': (
            "Jina lako {domain} limefasiriwa kwa mafanikio kupitia auto-renewal.\n"
            "Kikwazo kipya: {new_expiry_date}\n"
            "Kiasi: {amount} TZS"
        ),
        'en': (
            "Your domain {domain} was renewed successfully via auto-renewal.\n"
            "New expiry: {new_expiry_date}\n"
            "Amount: {amount} TZS"
        ),
    },
    
    # DNS Change Notification
    'dns_changed': {
        'sw': (
            "Mabadiliko ya DNS yamefanywa kwenye {domain}.\n"
            "Aina: {record_type} | Jina: {record_host}\n"
            "Ikiwa hujafanya mabadiliko haya, wasiliana nasi MARA MOJA."
        ),
        'en': (
            "DNS changes were made on {domain}.\n"
            "Type: {record_type} | Name: {record_host}\n"
            "If you didn't make these changes, contact us IMMEDIATELY."
        ),
    },
    
    # Welcome New User
    'welcome_user': {
        'sw': (
            "Karibu DomainHub, {name}!\n"
            "Tafuta jina lako la tovuti: https://domainhub.co.tz/search\n"
            "Msaada: WhatsApp {support_phone}"
        ),
        'en': (
            "Welcome to DomainHub, {name}!\n"
            "Search for your domain: https://domainhub.co.tz/search\n"
            "Support: WhatsApp {support_phone}"
        ),
    },
}
```

---

## SMS Service Implementation

### `services/sms_service.py`

```python
import os
import httpx
from typing import Optional
from dataclasses import dataclass


@dataclass
class SMSMessage:
    to: str
    message: str
    template_key: Optional[str] = None
    template_vars: Optional[dict] = None


class SMSService:
    """
    SMS sending service using Africa's Talking API.
    Fallback to Twilio for reliability.
    """
    
    def __init__(self):
        # Africa's Talking (Primary)
        self.at_username = os.getenv("AT_USERNAME")
        self.at_api_key = os.getenv("AT_API_KEY")
        self.at_sender_id = os.getenv("AT_SENDER_ID", "DomainHub")
        self.at_base_url = "https://api.africastalking.com/v1"
        
        # Twilio (Fallback)
        self.twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_number = os.getenv("TWILIO_FROM_NUMBER")
    
    def _format_template(self, template_key: str, variables: dict, locale: str = 'sw') -> str:
        """
        Format an SMS template with variables.
        
        Args:
            template_key: Key from SMS_TEMPLATES
            variables: Dict of variable names to values
            locale: 'sw' for Swahili, 'en' for English
        
        Returns:
            Formatted message string.
        """
        template = SMS_TEMPLATES.get(template_key)
        if not template:
            raise ValueError(f"Unknown SMS template: {template_key}")
        
        message = template.get(locale, template.get('en', ''))
        
        # Replace placeholders
        for key, value in variables.items():
            message = message.replace(f'{{{key}}}', str(value))
        
        return message.strip()
    
    def _normalize_phone(self, phone: str) -> str:
        """Normalize phone to international format."""
        phone = phone.strip().replace(' ', '').replace('-', '')
        if phone.startswith('+'):
            return phone
        if phone.startswith('0'):
            return '+255' + phone[1:]
        if phone.startswith('255'):
            return '+' + phone
        return phone
    
    async def send(
        self,
        to: str,
        message: str,
        sender_id: str = None,
    ) -> dict:
        """
        Send an SMS message.
        
        Args:
            to: Recipient phone number
            message: SMS body (max 160 chars for standard SMS)
            sender_id: Custom sender ID (default: DomainHub)
        
        Returns:
            {
                "status": "sent",
                "message_id": "msg-uuid",
                "cost": 15,
                "provider": "africas_talking",
            }
        """
        phone = self._normalize_phone(to)
        sender = sender_id or self.at_sender_id
        
        # Try Africa's Talking first
        try:
            result = await self._send_africas_talking(phone, message, sender)
            return result
        except Exception as e:
            print(f"Africa's Talking failed: {e}")
        
        # Fallback to Twilio
        try:
            result = await self._send_twilio(phone, message)
            return result
        except Exception as e:
            print(f"Twilio also failed: {e}")
            raise Exception(f"All SMS providers failed. Last error: {e}")
    
    async def send_templated(
        self,
        to: str,
        template_key: str,
        variables: dict,
        locale: str = 'sw',
    ) -> dict:
        """
        Send an SMS using a template.
        
        Args:
            to: Recipient phone number
            template_key: Key from SMS_TEMPLATES
            variables: Template variables dict
            locale: Language ('sw' or 'en')
        """
        message = self._format_template(template_key, variables, locale)
        
        # Truncate if over 160 characters (standard SMS limit)
        if len(message) > 160:
            message = message[:157] + "..."
        
        return await self.send(to, message)
    
    async def _send_africas_talking(
        self, to: str, message: str, sender: str
    ) -> dict:
        """Send via Africa's Talking API."""
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{self.at_base_url}/messaging",
                headers={
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'apiKey': self.at_api_key,
                },
                data={
                    'username': self.at_username,
                    'to': to,
                    'message': message,
                    'from': sender,
                },
            )
        
        result = response.json()
        
        if 'SMSMessageData' in result:
            recipients = result['SMSMessageData'].get('Recipients', [])
            if recipients:
                return {
                    "status": "sent",
                    "message_id": recipients[0].get('messageId'),
                    "cost": recipients[0].get('cost', 0),
                    "provider": "africas_talking",
                }
        
        raise Exception(f"Africa's Talking error: {result}")
    
    async def _send_twilio(self, to: str, message: str) -> dict:
        """Send via Twilio API."""
        auth = (self.twilio_sid, self.twilio_token)
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{self.twilio_sid}/Messages.json",
                auth=auth,
                data={
                    'From': self.twilio_number,
                    'To': to,
                    'Body': message,
                },
            )
        
        result = response.json()
        
        if response.status_code == 201:
            return {
                "status": "sent",
                "message_id": result.get('sid'),
                "cost": result.get('price', '0'),
                "provider": "twilio",
            }
        
        raise Exception(f"Twilio error: {result}")


# Singleton
sms_service = SMSService()
```

---

## SMS Queue & Background Tasks

### Celery Tasks for SMS

```python
# tasks/sms_tasks.py

from celery import shared_task
from services.sms_service import sms_service


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_sms_async(self, to: str, template_key: str, variables: dict, locale: str = 'sw'):
    """
    Send SMS asynchronously with retry logic.
    Retries up to 3 times with 60-second delay between attempts.
    """
    try:
        result = sms_service.send_templated(
            to=to,
            template_key=template_key,
            variables=variables,
            locale=locale,
        )
        return result
    except Exception as e:
        # Retry with exponential backoff
        raise self.retry(exc=e)


@shared_task
def send_bulk_sms(recipients: list[dict]):
    """
    Send SMS to multiple recipients.
    
    Args:
        recipients: List of {to, template_key, variables, locale}
    """
    results = []
    for recipient in recipients:
        send_sms_async.delay(
            to=recipient['to'],
            template_key=recipient['template_key'],
            variables=recipient['variables'],
            locale=recipient.get('locale', 'sw'),
        )
    return {"queued": len(recipients)}
```

---

## SMS Notification Triggers

### When to Send SMS

| Event | Template | Timing | Priority |
|---|---|---|---|
| New user signup | `welcome_user` | Immediately | Low |
| Domain registered | `domain_registered` | After payment confirmed | High |
| Payment confirmed | `payment_confirmed` | After callback verified | High |
| Payment failed | `payment_failed` | After failure detected | Medium |
| Domain expiring (60d) | `expiry_60_days` | Cron: daily | Medium |
| Domain expiring (30d) | `expiry_30_days` | Cron: daily | High |
| Domain expiring (7d) | `expiry_7_days` | Cron: daily | Critical |
| Domain expired | `domain_expired` | On expiry date | Critical |
| Auto-renewal success | `auto_renewal_success` | After renewal | High |
| DNS change | `dns_changed` | After DNS update | High |
| Suspicious activity | `dns_changed` (repurpose) | Immediately | Critical |

### Django Signal-based Triggers

```python
# services/notification_triggers.py

from django.db import connection
from datetime import datetime, timedelta
from tasks.sms_tasks import send_sms_async


async def on_payment_completed(payment: dict, user: dict):
    """Triggered when a payment is confirmed."""
    locale = user.get('locale', 'sw')
    
    # Send payment confirmation SMS
    send_sms_async.delay(
        to=user['phone'],
        template_key='payment_confirmed',
        variables={
            'amount': format_tzs(payment['amount']),
            'description': payment['description'],
            'receipt': payment.get('provider_transaction_id', 'N/A')[:10],
        },
        locale=locale,
    )


async def on_domain_registered(domain: dict, user: dict):
    """Triggered after domain registration is confirmed."""
    locale = user.get('locale', 'sw')
    
    send_sms_async.delay(
        to=user['phone'],
        template_key='domain_registered',
        variables={
            'domain': domain['name'],
            'expiry_date': format_date(domain['expiry_date'], locale),
        },
        locale=locale,
    )


async def check_and_send_expiry_reminders():
    """
    Daily cron job: Check all domains and send expiry reminders.
    
    Run via Celery Beat: 0 8 * * * (every day at 8:00 AM EAT)
    """
    thresholds = [
        (60, 'expiry_60_days'),
        (30, 'expiry_30_days'),
        (7, 'expiry_7_days'),
    ]
    
    for days, template_key in thresholds:
        target_date = datetime.utcnow() + timedelta(days=days)
        
        # Query domains expiring within this window
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT d.name, d.expiry_date, p.phone, p.locale, d.renewal_price
                FROM domains d
                JOIN profiles p ON d.user_id = p.id
                WHERE d.expiry_date BETWEEN %s AND %s
                  AND d.status = 'active'
                  AND d.auto_renew = false
            """, [target_date - timedelta(days=1), target_date + timedelta(days=1)])
            
            rows = cursor.fetchall()
        
        for row in rows:
            domain_name, expiry_date, phone, locale, renewal_price = row
            locale = locale or 'sw'
            
            send_sms_async.delay(
                to=phone,
                template_key=template_key,
                variables={
                    'domain': domain_name,
                    'expiry_date': format_date(expiry_date, locale),
                    'renewal_price': format_tzs(renewal_price),
                    'mpesa_instructions': f'Lipa {renewal_price} TZS kupitia M-Pesa',
                    'support_phone': '+255712345678',
                },
                locale=locale,
            )


async def check_expired_domains():
    """
    Daily cron: Mark expired domains and notify owners.
    
    Run via Celery Beat: 0 0 * * * (midnight EAT)
    """
    today = datetime.utcnow().date()
    
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT d.name, d.id, p.phone, p.locale
            FROM domains d
            JOIN profiles p ON d.user_id = p.id
            WHERE d.expiry_date::date = %s
              AND d.status = 'active'
        """, [today])
        
        rows = cursor.fetchall()
    
    for row in rows:
        domain_name, domain_id, phone, locale = rows
        locale = locale or 'sw'
        
        # Update domain status
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE domains SET status = 'expired' WHERE id = %s",
                [domain_id]
            )
        
        # Send expiry notification
        send_sms_async.delay(
            to=phone,
            template_key='domain_expired',
            variables={
                'domain': domain_name,
            },
            locale=locale,
        )
```

---

## SMS Analytics & Logging

### Track SMS Delivery

```sql
-- SMS log table
CREATE TABLE sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    phone_number VARCHAR(20) NOT NULL,
    template_key VARCHAR(50),
    message TEXT NOT NULL,
    locale VARCHAR(2) DEFAULT 'sw',
    status VARCHAR(20) DEFAULT 'sent',  -- sent, delivered, failed
    provider VARCHAR(20),
    message_id VARCHAR(100),
    cost INTEGER,  -- in TZS cents
    error TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ
);

CREATE INDEX idx_sms_logs_user ON sms_logs(user_id);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);
CREATE INDEX idx_sms_logs_date ON sms_logs(sent_at);
```

### Helper Functions

```python
# utils/sms_helpers.py

def format_tzs(amount: int) -> str:
    """Format amount as TZS currency string."""
    if amount >= 1000:
        return f"{amount:,.0f} TZS"
    return f"{amount} TZS"


def format_date(date: datetime, locale: str = 'sw') -> str:
    """Format date in DD/MM/YYYY (Tanzanian format)."""
    return date.strftime("%d/%m/%Y")
```
