# Authentication & JWT Verification

## Overview

DomainHub uses **Supabase Authentication** for user identity and **Django** verifies Supabase JWTs on every authenticated API request. This separation ensures:

- **Supabase** handles: signup, login, password reset, OAuth, session management
- **Django** handles: token verification, authorization, business logic access control

---

## Authentication Flow

```
┌──────────┐      ┌──────────┐      ┌──────────┐
│ FRONTEND │      │ SUPABASE │      │  DJANGO  │
└────┬─────┘      └────┬─────┘      └────┬─────┘
     │ 1. Sign Up      │                  │
     │────────────────►│                  │
     │                  │ 2. Create User   │
     │ 3. JWT Token     │    in DB         │
     │◄────────────────│──────────────────►│
     │                  │    (webhook)      │
     │ 4. Return JWT    │                  │
     │◄────────────────│                  │
     │                  │                  │
     │ 5. API Request   │                  │
     │  (Authorization: │                  │
     │   Bearer JWT)    │                  │
     │─────────────────────────────────────►│
     │                  │ 6. Verify JWT    │
     │                  │◄─────────────────│
     │                  │    (JWKS/pubkey) │
     │                  │                  │
     │                  │ 7. Validated     │
     │                  │─────────────────►│
     │ 8. API Response  │                  │
     │◄─────────────────────────────────────│
```

---

## JWT Token Structure

Supabase JWTs contain the following claims:

```json
{
  "iss": "https://your-project.supabase.co/auth/v1",
  "sub": "user-uuid-from-supabase",
  "aud": "authenticated",
  "exp": 1700000000,
  "iat": 1699996400,
  "email": "user@example.com",
  "phone": "",
  "app_metadata": {
    "provider": "email",
    "providers": ["email"]
  },
  "user_metadata": {
    "name": "John Doe",
    "phone": "+255712345678"
  },
  "role": "authenticated",
  "aal": "aal1",
  "amr": [
    {
      "method": "password",
      "timestamp": 1699996400
    }
  ],
  "session_id": "session-uuid",
  "is_anonymous": false
}
```

---

## Django JWT Verification Implementation

### `utils/auth.py`

```python
import os
from jose import jwt, JWTError
from fastapi import HTTPException, status
from datetime import datetime

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")


class JWTVerificationError(Exception):
    """Raised when JWT verification fails."""
    pass


def verify_supabase_token(token: str) -> dict:
    """
    Verify a Supabase JWT and return the decoded payload.
    
    Args:
        token: The JWT token from the Authorization header.
    
    Returns:
        Decoded JWT payload with user info.
    
    Raises:
        JWTVerificationError: If token is invalid, expired, or malformed.
    """
    if not token:
        raise JWTVerificationError("Token is missing")
    
    # Remove "Bearer " prefix if present
    if token.startswith("Bearer "):
        token = token[7:]
    
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
            issuer=f"{SUPABASE_URL}/auth/v1",
        )
        
        # Check expiration
        exp = payload.get("exp")
        if exp and datetime.utcnow().timestamp() > exp:
            raise JWTVerificationError("Token has expired")
        
        # Ensure user is authenticated (not anonymous)
        if payload.get("role") != "authenticated":
            raise JWTVerificationError("User is not authenticated")
        
        return payload
        
    except JWTError as e:
        raise JWTVerificationError(f"Invalid token: {str(e)}")


def extract_user_id(payload: dict) -> str:
    """Extract the Supabase user ID from JWT payload."""
    user_id = payload.get("sub")
    if not user_id:
        raise JWTVerificationError("User ID not found in token")
    return user_id


def extract_user_email(payload: dict) -> str:
    """Extract user email from JWT payload."""
    return payload.get("email", "")


def extract_user_metadata(payload: dict) -> dict:
    """Extract user metadata from JWT payload."""
    return payload.get("user_metadata", {})


def is_admin_user(payload: dict) -> bool:
    """Check if the user has admin role via app_metadata."""
    app_metadata = payload.get("app_metadata", {})
    return app_metadata.get("role") == "admin"
```

### DRF Authentication Class

### `api/auth.py`

```python
from rest_framework import authentication, exceptions
from api.utils.auth import verify_supabase_token, extract_user_id, JWTVerificationError


class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    """
    Django REST Framework authentication class that validates
    Supabase JWT tokens.
    """
    
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header.startswith('Bearer '):
            raise exceptions.AuthenticationFailed('Authorization header missing or invalid')
        
        token = auth_header[7:]  # Remove "Bearer " prefix
        
        try:
            payload = verify_supabase_token(token)
            user_id = extract_user_id(payload)
        except JWTVerificationError as e:
            raise exceptions.AuthenticationFailed(str(e))
        
        # Attach Supabase user info to request
        request.supabase_user_id = user_id
        request.supabase_payload = payload
        
        # Return a tuple of (user, auth) for DRF
        # We use a lightweight user object
        return (SupabaseUser(payload), token)
    
    def authenticate_header(self, request):
        return 'Bearer'


class SupabaseUser:
    """
    Lightweight user object derived from Supabase JWT.
    This avoids database lookups for basic auth.
    """
    
    def __init__(self, payload: dict):
        self.id = payload.get('sub')
        self.email = payload.get('email', '')
        self.phone = payload.get('user_metadata', {}).get('phone', '')
        self.name = payload.get('user_metadata', {}).get('name', '')
        self.is_authenticated = True
        self.is_admin = payload.get('app_metadata', {}).get('role') == 'admin'
        self._payload = payload
    
    @property
    def is_anonymous(self):
        return False
    
    @property
    def is_active(self):
        return True
    
    def __str__(self):
        return self.email or self.id
```

