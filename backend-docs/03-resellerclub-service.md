# ResellerClub API Integration

## Overview

DomainHub uses the **ResellerClub API** as the domain registrar backend. All domain operations (search, registration, DNS management, transfers, WHOIS) are proxied through Django to ensure API keys are never exposed to the frontend.

---

## Architecture

```
Frontend (Next.js)
    ↓ POST /api/domains/search
Django API
    ↓ HTTPS + API Key
ResellerClub API
    ↓ Response
Django API
    ↓ JSON response
Frontend
```

---

## ResellerClub API Client

### `services/resellerclub.py`

```python
import httpx
import os
import xml.etree.ElementTree as ET
from typing import Optional
from datetime import datetime


class ResellerClubAPIError(Exception):
    """Raised when ResellerClub API returns an error."""
    def __init__(self, status: str, message: str):
        self.status = status
        self.message = message
        super().__init__(f"[{status}] {message}")


class ResellerClubService:
    """
    ResellerClub API client for domain operations.
    
    Supports both TEST and LIVE environments.
    - TEST: https://test.httpapi.com/api/domains
    - LIVE: https://httpapi.com/api/domains
    """
    
    def __init__(self):
        self.api_key = os.getenv("RESELLERCLUB_API_KEY")
        self.reseller_id = os.getenv("RESELLERCLUB_RESELLER_ID")
        self.base_url = os.getenv(
            "RESELLERCLUB_API_URL",
            "https://test.httpapi.com/api/domains"
        )
    
    def _build_url(self, endpoint: str) -> str:
        """Build the full API URL with auth parameters."""
        return f"{self.base_url}{endpoint}?auth-userid={self.reseller_id}&api-key={self.api_key}"
    
    async def _get(self, endpoint: str, params: dict = None) -> dict:
        """Make a GET request to the ResellerClub API."""
        url = self._build_url(endpoint)
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params=params)
            
        if response.status_code != 200:
            raise ResellerClubAPIError(
                status=str(response.status_code),
                message=f"HTTP error: {response.text}"
            )
        
        return self._parse_response(response.text)
    
    async def _post(self, endpoint: str, data: dict = None) -> dict:
        """Make a POST request to the ResellerClub API."""
        url = self._build_url(endpoint)
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, data=data)
        
        if response.status_code != 200:
            raise ResellerClubAPIError(
                status=str(response.status_code),
                message=f"HTTP error: {response.text}"
            )
        
        return self._parse_response(response.text)
    
    def _parse_response(self, response_text: str) -> dict:
        """
        Parse ResellerClub API response (XML or JSON).
        Returns a unified dict with status and data.
        """
        response_text = response_text.strip()
        
        # Try JSON first
        if response_text.startswith('{') or response_text.startswith('['):
            import json
            data = json.loads(response_text)
            if 'status' in data and data['status'] == 'error':
                raise ResellerClubAPIError(
                    status='error',
                    message=data.get('error', 'Unknown error')
                )
            return data
        
        # Parse XML
        try:
            root = ET.fromstring(response_text)
            result = {}
            
            # Check for error response
            status = root.find('.//status')
            if status is not None and status.text == 'error':
                error_msg = root.find('.//message')
                error_code = root.find('.//errorcode')
                raise ResellerClubAPIError(
                    status=error_code.text if error_code is not None else 'error',
                    message=error_msg.text if error_msg is not None else 'Unknown error'
                )
            
            # Flatten XML to dict
            for child in root:
                result[child.tag] = child.text
            
            return result
        except ET.ParseError:
            return {'raw': response_text}


# Singleton instance
resellerclub = ResellerClubService()
```

---

## Domain Operations

### 1. Domain Availability Check

