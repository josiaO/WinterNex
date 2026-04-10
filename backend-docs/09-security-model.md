# Security Model

## Overview

DomainHub implements a defense-in-depth security model across all layers of the architecture. Security is never an afterthought — it's baked into every API call, every data operation, and every user interaction.

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                       │
├─────────────────────────────────────────────────────────┤
│  Layer 1: Frontend Validation (Next.js)                 │
│  Layer 2: Supabase Auth (JWT + RLS)                     │
│  Layer 3: Django Auth (JWT verification)                │
│  Layer 4: Django Business Logic (fraud, validation)     │
│  Layer 5: External API Security (keys, signing)         │
│  Layer 6: Database Security (RLS, encryption)           │
│  Layer 7: Infrastructure (HTTPS, WAF, rate limiting)    │
└─────────────────────────────────────────────────────────┘
```

---

## 1. Authentication Security

### JWT Token Management

```python
# security principles for JWT

# RULE 1: NEVER trust tokens on the client side for business decisions
# RULE 2: ALWAYS verify the full JWT on Django for every request
# RULE 3: Use short-lived access tokens (15 minutes recommended)
# RULE 4: Implement token refresh with rotation
# RULE 5: Handle key rotation gracefully
```

### Token Security Configuration

```python
# Supabase Auth Configuration (Dashboard)
JWT expiry: 3600 seconds (1 hour)
Refresh token rotation: Enabled
Lockout after failed attempts: 5 attempts, 15 min lockout
Email confirmation: Required
Phone verification: Required for M-Pesa users
```

### Django JWT Verification Checklist

```python
def verify_token_securely(token: str) -> dict:
    checks = [
        "1. Token format validation (Bearer prefix)",
        "2. JWT signature verification (HS256 with secret)",
        "3. Issuer validation (must match Supabase project URL)",
        "4. Audience validation (must be 'authenticated')",
        "5. Expiration check (reject expired tokens)",
        "6. Not-before check (reject premature tokens)",
        "7. Role check (reject anonymous tokens)",
        "8. Revocation check (if maintaining blocklist)",
    ]
    # All checks must pass before returning user data
```

---

## 2. API Security

### Input Validation

```python
# utils/validation.py

from utils.validators import (
    validate_domain_name,
    validate_phone_number,
    validate_email,
    sanitize_user_input,
)
from decimal import Decimal, InvalidOperation


def validate_payment_request(data: dict) -> list[str]:
    """
    Validate payment initiation request.
    Returns list of error messages (empty if valid).
    """
    errors = []
    
    # Amount validation
    try:
        amount = Decimal(str(data.get('amount', 0)))
        if amount <= 0:
            errors.append("Amount must be positive")
        if amount > Decimal("10000000"):  # 10M TZS max
            errors.append("Amount exceeds maximum limit")
    except (InvalidOperation, ValueError):
        errors.append("Invalid amount format")
    
    # Phone validation (required for mobile money)
    method = data.get('method', '')
    if method in ('mpesa', 'tigopesa', 'airtel'):
        phone_result = validate_phone_number(data.get('phone_number', ''))
        if not phone_result['valid']:
            errors.append(f"Invalid phone: {phone_result['error']}")
    
    # Domain validation (if present)
    if 'domain_name' in data:
        domain_result = validate_domain_name(data['domain_name'])
        if not domain_result['valid']:
            errors.append(f"Invalid domain: {domain_result['error']}")
    
    return errors


def sanitize_all_inputs(data: dict) -> dict:
    """Recursively sanitize all string inputs in a dict."""
    sanitized = {}
    for key, value in data.items():
        if isinstance(value, str):
            sanitized[key] = sanitize_user_input(value)
        elif isinstance(value, dict):
            sanitized[key] = sanitize_all_inputs(value)
        elif isinstance(value, list):
            sanitized[key] = [
                sanitize_user_input(v) if isinstance(v, str) else v
                for v in value
            ]
        else:
            sanitized[key] = value
    return sanitized
```

### Rate Limiting

```python
# config/settings.py

REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'domain_search': '60/min',
        'domain_register': '10/hour',
        'payment_initiate': '20/hour',
        'dns_modify': '30/min',
        'ai_generate': '5/hour',
        'sms_send': '10/min',
    },
}

# Per-view throttle example
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([ScopedRateThrottle])
@throttle_scope('payment_initiate')
def initiate_payment(request):
    ...
```

### CORS Configuration

```python
# config/settings.py

CORS_ALLOWED_ORIGINS = [
    "https://domainhub.co.tz",
    "https://www.domainhub.co.tz",
    "http://localhost:3000",  # Development only
]

CORS_ALLOW_METHODS = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
]

CORS_ALLOW_HEADERS = [
    "authorization",
    "content-type",
    "accept",
    "x-csrf-token",
    "accept-language",
]

