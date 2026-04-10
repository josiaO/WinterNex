# Database Schema & Models

## Overview

DomainHub uses **Supabase PostgreSQL** as the single source of truth. Django connects directly to the Supabase database for read/write operations. No data duplication between services.

---

## Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │   profiles   │       │   domains    │
│  (Supabase)  │──────►│              │──────►│              │
│              │  1:1   │              │  1:N   │              │
└──────────────┘       └──────────────┘       └──────┬───────┘
                                                      │
                              ┌───────────────┬───────┼───────┐
                              │               │       │       │
                              ▼               ▼       ▼       ▼
                       ┌──────────┐   ┌──────────┐ ┌──────┐ ┌──────┐
                       │  orders  │   │  dns_    │ │ sms_ │ │website│
                       │          │   │ records  │ │ logs │ │pages │
                       └────┬─────┘   └──────────┘ └──────┘ └──────┘
                            │
                            ▼
                       ┌──────────┐
                       │ payments │
                       │          │
                       └──────────┘
```

---

## Tables

### 1. `auth.users` (Supabase Auth — Managed by Supabase)

This table is managed automatically by Supabase Authentication. Do NOT modify directly.

Key columns used by DomainHub:
- `id` (UUID) — Primary key, referenced everywhere
- `email` (TEXT) — User email
- `encrypted_password` (TEXT) — Hashed password
- `raw_user_meta_data` (JSONB) — Contains `name`, `phone`, `locale`
- `app_metadata` (JSONB) — Contains `role` (user/admin), `provider`

---

### 2. `profiles`

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    phone VARCHAR(20),
    
    -- User preferences
    locale VARCHAR(2) DEFAULT 'sw',
    default_payment_method VARCHAR(20) DEFAULT 'mpesa',
    default_phone VARCHAR(20),
    
    -- Contact info (for domain registration)
    company TEXT,
    address TEXT,
    city TEXT DEFAULT 'Dar es Salaam',
    state TEXT,
    country VARCHAR(2) DEFAULT 'TZ',
    postal_code TEXT,
    
    -- External IDs
    resellerclub_customer_id TEXT,
    
    -- Admin flag
    role VARCHAR(20) DEFAULT 'user',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p2
            WHERE p2.id = auth.uid() AND p2.role = 'admin'
        )
    );

CREATE INDEX idx_profiles_email ON profiles(email);
```

---

### 3. `domains`

```sql
CREATE TABLE domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Domain info
    name TEXT UNIQUE NOT NULL,
    tld TEXT NOT NULL,
    
    -- Status & lifecycle
    status VARCHAR(20) DEFAULT 'pending',
    -- Values: pending, active, expired, grace_period, redemption,
    --         transferred_out, suspended
    
    -- Dates
    registration_date DATE,
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Features
    auto_renew BOOLEAN DEFAULT FALSE,
    privacy_enabled BOOLEAN DEFAULT FALSE,
    locked BOOLEAN DEFAULT TRUE,
    
    -- Pricing
    registration_price INTEGER,   -- Price paid at registration (TZS)
    renewal_price INTEGER,        -- Current renewal price (TZS)
    
    -- External IDs
    resellerclub_order_id TEXT,
    resellerclub_entity_id TEXT,
    
    -- Auto-renewal tracking
    auto_renew_processed BOOLEAN DEFAULT FALSE,
    last_auto_renew_attempt DATE
);

-- Row Level Security
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own domains"
    ON domains FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own domains"
    ON domains FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all domains"
    ON domains FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

CREATE INDEX idx_domains_user_id ON domains(user_id);
CREATE INDEX idx_domains_status ON domains(status);
CREATE INDEX idx_domains_expiry ON domains(expiry_date);
CREATE INDEX idx_domains_tld ON domains(tld);
CREATE INDEX idx_domains_name ON domains(name);
```

---

### 4. `orders`

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Order type
    type VARCHAR(30) NOT NULL,
    -- Values: domain_registration, domain_renewal, domain_transfer,
    --         privacy_protection, bundle_starter, bundle_business, bundle_premium
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    -- Values: pending, payment_pending, completed, failed, cancelled, refunded
    
    -- Order details
    description TEXT,
    total_amount INTEGER NOT NULL,      -- Total in TZS
    currency VARCHAR(3) DEFAULT 'TZS',
    
    -- Order items (JSON for flexibility)
    items JSONB NOT NULL DEFAULT '[]',
    -- Example: [
    --   {"domain": "example.co.tz", "years": 1, "price": 25000},
    --   {"feature": "privacy", "price": 5000}
    -- ]
    
    -- Timeline
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
    ON orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