```python
class ResellerClubService:
    # ... (previous code)
    
    async def check_availability(self, domain_name: str) -> dict:
        """
        Check if a domain is available for registration.
        
        Args:
            domain_name: The domain to check (e.g., "example.co.tz")
        
        Returns:
            {
                "status": "available" | "taken" | "invalid",
                "suggestions": ["example-tz.co.tz", "myexample.co.tz"],
                "tld_pricing": {
                    ".co.tz": {"register": 25000, "renew": 30000},
                    ".com": {"register": 35000, "renew": 35000},
                }
            }
        """
        # Extract domain name and TLD
        parts = domain_name.rsplit('.', 1)
        if len(parts) != 2:
            return {"status": "invalid", "domain": domain_name}
        
        name, tld = parts
        
        # Check availability for the requested TLD
        try:
            result = await self._get('/available.json', {
                'domain-name': name,
                'tlds': tld,
            })
            
            status = 'available' if result.get(name + '.' + tld) == 'available' else 'taken'
            
        except ResellerClubAPIError:
            status = 'taken'
        
        # Also check alternative TLDs for suggestions
        alt_tlds = ['.co.tz', '.tz', '.com', '.africa', '.net', '.org']
        tld_results = {}
        
        for alt_tld in alt_tlds:
            if alt_tld != f'.{tld}':
                try:
                    alt_result = await self._get('/available.json', {
                        'domain-name': name,
                        'tlds': alt_tld.replace('.', ''),
                    })
                    available = alt_result.get(name + alt_tld) == 'available'
                    tld_results[alt_tld] = available
                except:
                    tld_results[alt_tld] = None  # Unknown
        
        # Generate similar name suggestions if taken
        suggestions = []
        if status == 'taken':
            prefixes = ['my', 'the', 'get', 'try']
            for prefix in prefixes:
                suggestions.append(f"{prefix}{name}.{tld}")
        
        return {
            "status": status,
            "domain": domain_name,
            "suggestions": suggestions,
            "alt_tlds": tld_results,
        }
    
    async def get_suggestions(self, domain_name: str) -> list[str]:
        """
        Get alternative domain name suggestions.
        
        Args:
            domain_name: The original domain query.
        
        Returns:
            List of suggested domain names.
        """
        try:
            result = await self._get('/suggest-names.json', {
                'keyword': domain_name,
                'tlds': 'co.tz,tz,com,africa',
                'count': 10,
            })
            return result.get('suggestions', [])
        except:
            return []
```

### 2. Domain Registration

```python
class ResellerClubService:
    # ... (previous code)
    
    async def register_domain(
        self,
        domain_name: str,
        years: int = 1,
        customer_id: str = None,
        contact_ids: dict = None,
        ns: list[str] = None,
        enable_privacy: bool = False,
        purchase_privacy: bool = False,
    ) -> dict:
        """
        Register a new domain via ResellerClub.
        
        Args:
            domain_name: Full domain name (e.g., "example.co.tz")
            years: Registration period in years (1-10)
            customer_id: ResellerClub customer ID
            contact_ids: Dict with registrant, admin, tech, billing contact IDs
            ns: List of nameservers
            enable_privacy: Enable WHOIS privacy
            purchase_privacy: Purchase privacy protection
        
        Returns:
            {
                "status": "success",
                "domain": "example.co.tz",
                "order_id": "123456",
                "entity_id": "789012",
                "expiry_date": "2026-01-15"
            }
        """
        data = {
            'domain-name': domain_name,
            'years': str(years),
            'ns': ','.join(ns or ['ns1.domainhub.co.tz', 'ns2.domainhub.co.tz']),
            'customer-id': customer_id,
            'reg-contact-id': contact_ids.get('registrant', ''),
            'admin-contact-id': contact_ids.get('admin', ''),
            'tech-contact-id': contact_ids.get('tech', ''),
            'billing-contact-id': contact_ids.get('billing', ''),
            'invoice-option': 'NoInvoice',
            'enable-privacy': 'true' if enable_privacy else 'false',
            'purchase-privacy': 'true' if purchase_privacy else 'false',
        }
        
        result = await self._post('/register.json', data)
        
        return {
            "status": "success",
            "domain": domain_name,
            "order_id": result.get('actionstatusid') or result.get('entityid'),
            "entity_id": result.get('entityid'),
            "description": result.get('description', ''),
        }
```

### 3. Contact Management

```python
class ResellerClubService:
    # ... (previous code)
    
    async def create_contact(
        self,
        name: str,
        email: str,
        phone: str,
        company: str = "",
        address1: str = "",
        city: str = "",
        state: str = "",
        country: str = "TZ",
        zipcode: str = "",
        customer_id: str = None,
    ) -> str:
        """
        Create a contact in ResellerClub for domain registration.
        
        Returns:
            Contact ID string.
        """
        data = {
            'name': name,
            'company': company,
            'email': email,
            'address-line-1': address1,
            'city': city,
            'state': state,
            'country': country,
            'zipcode': zipcode,
            'phone': phone,
            'customer-id': customer_id,
            'type': 'Contact',
        }
        
        result = await self._post('/contact.json', data)
        return str(result.get('entityid'))
    
    async def create_customer(
        self,
        name: str,
        email: str,
        phone: str,
        company: str = "",
        address1: str = "",
        city: str = "",
        state: str = "",
        country: str = "TZ",
        zipcode: str = "",
        password: str = None,
    ) -> str:
        """
        Create a customer account in ResellerClub.
        
        Returns:
            Customer ID string.
        """
        data = {
            'name': name,
            'company': company,
            'email': email,
            'address-line-1': address1,
            'city': city,
            'state': state,
            'country': country,
            'zipcode': zipcode,
            'phone': phone,
            'lang-pref': 'en',
            'password': password or self._generate_password(),
        }
        
        result = await self._post('/customers/signup.json', data)
        return str(result.get('customerid'))
    
    def _generate_password(self, length: int = 16) -> str:
        """Generate a random password for ResellerClub customer."""
        import secrets
        import string
        alphabet = string.ascii_letters + string.digits + "!@#$%"
        return ''.join(secrets.choice(alphabet) for _ in range(length))
```