CORS_EXPOSE_HEADERS = [
    "x-request-id",
    "x-rate-limit",
]

CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS
```

---

## 3. Payment Security

### Critical Payment Rules

```python
# NEVER TRUST PAYMENT DATA FROM THE FRONTEND

# RULE 1: Always verify payment amount against the order
# RULE 2: Never process payments without order validation
# RULE 3: Always reconcile with payment provider
# RULE 4: Never auto-approve payments from client status
# RULE 5: Implement idempotency to prevent double-charges
# RULE 6: Store provider callbacks with full payload for audit


class PaymentSecurity:
    """Payment security utilities."""
    
    @staticmethod
    async def verify_payment_request(
        order_id: str,
        claimed_amount: int,
        claimed_currency: str,
        user_id: str,
    ) -> dict:
        """
        Comprehensive payment request verification.
        
        Returns:
            {"valid": True} or {"valid": False, "error": "reason"}
        """
        # 1. Verify order exists and belongs to user
        order = await get_order(order_id)
        if not order:
            return {"valid": False, "error": "Order not found"}
        
        if str(order['user_id']) != str(user_id):
            return {"valid": False, "error": "Order does not belong to user"}
        
        # 2. Verify amount matches order
        if int(order['total_amount']) != int(claimed_amount):
            return {
                "valid": False,
                "error": "Amount mismatch",
                "expected": order['total_amount'],
                "received": claimed_amount,
            }
        
        # 3. Verify currency
        if order['currency'] != claimed_currency:
            return {"valid": False, "error": "Currency mismatch"}
        
        # 4. Verify order status allows payment
        if order['status'] not in ('pending', 'payment_pending'):
            return {"valid": False, "error": f"Order status is {order['status']}, cannot pay"}
        
        # 5. Check for existing pending payment
        existing_payment = await get_pending_payment_for_order(order_id)
        if existing_payment:
            # Return existing payment to prevent duplicate charges
            return {
                "valid": True,
                "existing_payment_id": existing_payment['id'],
                "message": "Payment already initiated",
            }
        
        # 6. Fraud check
        fraud_result = await check_fraud_indicators(user_id, '')
        if fraud_result:
            return {"valid": False, "error": "Fraud detected", "details": fraud_result}
        
        return {"valid": True}
    
    @staticmethod
    def verify_callback_signature(
        callback_data: dict,
        signature: str,
        provider: str,
    ) -> bool:
        """
        Verify that a payment callback is authentic.
        Prevents attackers from faking payment confirmations.
        """
        if provider == 'selcom':
            expected = generate_selcom_signature(callback_data)
            return hmac.compare_digest(signature, expected)
        
        elif provider == 'airtel':
            # Airtel uses HTTP basic auth on callback
            return True  # Verified at transport layer
        
        return False
    
    @staticmethod
    async def reconcile_payment(payment_id: str) -> bool:
        """
        Cross-check payment status with the provider.
        Ensures our DB reflects the true payment state.
        """
        payment = await get_payment(payment_id)
        
        if payment['status'] not in ('pending', 'processing'):
            return True
        
        provider_tx = payment['provider_transaction_id']
        if not provider_tx:
            return False
        
        # Ask provider for real status
        if payment['method'] in ('mpesa', 'tigopesa'):
            real_status = await selcom.verify_payment(provider_tx)
        elif payment['method'] == 'airtel':
            real_status = await airtel_money.verify_payment(provider_tx)
        else:
            return False
        
        # Update if different
        if real_status['status'] != payment['status']:
            await update_payment_status(
                payment_id,
                real_status['status'],
            )
            return True
        
        return False
```

---

## 4. Data Protection

### Sensitive Data Handling

```python
# Fields that should NEVER be logged or returned to frontend:
SENSITIVE_FIELDS = [
    'encrypted_password',
    'jwt_secret',
    'api_key',
    'api_secret',
    'provider_secret',
    'credit_card_number',
    'auth_code',
]

# Fields that should be masked in logs:
MASKED_FIELDS = {
    'phone_number': '***789',        # Last 3 digits
    'email': 'j***@example.com',     # First char + domain
    'provider_transaction_id': 'txn_***xyz',
}
```

### Database Security (Supabase)

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dns_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Service role key bypasses RLS (use carefully, only in Django)
-- The Django backend uses the SERVICE_ROLE_KEY for writes
-- The frontend uses the ANON_KEY with RLS for reads
```

### API Key Storage

```python
# Rules for API keys:

# 1. Store ALL external API keys in Django .env only
# 2. NEVER expose API keys to the frontend
# 3. NEVER commit .env to version control
# 4. Use different keys for test and production
# 5. Rotate keys regularly (quarterly recommended)
# 6. Use environment-specific key prefixes

# .env.example (safe to commit)
RESELLERCLUB_API_KEY=your_api_key_here
SELCOM_API_KEY=your_selcom_key_here
AIRTEL_CLIENT_SECRET=your_airtel_secret_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key_here
```

