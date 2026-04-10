# API Endpoints Reference

## Overview

All Django API endpoints are prefixed with `/api/`. Authentication is required for all endpoints except payment callbacks and health checks.

**Base URL:** `https://api.domainhub.co.tz`

---

## Authentication

All authenticated endpoints require:
```
Authorization: Bearer <supabase-jwt-token>
```

### Common Headers

| Header | Required | Description |
|---|---|---|
| `Authorization` | Yes | `Bearer <JWT>` |
| `Content-Type` | Yes | `application/json` |
| `Accept-Language` | No | `sw` (default) or `en` |

### Common Response Format

```json
{
  "success": true,
  "data": {},
  "message": "Optional message",
  "errors": []
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

---

## Endpoints

### ─── Authentication ─────────────────────────────────────

#### POST `/api/auth/verify`
Verify a Supabase JWT token.

**Auth:** Bearer JWT
**Body:** None (token in header)

```json
// Response 200
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "is_admin": false
  }
}
```

---

### ─── Domains ───────────────────────────────────────────

#### GET `/api/domains/availability`
Check domain availability across multiple TLDs.

**Auth:** Optional
**Query Params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `domain` | string | Yes | Domain name (e.g., `example.co.tz`) |
| `check_alts` | boolean | No | Check alternative TLDs (default: `true`) |
| `suggest` | boolean | No | Get name suggestions if taken (default: `true`) |

```json
// Response 200
{
  "success": true,
  "data": {
    "domain": "example.co.tz",
    "status": "available",
    "price": {
      "register": 25000,
      "renew": 30000,
      "currency": "TZS"
    },
    "alternatives": {
      ".com": {"available": true, "register": 35000, "renew": 38000},
      ".tz": {"available": false},
      ".africa": {"available": true, "register": 30000, "renew": 35000}
    },
    "suggestions": [
      "myexample.co.tz",
      "theexample.co.tz",
      "example-tz.co.tz"
    ]
  }
}
```

---

#### POST `/api/domains/register`
Register a new domain.

**Auth:** Required
**Body:**

```json
{
  "domain_name": "example.co.tz",
  "years": 1,
  "enable_privacy": true,
  "auto_renew": false,
  "contact": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+255712345678",
    "company": "Example Ltd",
    "city": "Dar es Salaam",
    "country": "TZ"
  }
}
```

```json
// Response 201
{
  "success": true,
  "data": {
    "order_id": "order-uuid",
    "payment_required": true,
    "amount": 25000,
    "currency": "TZS",
    "message": "Domain order created. Please complete payment."
  }
}
```

---

#### GET `/api/domains`
List all domains for the authenticated user.

**Auth:** Required
**Query Params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `status` | string | No | Filter by status: `active`, `expired`, `all` |
| `page` | int | No | Page number (default: 1) |
| `per_page` | int | No | Items per page (default: 20, max: 100) |
| `search` | string | No | Search by domain name |

```json
// Response 200
{
  "success": true,
  "data": {
    "domains": [
      {
        "id": "uuid",
        "name": "example.co.tz",
        "status": "active",
        "expiry_date": "2026-01-15",
        "days_until_expiry": 180,
        "auto_renew": false,
        "privacy_enabled": true,
        "locked": false,
        "created_at": "2025-01-15T10:30:00Z"
      }
    ],
    "total": 5,
    "page": 1,
    "per_page": 20,
    "expiry_summary": {
      "expiring_soon": 1,
      "expired": 0,
      "active": 4
    }
  }
}
```

---

#### GET `/api/domains/{domain_id}`
Get details for a specific domain.

**Auth:** Required + Owner

```json
// Response 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "example.co.tz",
    "status": "active",
    "expiry_date": "2026-01-15",
    "days_until_expiry": 180,
    "registration_date": "2025-01-15",
    "auto_renew": false,
    "privacy_enabled": true,
    "locked": true,
    "nameservers": ["ns1.domainhub.co.tz", "ns2.domainhub.co.tz"],
    "contact": {
      "name": "John Doe",
      "email": "john@example.com",
      "organization": "Example Ltd"
    },
    "pricing": {
      "renewal_price": 30000,
      "currency": "TZS"
    }
  }
}
```

---

#### POST `/api/domains/{domain_id}/renew`
Renew an existing domain.

**Auth:** Required + Owner
**Body:**

```json
{
  "years": 1
}
```

```json
// Response 200
{
  "success": true,
  "data": {
    "order_id": "order-uuid",
    "payment_required": true,
    "amount": 30000,
    "currency": "TZS",
    "new_expiry_date": "2027-01-15"
  }
}
```

---

#### POST `/api/domains/{domain_id}/transfer-in`
Initiate a domain transfer to DomainHub.

**Auth:** Required
**Body:**

```json
{
  "auth_code": "TRANSFER_CODE_FROM_CURRENT_REGISTRAR"
}
```

---

#### PUT `/api/domains/{domain_id}/auto-renew`
Toggle auto-renewal for a domain.

**Auth:** Required + Owner
**Body:**

```json
{
  "auto_renew": true
}
```

---

#### PUT `/api/domains/{domain_id}/privacy`
Toggle WHOIS privacy protection.

**Auth:** Required + Owner
**Body:**

```json
{
  "enable_privacy": true
}
```

---

#### PUT `/api/domains/{domain_id}/lock`
Toggle domain transfer lock.

**Auth:** Required + Owner
**Body:**

```json
{
  "lock": true
}
```

---

### ─── DNS Management ─────────────────────────────────────

#### GET `/api/dns/{domain_id}/records`
List all DNS records for a domain.

**Auth:** Required + Owner

```json
// Response 200
{
  "success": true,
  "data": {
    "domain": "example.co.tz",
    "nameservers": ["ns1.domainhub.co.tz", "ns2.domainhub.co.tz"],
    "records": [
      {
        "id": "rec-123",
        "type": "A",
        "name": "@",
        "value": "192.0.2.1",
        "ttl": 3600,
        "priority": null
      },
      {
        "id": "rec-124",
        "type": "CNAME",
        "name": "www",
        "value": "example.co.tz",
        "ttl": 3600,
        "priority": null
      },
      {
        "id": "rec-125",
        "type": "MX",
        "name": "@",
        "value": "mail.example.co.tz",
        "ttl": 3600,
        "priority": 10
      },
      {
        "id": "rec-126",
        "type": "TXT",
        "name": "@",
        "value": "v=spf1 include:spf.domainhub.co.tz ~all",
        "ttl": 3600,
        "priority": null
      }
    ]
  }
}
```

---

#### POST `/api/dns/{domain_id}/records`
Add a new DNS record.

**Auth:** Required + Owner
**Body:**

```json
{
  "type": "A",
  "name": "blog",
  "value": "192.0.2.2",
  "ttl": 3600
}
```

For MX records:
```json
{
  "type": "MX",
  "name": "@",
  "value": "mail.example.co.tz",
  "ttl": 3600,
  "priority": 10
}
```

---

#### PUT `/api/dns/{domain_id}/records/{record_id}`
Update an existing DNS record.

**Auth:** Required + Owner
**Body:** Same as POST (fields to update).

---

#### DELETE `/api/dns/{domain_id}/records/{record_id}`
Delete a DNS record.

**Auth:** Required + Owner

```json
// Response 200
{
  "success": true,
  "data": {
    "message": "DNS record deleted successfully"
  }
}
```

---

#### PUT `/api/dns/{domain_id}/nameservers`
Update nameservers for a domain.

**Auth:** Required + Owner
**Body:**

```json
{
  "nameservers": [
    "ns1.cloudhosting.co.tz",
    "ns2.cloudhosting.co.tz"
  ]
}
```

---

### ─── Payments ──────────────────────────────────────────

#### POST `/api/payments/initiate`
Initiate a payment.

**Auth:** Required
**Body:**

```json
{
  "order_id": "order-uuid",
  "amount": 25000,
  "method": "mpesa",
  "phone_number": "0712345678",
  "description": "Domain registration: example.co.tz"
}
```

```json
// Response 200
{
  "success": true,
  "data": {
    "payment_id": "pay-uuid",
    "status": "pending",
    "message": "Tafadhali thibitisha malipo kwenye simu yako.",
    "amount": 25000,
    "currency": "TZS",
    "method": "mpesa"
  }
}
```

---

#### GET `/api/payments/{payment_id}/status`
Check payment status.

**Auth:** Required + Owner

```json
// Response 200
{
  "success": true,
  "data": {
    "payment_id": "pay-uuid",
    "status": "completed",
    "amount": 25000,
    "method": "mpesa",
    "receipt": "QKR3L5M7P9",
    "created_at": "2025-01-15T10:30:00Z",
    "completed_at": "2025-01-15T10:32:15Z"
  }
}
```

---

#### GET `/api/payments`
List payment history for the authenticated user.

**Auth:** Required
**Query Params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `status` | string | No | Filter: `completed`, `pending`, `failed` |
| `limit` | int | No | Default: 20 |

---

#### POST `/api/payments/callback/selcom`
Payment callback from Selcom (M-Pesa / Tigo Pesa).

**Auth:** Webhook signature verification
**Body:** Selcom callback payload

---

#### POST `/api/payments/callback/airtel`
Payment callback from Airtel Money.

**Auth:** Webhook signature verification
**Body:** Airtel callback payload

---

### ─── Orders ────────────────────────────────────────────

#### GET `/api/orders`
List orders for the authenticated user.

**Auth:** Required

```json
// Response 200
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order-uuid",
        "type": "domain_registration",
        "status": "completed",
        "items": [{"domain": "example.co.tz", "years": 1}],
        "total_amount": 25000,
        "currency": "TZS",
        "created_at": "2025-01-15T10:30:00Z"
      }
    ],
    "total": 10
  }
}
```

---

#### GET `/api/orders/{order_id}`
Get order details.

**Auth:** Required + Owner

---

### ─── Users ─────────────────────────────────────────────

#### GET `/api/users/profile`
Get the authenticated user's profile.

**Auth:** Required

```json
// Response 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+255712345678",
    "locale": "sw",
    "default_payment_method": "mpesa",
    "default_phone": "0712345678",
    "stats": {
      "domains_count": 5,
      "active_domains": 4,
      "expiring_soon": 1
    },
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