### 4. DNS Management

```python
class ResellerClubService:
    # ... (previous code)
    
    async def get_dns_records(self, domain_name: str) -> list[dict]:
        """
        Get all DNS records for a domain.
        
        Returns:
            List of DNS record dicts with type, name, value, ttl.
        """
        try:
            result = await self._get('/dns/manage/search-records.json', {
                'domain-name': domain_name,
                'no-of-records': 100,
                'page-no': 1,
            })
            
            records = result.get('records', [])
            return [
                {
                    'id': r.get('recordid'),
                    'type': r.get('type'),
                    'name': r.get('host'),
                    'value': r.get('value'),
                    'ttl': r.get('ttl'),
                    'priority': r.get('priority'),
                }
                for r in records
            ]
        except ResellerClubAPIError:
            return []
    
    async def add_dns_record(
        self,
        domain_name: str,
        record_type: str,
        value: str,
        host: str = "@",
        ttl: int = 3600,
        priority: int = None,
    ) -> dict:
        """
        Add a DNS record.
        
        Args:
            domain_name: Domain to add record to
            record_type: A, AAAA, CNAME, MX, TXT, SRV, NS
            value: Record value
            host: Host/subdomain (default: @ for root)
            ttl: Time to live in seconds
            priority: MX priority (required for MX records)
        """
        data = {
            'domain-name': domain_name,
            'type': record_type,
            'value': value,
            'host': host,
            'ttl': str(ttl),
        }
        
        if record_type == 'MX' and priority:
            data['priority'] = str(priority)
        
        result = await self._post('/dns/manage/add-record.json', data)
        return {"status": "success", "record_id": result.get('recordid')}
    
    async def modify_dns_record(
        self,
        domain_name: str,
        record_id: int,
        value: str,
        host: str = None,
        ttl: int = None,
        priority: int = None,
    ) -> dict:
        """Modify an existing DNS record."""
        data = {
            'domain-name': domain_name,
            'record-id': str(record_id),
            'value': value,
        }
        
        if host: data['host'] = host
        if ttl: data['ttl'] = str(ttl)
        if priority: data['priority'] = str(priority)
        
        await self._post('/dns/manage/modify-record.json', data)
        return {"status": "success"}
    
    async def delete_dns_record(self, domain_name: str, record_id: int) -> dict:
        """Delete a DNS record."""
        await self._post('/dns/manage/delete-record.json', {
            'domain-name': domain_name,
            'record-id': str(record_id),
        })
        return {"status": "success"}
    
    async def manage_nameservers(
        self,
        domain_name: str,
        nameservers: list[str],
    ) -> dict:
        """
        Update nameservers for a domain.
        """
        for i, ns in enumerate(nameservers, 1):
            await self._post('/dns/manage/add-ns.json', {
                'domain-name': domain_name,
                'nameserver': ns,
                'index': str(i),
            })
        
        return {"status": "success", "nameservers": nameservers}
```

### 5. Domain Transfer

```python
class ResellerClubService:
    # ... (previous code)
    
    async def transfer_domain(
        self,
        domain_name: str,
        auth_code: str,
        customer_id: str,
        contact_ids: dict,
    ) -> dict:
        """
        Initiate a domain transfer from another registrar.
        """
        data = {
            'domain-name': domain_name,
            'auth-code': auth_code,
            'customer-id': customer_id,
            'reg-contact-id': contact_ids.get('registrant'),
            'admin-contact-id': contact_ids.get('admin'),
            'tech-contact-id': contact_ids.get('tech'),
            'billing-contact-id': contact_ids.get('billing'),
            'invoice-option': 'NoInvoice',
        }
        
        result = await self._post('/transfer.json', data)
        return {
            "status": "success",
            "domain": domain_name,
            "order_id": result.get('entityid'),
        }
```