---

## 5. Infrastructure Security

### HTTPS & Transport

```python
# All API communications MUST use HTTPS

# Django Security Settings
SECURE_SSL_REDIRECT = True        # Redirect HTTP to HTTPS
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000    # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
```

### Webhook Security

```python
# All incoming webhooks must verify signatures

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',  # CSRF exempt for webhooks
    'api.middleware.RequestLoggingMiddleware',
    'api.middleware.RateLimitMiddleware',
]

# CSRF exemption for webhook endpoints
@csrf_exempt
def payment_callback(request, provider):
    """CSRF exempt because callbacks come from external services."""
    ...
```

### Logging & Monitoring

```python
# config/settings.py

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'secure': {
            'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/domainhub.log',
            'formatter': 'secure',
        },
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': 'logs/errors.log',
            'formatter': 'secure',
        },
    },
    'loggers': {
        'api': {
            'handlers': ['file', 'error_file'],
            'level': 'INFO',
        },
        'services': {
            'handlers': ['file', 'error_file'],
            'level': 'INFO',
        },
    },
}

# Log what to include and exclude
LOG_INCLUDE = [
    'request_id', 'user_id', 'endpoint', 'method', 'status_code',
    'response_time_ms', 'payment_status', 'domain_name',
]

LOG_EXCLUDE = [
    'jwt_token', 'api_key', 'password', 'phone_number', 'email',
    'auth_code', 'callback_payload',
]
```

---

## 6. Security Checklist

### Pre-Launch Checklist

- [ ] All API keys in `.env` (not in code)
- [ ] `.env` in `.gitignore`
- [ ] HTTPS enabled and HSTS configured
- [ ] CSRF protection enabled
- [ ] Rate limiting on all endpoints
- [ ] JWT verification on all authenticated endpoints
- [ ] RLS enabled on all Supabase tables
- [ ] Payment callback signature verification
- [ ] Input sanitization on all user inputs
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (HTML escaping)
- [ ] CORS configured to specific origins only
- [ ] Sensitive fields excluded from API responses
- [ ] Error messages don't leak internal details
- [ ] Logging excludes sensitive data
- [ ] Monitoring/alerting configured (Sentry)
- [ ] Health check endpoint accessible
- [ ] Dependency vulnerability scan completed

### Regular Security Tasks

| Task | Frequency | Description |
|---|---|---|
| Dependency audit | Weekly | Run `pip audit` to check for CVEs |
| Key rotation | Quarterly | Rotate API keys for all providers |
| Access review | Monthly | Review admin access and permissions |
| Rate limit tuning | Monthly | Analyze logs and adjust limits |
| Penetration test | Quarterly | External security audit |
| Backup verification | Weekly | Verify database backups are restorable |
| Log review | Daily | Check for anomalies and suspicious patterns |

---

## 7. Error Handling (No Data Leaks)

```python
# utils/error_handler.py

SAFE_ERROR_MESSAGES = {
    'DomainError': 'Domain operation failed. Please try again.',
    'PaymentError': 'Payment failed. Please try again or use a different method.',
    'AuthError': 'Authentication failed. Please sign in again.',
    'RateLimitError': 'Too many requests. Please wait a moment.',
    'ServerError': 'Something went wrong. Please try again later.',
}

def safe_error_response(error: Exception, locale: str = 'sw') -> dict:
    """
    Return a safe error response that doesn't leak internal details.
    
    RULES:
    - Never include stack traces in API responses
    - Never include internal file paths
    - Never include database details
    - Log the full error server-side
    - Return a generic message to the client
    """
    error_type = type(error).__name__
    
    # Log full error server-side (with stack trace)
    import logging
    logger = logging.getLogger('api')
    logger.error(f"[{error_type}] {str(error)}", exc_info=True)
    
    # Return safe message to client
    message = SAFE_ERROR_MESSAGES.get(
        error_type,
        SAFE_ERROR_MESSAGES['ServerError']
    )
    
    if locale == 'sw':
        sw_messages = {
            'DomainError': 'Operesheni imefeli. Tafadhali jaribu tena.',
            'PaymentError': 'Malipo yamefeli. Jaribu tena au tumia njia nyingine.',
            'AuthError': 'Uthibitishaji umeshindikana. Tafadhali ingia tena.',
            'ServerError': 'Kuna tatizo. Tafadhali jaribu tena baadaye.',
        }
        message = sw_messages.get(
            error_type,
            sw_messages['ServerError']
        )
    
    return {
        "success": False,
        "error": message,
        "code": error_type,
    }
```