#### PUT `/api/users/profile`
Update user profile.

**Auth:** Required
**Body:**

```json
{
  "name": "John Doe Updated",
  "phone": "+255712345678",
  "locale": "sw",
  "default_payment_method": "mpesa",
  "default_phone": "0712345678"
}
```

---

### ─── AI Website Builder ────────────────────────────────

#### POST `/api/builder/generate`
Generate a website using AI.

**Auth:** Required
**Body:**

```json
{
  "domain_id": "domain-uuid",
  "business_name": "DukaLa Digital",
  "business_type": "restaurant",
  "description": "A Swahili restaurant in Dar es Salaam serving traditional food",
  "locale": "sw",
  "features": ["menu", "gallery", "contact_form", "whatsapp_button"]
}
```

```json
// Response 200
{
  "success": true,
  "data": {
    "page_id": "page-uuid",
    "preview_url": "/preview/page-uuid",
    "status": "generated",
    "sections": ["hero", "about", "menu", "gallery", "contact"]
  }
}
```

---

#### GET `/api/builder/{page_id}`
Get generated website HTML.

**Auth:** Required + Owner

---

#### PUT `/api/builder/{page_id}`
Update website content.

**Auth:** Required + Owner
**Body:**

```json
{
  "html": "<html>...</html>",
  "published": false
}
```