```

---

### 5. `payments`

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    
    -- Payment details
    amount INTEGER NOT NULL,             -- Amount in TZS
    currency VARCHAR(3) DEFAULT 'TZS',
    method VARCHAR(20) NOT NULL,         -- mpesa, tigopesa, airtel, card
    provider VARCHAR(20) NOT NULL,       -- selcom, airtel, manual
    provider_transaction_id VARCHAR(100) UNIQUE,
    phone_number VARCHAR(20),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    -- Values: pending, processing, completed, failed, expired, refunded
    
    failure_reason TEXT,
    
    -- Callback
    callback_payload JSONB,
    callback_received_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
    ON payments FOR SELECT
    USING (auth.uid() = user_id);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_provider_tx ON payments(provider_transaction_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created ON payments(created_at DESC);
```

---

### 6. `dns_records`

```sql
CREATE TABLE dns_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Record info
    record_type VARCHAR(10) NOT NULL,     -- A, AAAA, CNAME, MX, TXT, SRV, NS
    name TEXT NOT NULL DEFAULT '@',       -- @ for root, www, blog, etc.
    value TEXT NOT NULL,
    ttl INTEGER DEFAULT 3600,
    priority INTEGER,                     -- Required for MX, SRV
    
    -- External ID (ResellerClub)
    provider_record_id TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(domain_id, record_type, name, value)
);

ALTER TABLE dns_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own DNS records"
    ON dns_records FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own DNS records"
    ON dns_records FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX idx_dns_records_domain ON dns_records(domain_id);
CREATE INDEX idx_dns_records_type ON dns_records(record_type);
```

---

### 7. `sms_logs`

```sql
CREATE TABLE sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    
    phone_number VARCHAR(20) NOT NULL,
    template_key VARCHAR(50),
    message TEXT NOT NULL,
    locale VARCHAR(2) DEFAULT 'sw',
    
    status VARCHAR(20) DEFAULT 'sent',
    -- Values: queued, sent, delivered, failed
    
    provider VARCHAR(20),
    provider_message_id VARCHAR(100),
    cost INTEGER,                         -- Cost in TZS cents
    error TEXT,
    
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ
);

CREATE INDEX idx_sms_logs_user ON sms_logs(user_id);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);
CREATE INDEX idx_sms_logs_sent_at ON sms_logs(sent_at DESC);
```

---

### 8. `website_pages`

```sql
CREATE TABLE website_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    domain_id UUID REFERENCES domains(id),
    
    -- Page content
    html TEXT NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    
    -- Generation metadata
    business_name TEXT,
    business_type TEXT,
    business_description TEXT,
    generation_prompt TEXT,
    ai_model VARCHAR(50),
    
    -- Versioning
    version INTEGER DEFAULT 1,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE website_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pages"
    ON website_pages FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own pages"
    ON website_pages FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX idx_website_pages_user ON website_pages(user_id);
CREATE INDEX idx_website_pages_domain ON website_pages(domain_id);
```

---

### 9. `notifications`

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL,
    -- Values: domain_expiry, payment_confirmed, payment_failed,
    --         domain_registered, dns_changed, system
    
    title TEXT NOT NULL,
    message TEXT,
    
    action_url TEXT,
    action_label TEXT,
    
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

---

## Django Models

### `api/models.py`

