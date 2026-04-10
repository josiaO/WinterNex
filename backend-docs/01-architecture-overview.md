# DomainHub — Architecture Overview

## Hybrid Backend Architecture: Supabase + Django

DomainHub uses a **hybrid backend architecture** that splits responsibilities between two services for maximum reliability, speed, and developer experience.

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 16)                     │
│           React + Tailwind CSS + shadcn/ui + Zustand         │
└──────────────────────┬──────────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
┌──────────────────┐     ┌──────────────────────┐
│    SUPABASE      │     │      DJANGO API       │
│  ─────────────── │     │  ────────────────────  │
│  • Auth (JWT)    │◄───►│  • Business Logic      │
│  • PostgreSQL DB │     │  • External APIs       │
│  • Realtime      │     │  • Payment Processing  │
│  • File Storage  │     │  • SMS Sending         │
│  • Row-Level Sec │     │  • Domain Lifecycle    │
└──────────────────┘     └──────────┬────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
            ┌──────────────┐ ┌──────────┐ ┌──────────┐
            │ ResellerClub │ │  M-Pesa  │ │   SMS    │
            │     API      │ │  Selcom  │ │  Twilio  │
            └──────────────┘ │  Airtel  │ │  Africa's│
                              └──────────┘ └──────────┘
```

---

## Responsibility Split

### Supabase (Data Layer)
| Responsibility | Details |
|---|---|
| **Authentication** | Email/password signup, magic links, OAuth (Google, GitHub) |
| **JWT Tokens** | Access tokens + refresh tokens |
| **Database** | PostgreSQL with Row Level Security (RLS) |
| **Realtime** | Live updates for payment status, domain status |
| **Storage** | Website assets, logos, screenshots |
| **Edge Functions** | Optional — simple serverless functions for quick tasks |

### Django (Logic Layer)
| Responsibility | Details |
|---|---|
| **ResellerClub API** | Domain registration, DNS, WHOIS, transfers |
| **Payment Processing** | M-Pesa STK push, Airtel Money, callback handling |
| **SMS Notifications** | Expiry reminders, payment confirmations |
| **Domain Lifecycle** | Auto-renewal, expiry warnings, suspension |
| **Business Logic** | Pricing rules, bundle calculations, fraud checks |
| **Validation** | Input validation, domain name sanitization |
| **AI Integration** | Website builder content generation |

---

## Data Flow Patterns

### Pattern 1: Django Writes → Supabase Reads
```
Frontend → Django API → External API → Write to Supabase DB → Frontend auto-updates via Realtime
```
**Use for**: Domain registration, payment processing, order creation

### Pattern 2: Supabase Triggers → Django Reacts
```
Supabase Webhook → Django API → Process action → Write result back to DB
```
**Use for**: Post-signup user provisioning, payment status changes

### Pattern 3: Direct Supabase Read
```
Frontend → Supabase SDK → Read data directly
```
**Use for**: User profile, domain list, order history, dashboard data

### Pattern 4: Frontend → Django → External
```
Frontend → Django API → External API → Return result
```
**Use for**: Domain availability check, DNS lookup, AI generation

---

## Django Project Structure

```
backend/
├── manage.py
├── requirements.txt
├── .env                          # API keys, secrets
├── config/
│   ├── __init__.py
│   ├── settings.py               # Django settings
│   ├── urls.py                   # Root URL configuration
│   ├── wsgi.py
│   └── asgi.py
├── api/
│   ├── __init__.py
│   ├── urls.py                   # API route definitions
│   ├── views/
│   │   ├── __init__.py
│   │   ├── auth.py               # JWT verification helpers
│   │   ├── domains.py            # Domain CRUD + registration
│   │   ├── payments.py           # Payment initiation + callbacks
│   │   ├── dns.py                # DNS record management
│   │   ├── orders.py             # Order management
│   │   ├── users.py              # User management
│   │   ├── sms.py                # SMS sending endpoints
│   │   ├── builder.py            # AI website builder
│   │   └── admin.py              # Admin-only endpoints
│   ├── serializers.py            # Request/response serialization
│   ├── permissions.py            # Custom permission classes
│   └── middleware.py             # Custom middleware
├── services/
│   ├── __init__.py
│   ├── resellerclub.py           # ResellerClub API client
│   ├── mpesa.py                  # M-Pesa (Selcom) integration
│   ├── airtel_money.py           # Airtel Money integration
│   ├── sms_service.py            # SMS sending (Twilio / Africa's Talking)
│   ├── ai_builder.py             # AI content generation
│   ├── domain_lifecycle.py       # Auto-renewal, expiry logic
│   └── pricing.py                # Pricing calculation engine
├── utils/
│   ├── __init__.py
│   ├── auth.py                   # JWT decode, Supabase verification
│   ├── validators.py             # Input validation helpers
│   ├── fraud_detection.py        # Basic fraud detection
│   └── helpers.py                # Misc utilities
└── tests/
    ├── __init__.py
    ├── test_auth.py
    ├── test_domains.py
    ├── test_payments.py
    └── test_services.py