### Custom Permission Classes

### `api/permissions.py`

```python
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """
    Only allow users with admin role in app_metadata.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return getattr(request.user, 'is_admin', False)


class IsOwner(BasePermission):
    """
    Only allow users to access their own resources.
    Expects the view to have a `get_owner_id()` method.
    """
    def has_object_permission(self, request, view, obj):
        return str(obj.user_id) == str(request.user.id)


class IsOwnerOrAdmin(BasePermission):
    """
    Allow resource owners or admins to access the resource.
    """
    def has_object_permission(self, request, view, obj):
        if getattr(request.user, 'is_admin', False):
            return True
        return str(obj.user_id) == str(request.user.id)
```

---

## Frontend → Django Request Pattern

### How the Next.js frontend calls Django:

```typescript
// Frontend: src/lib/api.ts

const DJANGO_API = process.env.NEXT_PUBLIC_DJANGO_API_URL || ''

export async function djangoFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Get Supabase session token
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('Not authenticated')
  }
  
  const response = await fetch(`${DJANGO_API}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers,
    },
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new DjangoApiError(response.status, error.detail || 'Request failed')
  }
  
  return response.json()
}

class DjangoApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'DjangoApiError'
  }
}
```

### Example API Call:

```typescript
// Register a domain
const result = await djangoFetch('/api/domains/register', {
  method: 'POST',
  body: JSON.stringify({
    domain_name: 'example.co.tz',
    years: 1,
    contact_id: 'contact-uuid',
    enable_privacy: true,
  }),
})
```

---

## User Creation Flow (Supabase Webhook → Django)

When a new user signs up via Supabase, a webhook triggers Django to create the user profile:

### `api/views/users.py`

```python
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.db import connection


@csrf_exempt
@require_POST
def supabase_webhook(request):
    """
    Handle Supabase auth webhook for new user creation.
    
    Supabase sends a POST with:
    {
        "type": "SIGN_UP",
        "timestamp": "2024-01-01T00:00:00Z",
        "payload": {
            "user": {
                "id": "uuid",
                "email": "user@example.com",
                "raw_user_meta_data": {
                    "name": "John Doe",
                    "phone": "+255712345678"
                }
            }
        }
    }
    """
    try:
        body = json.loads(request.body)
        event_type = body.get('type')
        payload = body.get('payload', {})
        user_data = payload.get('user', {})
        
        if event_type == 'SIGN_UP':
            user_id = user_data.get('id')
            email = user_data.get('email', '')
            metadata = user_data.get('raw_user_meta_data', {})
            name = metadata.get('name', '')
            phone = metadata.get('phone', '')
            
            # Create user profile in Supabase DB
            with connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO profiles (id, email, name, phone, role, created_at)
                    VALUES (%s, %s, %s, %s, 'user', NOW())
                    ON CONFLICT (id) DO NOTHING
                """, [user_id, email, name, phone])
            
            return JsonResponse({'status': 'ok'}, status=200)
        
        return JsonResponse({'status': 'ignored'}, status=200)
    
    except Exception as e:
        return JsonResponse(
            {'error': str(e)}, 
            status=500
        )
```

---

## Session Refresh Handling

JWT tokens expire. The frontend should handle token refresh:

```typescript
// Frontend: Automatic token refresh
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    // New token is available, retry failed requests
    retryFailedRequests()
  }
})

// On 401 from Django, attempt refresh
async function fetchWithRefresh(url: string, options: RequestInit) {
  const response = await fetch(url, options)
  
  if (response.status === 401) {
    // Try refreshing the session
    const { data, error } = await supabase.auth.refreshSession()
    if (data.session) {
      // Retry with new token
      const newOptions = {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${data.session.access_token}`,
        },
      }
      return fetch(url, newOptions)
    }
  }
  
  return response
}
```

---

## Supabase Webhook Configuration

Configure the webhook in Supabase Dashboard → Authentication → Hooks:

| Setting | Value |
|---|---|
| **URL** | `https://api.domainhub.co.tz/webhooks/supabase-auth` |
| **Events** | `user.created`, `user.updated` |
| **Secret** | (Generate and store in Django `.env` as `SUPABASE_WEBHOOK_SECRET`) |

Verify the webhook signature in Django:

```python
import hmac
import hashlib

def verify_webhook_signature(request):
    signature = request.headers.get('x-supabase-signature', '')
    expected = hmac.new(
        settings.SUPABASE_WEBHOOK_SECRET.encode(),
        request.body,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)
```