### 6. Domain Info & WHOIS

```python
class ResellerClubService:
    # ... (previous code)
    
    async def get_domain_details(self, domain_name: str) -> dict:
        """Get detailed domain information."""
        result = await self._get('/details.json', {
            'domain-name': domain_name,
            'options': 'All',
        })
        return result
    
    async def get_domain_order_id(self, domain_name: str) -> str:
        """Get the ResellerClub order ID for a domain."""
        result = await self._get('/orderid.json', {
            'domain-name': domain_name,
        })
        return str(result.get('entityid', ''))
    
    async def enable_privacy(self, domain_name: str) -> dict:
        """Enable WHOIS privacy protection."""
        order_id = await self.get_domain_order_id(domain_name)
        await self._post('/privacy/enable.json', {
            'order-id': order_id,
        })
        return {"status": "success"}
    
    async def disable_privacy(self, domain_name: str) -> dict:
        """Disable WHOIS privacy protection."""
        order_id = await self.get_domain_order_id(domain_name)
        await self._post('/privacy/disable.json', {
            'order-id': order_id,
        })
        return {"status": "success"}
    
    async def lock_domain(self, domain_name: str) -> dict:
        """Lock a domain to prevent unauthorized transfers."""
        order_id = await self.get_domain_order_id(domain_name)
        await self._post('/domain-lock/enable.json', {
            'order-id': order_id,
        })
        return {"status": "success"}
    
    async def unlock_domain(self, domain_name: str) -> dict:
        """Unlock a domain for transfer."""
        order_id = await self.get_domain_order_id(domain_name)
        await self._post('/domain-lock/disable.json', {
            'order-id': order_id,
        })
        return {"status": "success"}
```

### 7. Pricing

```python
class ResellerClubService:
    # ... (previous code)
    
    async def get_tld_pricing(self, tld: str) -> dict:
        """
        Get pricing for a specific TLD.
        
        Returns:
            {
                "register": 25000,  # TZS
                "renew": 30000,
                "transfer": 35000,
                "restore": 50000,
            }
        """
        result = await self._get('/reseller-price.json', {
            'tld': tld,
        })
        
        # Convert to TZS (ResellerClub returns in USD)
        usd_to_tzs = 2700  # Approximate rate, should use live rate
        pricing = result.get(tld, {})
        
        return {
            "register": int(float(pricing.get('addnewdomain.cost', 0)) * usd_to_tzs),
            "renew": int(float(pricing.get('renewdomain.cost', 0)) * usd_to_tzs),
            "transfer": int(float(pricing.get('transferdomain.cost', 0)) * usd_to_tzs),
            "restore": int(float(pricing.get('restoredomain.cost', 0)) * usd_to_tzs),
        }
```

---

## Error Handling

All ResellerClub errors should be caught and translated to user-friendly messages:

```python
# utils/error_translations.py

ERROR_TRANSLATIONS = {
    # Swahili translations for common errors
    'Domain name already exists': {
        'sw': 'Jina hili la tovuti tayari limechukuliwa.',
        'en': 'This domain name is already registered.',
    },
    'Invalid domain name': {
        'sw': 'Jina la tovuti si sahihi.',
        'en': 'Invalid domain name.',
    },
    'Authentication failed': {
        'sw': 'Uthibitishaji umeshindikana.',
        'en': 'Authentication failed. Please try again.',
    },
    'Insufficient funds': {
        'sw': 'Hakuna pesa za kutosha katika akaunti.',
        'en': 'Insufficient account balance.',
    },
    'Domain transfer is already in progress': {
        'sw': 'Uhamishaji wa jina tayari unaendelea.',
        'en': 'Domain transfer is already in progress.',
    },
}

def translate_error(error_message: str, locale: str = 'sw') -> str:
    """Translate ResellerClub error messages."""
    for key, translations in ERROR_TRANSLATIONS.items():
        if key.lower() in error_message.lower():
            return translations.get(locale, translations.get('en', error_message))
    return error_message
```

---

## Rate Limiting

ResellerClub has API rate limits. Django should cache results and implement throttling:

```python
# api/views/domains.py

from django.core.cache import cache

async def domain_availability(request):
    domain_name = request.GET.get('domain')
    
    # Cache availability checks for 5 minutes
    cache_key = f'availability:{domain_name}'
    cached = cache.get(cache_key)
    if cached:
        return JsonResponse(cached)
    
    result = await resellerclub.check_availability(domain_name)
    cache.set(cache_key, result, timeout=300)  # 5 minutes
    
    return JsonResponse(result)
```