```

---

## Technology Stack (Django Side)

| Component | Technology | Purpose |
|---|---|---|
| **Framework** | Django 5.x + Django REST Framework | API layer |
| **Database** | Supabase PostgreSQL (remote) | Single source of truth |
| **Auth** | python-jose + Supabase JWT | Token verification |
| **HTTP Client** | httpx | Async API calls to external services |
| **Task Queue** | Celery + Redis | Background jobs (SMS, renewals) |
| **SMS** | Twilio / Africa's Talking | SMS delivery |
| **AI** | OpenAI API | Website content generation |
| **Deployment** | Docker + Gunicorn | Production server |
| **Monitoring** | Sentry | Error tracking |

---

## Environment Variables (Django `.env`)

```env
# Django
DEBUG=False
SECRET_KEY=your-django-secret-key
ALLOWED_ORIGINS=https://domainhub.co.tz,http://localhost:3000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_DB_URL=postgresql://postgres:[password]@db.supabase.co:5432/postgres

# ResellerClub
RESELLERCLUB_API_KEY=your-resellerclub-api-key
RESELLERCLUB_API_URL=https://test.httpapi.com/api/domains

# M-Pesa / Selcom
SELCOM_API_KEY=your-selcom-api-key
SELCOM_SECRET=your-selcom-secret
SELCOM_VENDOR=your-vendor-id
SELCOM_CALLBACK_URL=https://api.domainhub.co.tz/api/payments/callback/mpesa

# Airtel Money
AIRTEL_CLIENT_ID=your-airtel-client-id
AIRTEL_CLIENT_SECRET=your-airtel-secret
AIRTEL_CALLBACK_URL=https://api.domainhub.co.tz/api/payments/callback/airtel

# SMS (Africa's Talking)
AT_USERNAME=your-africastalking-username
AT_API_KEY=your-africastalking-api-key
AT_SENDER_ID=DomainHub

# AI
OPENAI_API_KEY=your-openai-api-key

# Redis
REDIS_URL=redis://localhost:6379/0

# Sentry
SENTRY_DSN=your-sentry-dsn
```

---

## Django Settings (Key Configuration)

```python
# config/settings.py

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'postgres',
        'USER': 'postgres',
        'PASSWORD': env('SUPABASE_DB_PASSWORD'),
        'HOST': 'db.supabase.co',
        'PORT': '5432',
        'OPTIONS': {
            'sslmode': 'require',
        },
    }
}

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'rest_framework',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'api.middleware.JWTAuthMiddleware',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'api.auth.SupabaseJWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
    },
}

CELERY_BROKER_URL = env('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = env('REDIS_URL', default='redis://localhost:6379/0')
```

---

## Complexity Analysis

| Component | Complexity | Notes |
|---|---|---|
| Supabase setup | ★★☆☆☆ | Managed service, easy setup |
| Django micro-backend | ★★★☆☆ | Standard DRF setup |
| JWT verification | ★★★★☆ | Supabase key rotation handling |
| M-Pesa payment flow | ★★★★★ | STK push + callback + reconciliation |
| ResellerClub API | ★★★☆☆ | Well-documented API |
| SMS notifications | ★★☆☆☆ | Simple REST API |
| Domain lifecycle | ★★★★☆ | Cron jobs, edge cases |
| AI website builder | ★★★☆☆ | OpenAI API + template rendering |