```python
from django.db import models


class Profile(models.Model):
    """User profile — mirrors Supabase auth.users with extra fields."""
    id = models.UUIDField(primary_key=True)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    locale = models.CharField(max_length=2, default='sw')
    default_payment_method = models.CharField(max_length=20, default='mpesa')
    default_phone = models.CharField(max_length=20, blank=True)
    company = models.CharField(max_length=255, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, default='Dar es Salaam')
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=2, default='TZ')
    postal_code = models.CharField(max_length=20, blank=True)
    resellerclub_customer_id = models.CharField(max_length=100, blank=True)
    role = models.CharField(max_length=20, default='user')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'profiles'
    
    def __str__(self):
        return self.email


class Domain(models.Model):
    """Registered domain."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('grace_period', 'Grace Period'),
        ('redemption', 'Redemption'),
        ('transferred_out', 'Transferred Out'),
        ('suspended', 'Suspended'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user_id = models.UUIDField(db_index=True)
    name = models.CharField(max_length=255, unique=True)
    tld = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    registration_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    auto_renew = models.BooleanField(default=False)
    privacy_enabled = models.BooleanField(default=False)
    locked = models.BooleanField(default=True)
    registration_price = models.IntegerField(null=True)
    renewal_price = models.IntegerField(null=True)
    resellerclub_order_id = models.CharField(max_length=100, blank=True)
    resellerclub_entity_id = models.CharField(max_length=100, blank=True)
    auto_renew_processed = models.BooleanField(default=False)
    last_auto_renew_attempt = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'domains'
    
    @property
    def days_until_expiry(self):
        if not self.expiry_date:
            return None
        return (self.expiry_date - date.today()).days
    
    def __str__(self):
        return self.name


class Order(models.Model):
    """Purchase order."""
    ORDER_TYPES = [
        ('domain_registration', 'Domain Registration'),
        ('domain_renewal', 'Domain Renewal'),
        ('domain_transfer', 'Domain Transfer'),
        ('privacy_protection', 'Privacy Protection'),
        ('bundle_starter', 'Bundle: Starter'),
        ('bundle_business', 'Bundle: Business'),
        ('bundle_premium', 'Bundle: Premium'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user_id = models.UUIDField(db_index=True)
    type = models.CharField(max_length=30, choices=ORDER_TYPES)
    status = models.CharField(max_length=20, default='pending')
    description = models.TextField(blank=True)
    total_amount = models.IntegerField()
    currency = models.CharField(max_length=3, default='TZS')
    items = models.JSONField(default=list)
    metadata = models.JSONField(default=dict)
    paid_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.type} - {self.total_amount} {self.currency}"


class Payment(models.Model):
    """Payment transaction."""
    METHODS = [
        ('mpesa', 'M-Pesa'),
        ('tigopesa', 'Tigo Pesa'),
        ('airtel', 'Airtel Money'),
        ('card', 'Card'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user_id = models.UUIDField(db_index=True)
    order_id = models.UUIDField(null=True, blank=True)
    amount = models.IntegerField()
    currency = models.CharField(max_length=3, default='TZS')
    method = models.CharField(max_length=20, choices=METHODS)
    provider = models.CharField(max_length=20)
    provider_transaction_id = models.CharField(max_length=100, unique=True, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    status = models.CharField(max_length=20, default='pending')
    failure_reason = models.TextField(blank=True)
    callback_payload = models.JSONField(null=True, blank=True)
    callback_received_at = models.DateTimeField(null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.method} - {self.amount} {self.currency} ({self.status})"


class DNSRecord(models.Model):
    """DNS record for a domain."""
    RECORD_TYPES = [
        ('A', 'A Record'),
        ('AAAA', 'AAAA Record'),
        ('CNAME', 'CNAME Record'),
        ('MX', 'MX Record'),
        ('TXT', 'TXT Record'),
        ('SRV', 'SRV Record'),
        ('NS', 'NS Record'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    domain_id = models.UUIDField(db_index=True)
    user_id = models.UUIDField()
    record_type = models.CharField(max_length=10, choices=RECORD_TYPES)
    name = models.CharField(max_length=255, default='@')
    value = models.TextField()
    ttl = models.IntegerField(default=3600)
    priority = models.IntegerField(null=True, blank=True)
    provider_record_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'dns_records'
        unique_together = ['domain_id', 'record_type', 'name', 'value']
    
    def __str__(self):
        return f"{self.record_type} {self.name} → {self.value}"


class SMSLog(models.Model):
    """SMS sending log."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user_id = models.UUIDField(null=True, blank=True)
    phone_number = models.CharField(max_length=20)
    template_key = models.CharField(max_length=50, blank=True)
    message = models.TextField()
    locale = models.CharField(max_length=2, default='sw')
    status = models.CharField(max_length=20, default='sent')
    provider = models.CharField(max_length=20, blank=True)
    provider_message_id = models.CharField(max_length=100, blank=True)
    cost = models.IntegerField(null=True)
    error = models.TextField(blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'sms_logs'
        ordering = ['-sent_at']


class WebsitePage(models.Model):
    """AI-generated website page."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user_id = models.UUIDField(db_index=True)
    domain_id = models.UUIDField(null=True, blank=True)
    html = models.TextField()
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    business_name = models.CharField(max_length=255, blank=True)
    business_type = models.CharField(max_length=100, blank=True)
    business_description = models.TextField(blank=True)
    generation_prompt = models.TextField(blank=True)
    ai_model = models.CharField(max_length=50, blank=True)
    version = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'website_pages'
        ordering = ['-updated_at']


class Notification(models.Model):
    """In-app notification."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user_id = models.UUIDField(db_index=True)
    type = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    action_url = models.URLField(blank=True)
    action_label = models.CharField(max_length=100, blank=True)
    read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
```

---

## Migration Strategy

Since Django connects to the Supabase-managed database:

1. **Initial schema**: Run SQL directly in Supabase SQL Editor
2. **Django migrations**: Generate but DON'T auto-apply to avoid conflicts
3. **Schema changes**: Make changes in Supabase first, then update Django models
4. **Recommended**: Use `--fake` migrations after manual schema updates

```bash
# After creating tables in Supabase SQL Editor:
python manage.py makemigrations
python manage.py migrate --fake

# When adding new tables/fields:
# 1. Add to Supabase SQL Editor
# 2. Update Django models
# 3. python manage.py makemigrations
# 4. python manage.py migrate --fake
```