---

#### POST `/api/builder/{page_id}/publish`
Publish a website to the domain.

**Auth:** Required + Owner

---

### ─── Admin Endpoints ──────────────────────────────────

*All admin endpoints require `is_admin: true` in Supabase app_metadata.*

#### GET `/api/admin/stats`
Get platform statistics.

**Auth:** Required + Admin

```json
{
  "success": true,
  "data": {
    "total_users": 1500,
    "total_domains": 3200,
    "active_domains": 2800,
    "total_revenue": 125000000,
    "revenue_this_month": 8500000,
    "pending_payments": 15,
    "expiring_domains_30d": 45
  }
}
```

---

#### GET `/api/admin/users`
List all users (paginated).

**Auth:** Required + Admin

---

#### GET `/api/admin/domains`
List all domains (paginated, filterable).

**Auth:** Required + Admin

---

#### POST `/api/admin/domains/{domain_id}/suspend`
Suspend a domain.

**Auth:** Required + Admin

---

#### GET `/api/admin/orders`
List all orders.

**Auth:** Required + Admin

---

#### GET `/api/admin/revenue`
Revenue reports.

**Auth:** Required + Admin
**Query Params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `period` | string | No | `today`, `week`, `month`, `year`, `all` |
| `start_date` | string | No | ISO date format |
| `end_date` | string | No | ISO date format |

---

### ─── Utility ──────────────────────────────────────────

#### GET `/api/health`
Health check endpoint.

**Auth:** None

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "resellerclub": "connected",
    "mpesa": "connected",
    "sms": "connected"
  }
}
```

---

#### GET `/api/pricing`
Get all TLD pricing.

**Auth:** None

```json
{
  "success": true,
  "data": {
    "tlds": [
      {
        "tld": ".co.tz",
        "register": 25000,
        "renew": 30000,
        "transfer": 35000,
        "currency": "TZS",
        "popular": true
      }
    ],
    "bundles": [...]
  }
}
```

---

#### GET `/api/tld-list`
Get list of supported TLDs.

**Auth:** None

---

### ─── Webhooks ──────────────────────────────────────────

#### POST `/webhooks/supabase-auth`
Supabase auth webhook (user created/updated).

**Auth:** Webhook signature

---

#### POST `/webhooks/supabase-db`
Supabase database change webhook.

**Auth:** Webhook signature

---

## Rate Limits

| Endpoint Category | Anonymous | Authenticated | Admin |
|---|---|---|---|
| Domain availability | 30/min | 100/min | 500/min |
| Domain registration | N/A | 10/hour | 100/hour |
| DNS management | N/A | 60/min | 200/min |
| Payment initiation | N/A | 20/hour | 100/hour |
| AI builder | N/A | 5/hour | 50/hour |

---

## Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `AUTH_REQUIRED` | 401 | JWT token missing or invalid |
| `AUTH_EXPIRED` | 401 | JWT token has expired |
| `FORBIDDEN` | 403 | User does not have permission |
| `DOMAIN_NOT_FOUND` | 404 | Domain not found |
| `DOMAIN_UNAVAILABLE` | 409 | Domain is already registered |
| `INVALID_DOMAIN` | 400 | Domain name format is invalid |
| `INVALID_PHONE` | 400 | Phone number format is invalid |
| `PAYMENT_FAILED` | 402 | Payment initiation failed |
| `PAYMENT_EXPIRED` | 402 | Payment timed out |
| `INSUFFICIENT_FUNDS` | 402 | User's payment method declined |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |
| `RESELLERCLUB_ERROR` | 502 | ResellerClub API error |
| `SMS_FAILED` | 502 | SMS sending failed |
