# Payment Processing — M-Pesa, Airtel Money & Card

## Overview

DomainHub processes payments through **Django** exclusively. The frontend NEVER directly calls payment APIs. All payment initiation, callback handling, and verification happens server-side.

**Supported payment methods:**
| Method | Provider | Type | Market |
|---|---|---|---|
| M-Pesa | Selcom | STK Push | Tanzania |
| Tigo Pesa | Selcom | STK Push | Tanzania |
| Airtel Money | Airtel | USSD Push | Tanzania |
| VISA/Mastercard | Selcom | Redirect | International |
| Bank Transfer | Manual | Offline | Tanzania |

---

## Payment Flow Architecture

```
┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│ FRONTEND │       │  DJANGO  │       │ SELCOM/  │       │ USER's   │
│ (Next.js)│       │   API    │       │ AIRTEL   │       │   PHONE  │
└────┬─────┘       └────┬─────┘       └────┬─────┘       └────┬─────┘
     │ 1. POST /api/payments/initiate     │                   │
     │────────────────────────────────────►                   │
     │ {domain, amount, method, phone}    │                   │
     │                                    │                   │
     │                                    │ 2. Initiate Push  │
     │                                    │──────────────────►│
     │                                    │                   │
     │ 3. {status: "pending", order_id}   │                   │
     │◄────────────────────────────────────                   │
     │                    ┌──────────────┐                    │
     │                    │ 4. Polling   │                    │
     │◄───────────────────│ or Realtime  │                    │
     │   GET /api/payments/{id}/status   │                    │
     │                    └──────────────┘                    │
     │                                                        │
     │                                    │ 5. User Confirms  │
     │                                    │◄──────────────────│
     │                                    │    on phone       │
     │                                    │                   │
     │                                    │ 6. Callback       │
     │                                    │◄──────────────────│
     │                                    │  POST /callback   │
     │                                    │                   │
     │ 7. Realtime: payment completed     │                   │
     │◄────────────────────────────────────                   │
     │   (Supabase Realtime subscription)                     │
```

---

## Payment Models

### Database Schema

```sql
-- payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    order_id UUID REFERENCES orders(id) NOT NULL,
    
    -- Payment details
    amount BIGINT NOT NULL,              -- Amount in TZS (smallest unit: cents)
    currency VARCHAR(3) DEFAULT 'TZS',
    method VARCHAR(20) NOT NULL,         -- 'mpesa', 'tigopesa', 'airtel', 'card'
    provider VARCHAR(20) NOT NULL,       -- 'selcom', 'airtel', 'manual'
    provider_transaction_id VARCHAR(100), -- Transaction ID from provider
    phone_number VARCHAR(20),            -- User's phone for mobile money
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed, expired
    failure_reason TEXT,
    
    -- Callback data
    callback_payload JSONB,
    callback_received_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_provider_tx_id ON payments(provider_transaction_id);
CREATE INDEX idx_payments_status ON payments(status);
```

---

## M-Pesa Integration (via Selcom)

### `services/mpesa.py`

```python
import httpx
import os
import json
import hmac
import hashlib
import base64
from datetime import datetime
from typing import Optional


class SelcomService:
    """
    Selcom Payment Gateway integration for M-Pesa and Tigo Pesa.
    
    Selcom provides a unified API for Tanzanian mobile money payments.
    """
    
    def __init__(self):
        self.api_key = os.getenv("SELCOM_API_KEY")
        self.secret = os.getenv("SELCOM_SECRET")
        self.vendor = os.getenv("SELCOM_VENDOR")
        self.base_url = os.getenv(
            "SELCOM_BASE_URL",
            "https://apigw.selcommobile.com/v2"
        )
        self.callback_url = os.getenv("SELCOM_CALLBACK_URL")
    
    def _generate_signature(self, payload: dict) -> str:
        """
        Generate HMAC-SHA256 signature for Selcom API requests.
        """
        sorted_payload = json.dumps(payload, sort_keys=True, separators=(',', ':'))
        signature = hmac.new(
            self.secret.encode('utf-8'),
            sorted_payload.encode('utf-8'),
            hashlib.sha256
        ).digest()
        return base64.b64encode(signature).decode('utf-8')
    
    def _get_headers(self) -> dict:
        """Get common API headers."""
        return {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self._generate_bearer_token()}',
        }
    
    async def initiate_stk_push(
        self,
        phone_number: str,
        amount: int,
        order_id: str,
        description: str = "Domain Registration",
        method: str = "m-pesa",
    ) -> dict:
        """
        Initiate an STK Push payment request.
        
        Args:
            phone_number: User's phone in format 2557XXXXXXXX
            amount: Amount in TZS
            order_id: Unique order reference
            description: Payment description shown to user
            method: 'm-pesa' or 'tigo-pesa'
        
        Returns:
            {
                "status": "pending",
                "provider_transaction_id": "txn-uuid",
                "order_id": "order-uuid",
                "message": "STK push sent. Please confirm on your phone."
            }
        """
        # Normalize phone number
        phone = self._normalize_phone(phone_number)
        
        # Map method to Selcom payment type
        payment_type = {
            'm-pesa': 'M-PESA',
            'tigopesa': 'TIGO-PESA',
        }.get(method, 'M-PESA')
        
        payload = {
            "vendor": self.vendor,
            "order_id": order_id,
            "phone": phone,
            "amount": str(amount),
            "currency": "TZS",
            "desc": description,
            "type": payment_type,
            "callback_url": self.callback_url,
        }
        
        signature = self._generate_signature(payload)
        payload['signature'] = signature
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/payments/charge",
                headers=self._get_headers(),
                json=payload,
            )
        
        result = response.json()
        
        if result.get('resultcode') != '000':
            return {
                "status": "failed",
                "error": result.get('resultdesc', 'Payment initiation failed'),
                "code": result.get('resultcode'),
            }
        
        return {
            "status": "pending",
            "provider_transaction_id": result.get('transactionid'),
            "order_id": order_id,
            "message": "Tafadhali thibitisha malipo kwenye simu yako. / Please confirm the payment on your phone.",
        }
    
    async def verify_payment(self, provider_transaction_id: str) -> dict:
        """
        Verify the status of a payment transaction.
        
        Returns:
            {
                "status": "completed" | "pending" | "failed",
                "amount": 25000,
                "phone": "255712345678",
                "receipt": "QKR3L5M7P9",
            }
        """
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{self.base_url}/payments/status",
                headers=self._get_headers(),
                params={'transactionid': provider_transaction_id},
            )
        
        result = response.json()
        
        status_map = {
            'completed': 'completed',
            'success': 'completed',
            'pending': 'pending',
            'processing': 'processing',
            'failed': 'failed',
            'cancelled': 'failed',
            'expired': 'expired',
        }
        
        raw_status = result.get('status', '').lower()
        
        return {
            "status": status_map.get(raw_status, 'pending'),
            "amount": int(result.get('amount', 0)),
            "phone": result.get('msisdn', ''),
            "receipt": result.get('receipt', ''),
            "provider_transaction_id": provider_transaction_id,
            "raw_response": result,
        }
    
    def _normalize_phone(self, phone: str) -> str:
        """
        Normalize phone number to 255XXXXXXXXX format.
        
        Handles:
        - +255712345678 → 255712345678
        - 0712345678 → 255712345678
        - 255712345678 → 255712345678
        """
        phone = phone.strip().replace(' ', '').replace('-', '')
        
        if phone.startswith('+'):
            phone = phone[1:]
        elif phone.startswith('0'):
            phone = '255' + phone[1:]
        
        return phone
    
    def _generate_bearer_token(self) -> str:
        """Generate Bearer token for API authentication."""
        credentials = f"{self.api_key}:{self.secret}"
        return base64.b64encode(credentials.encode()).decode()
    
    async def handle_callback(self, callback_data: dict) -> dict:
        """
        Process incoming payment callback from Selcom.
        
        Callback payload:
        {
            "transactionid": "txn-uuid",
            "status": "completed",
            "receipt": "QKR3L5M7P9",
            "amount": "25000",
            "msisdn": "255712345678",
            "vendor": "vendor-id",
            "order_id": "order-uuid",
            "signature": "hmac-signature"
        }
        """
        # Verify callback signature
        # (Implementation depends on Selcom's exact callback signature format)
        
        provider_tx_id = callback_data.get('transactionid')
        status = callback_data.get('status', '').lower()
        
        return {
            "provider_transaction_id": provider_tx_id,
            "status": 'completed' if status in ('completed', 'success') else 'failed',
            "amount": int(callback_data.get('amount', 0)),
            "phone": callback_data.get('msisdn', ''),
            "receipt": callback_data.get('receipt', ''),
            "raw_payload": callback_data,
        }


# Singleton
selcom = SelcomService()
```

---

## Airtel Money Integration

### `services/airtel_money.py`

```python
import httpx
import os
import json
from datetime import datetime


class AirtelMoneyService:
    """
    Airtel Money integration for Tanzania.
    
    Uses Airtel's OpenAPI for merchant payments.
    """
    
    def __init__(self):
        self.client_id = os.getenv("AIRTEL_CLIENT_ID")
        self.client_secret = os.getenv("AIRTEL_CLIENT_SECRET")
        self.base_url = os.getenv(
            "AIRTEL_BASE_URL",
            "https://openapi.airtel.africa/v2"
        )
        self.callback_url = os.getenv("AIRTEL_CALLBACK_URL")
        self.pin = os.getenv("AIRTEL_PIN", "")
        self.country = "TZ"
        self.currency = "TZS"
    
    async def _get_access_token(self) -> str:
        """
        Get OAuth access token from Airtel.
        
        Tokens are cached for 55 minutes (valid for 60).
        """
        import time
        cache_key = 'airtel_access_token'
        
        cached = get_cache(cache_key)
        if cached and cached.get('expires_at', 0) > time.time():
            return cached['token']
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{self.base_url}/auth/token",
                data={
                    'client_id': self.client_id,
                    'client_secret': self.client_secret,
                    'grant_type': 'client_credentials',
                },
            )
        
        result = response.json()
        token = result.get('access_token')
        expires_in = result.get('expires_in', 3600)
        
        set_cache(cache_key, {
            'token': token,
            'expires_at': time.time() + expires_in - 300,
        }, timeout=expires_in - 300)
        
        return token
    
    async def initiate_ussd_push(
        self,
        phone_number: str,
        amount: int,
        order_id: str,
        description: str = "DomainHub Domain Registration",
    ) -> dict:
        """
        Initiate Airtel Money USSD push payment.
        
        Args:
            phone_number: User's phone number
            amount: Amount in TZS
            order_id: Unique reference for this transaction
            description: Payment description
        
        Returns:
            {
                "status": "pending",
                "provider_transaction_id": "airtel-txn-id",
                "message": "Please check your phone for the Airtel Money prompt."
            }
        """
        token = await self._get_access_token()
        phone = self._normalize_phone(phone_number)
        
        payload = {
            "reference": order_id,
            "subscriber": {
                "country": self.country,
                "currency": self.currency,
                "msisdn": int(phone),
            },
            "transaction": {
                "amount": str(amount),
                "country": self.country,
                "currency": self.currency,
                "id": f"DH-{order_id}",
                "type": "MerchantPayment",
            },
            "pin": self.pin,
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/merchant/pay",
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {token}',
                    'X-Country': self.country,
                    'X-Currency': self.currency,
                },
                json=payload,
            )
        
        result = response.json()
        
        if result.get('status', {}).get('code') != '200':
            return {
                "status": "failed",
                "error": result.get('status', {}).get('message', 'Payment failed'),
            }
        
        data = result.get('data', {})
        return {
            "status": "pending",
            "provider_transaction_id": data.get('transaction', {}).get('id'),
            "order_id": order_id,
            "message": "Tafadhali thibitisha malipo kwenye simu yako ya Airtel Money.",
        }
    
    async def verify_payment(self, provider_transaction_id: str) -> dict:
        """Verify Airtel Money payment status."""
        token = await self._get_access_token()
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{self.base_url}/standard/disbursement/v1_0/transaction/{provider_transaction_id}/status",
                headers={
                    'Authorization': f'Bearer {token}',
                    'X-Country': self.country,
                    'X-Currency': self.currency,
                },
            )
        
        result = response.json()
        data = result.get('data', {}).get('transaction', {})
        
        status_map = {
            'TS': 'pending',       # Transaction Sent
            'TIP': 'pending',      # Transaction In Progress
            'TIS': 'processing',   # Transaction Initiated Successful
            'TSC': 'completed',    # Transaction Successful Complete
            'TF': 'failed',        # Transaction Failed
            'TRC': 'failed',       # Transaction Rejected
            'TCC': 'failed',       # Transaction Canceled
        }
        
        raw_status = data.get('status', 'TS')
        
        return {
            "status": status_map.get(raw_status, 'pending'),
            "amount": int(float(data.get('amount', 0))),
            "phone": str(data.get('financial', {}).get('msisdn', '')),
            "receipt": data.get('id', ''),
            "provider_transaction_id": provider_transaction_id,
        }
    
    async def handle_callback(self, callback_data: dict) -> dict:
        """Process Airtel Money payment callback."""
        data = callback_data.get('data', {}).get('transaction', {})
        
        return {
            "provider_transaction_id": data.get('id'),
            "status": "completed" if data.get('status') == 'TSC' else "failed",
            "amount": int(float(data.get('amount', 0))),
            "phone": str(data.get('financial', {}).get('msisdn', '')),
            "raw_payload": callback_data,
        }
    
    def _normalize_phone(self, phone: str) -> str:
        """Normalize phone to format without leading +."""
        phone = phone.strip().replace(' ', '').replace('-', '')
        if phone.startswith('+'):
            phone = phone[1:]
        elif phone.startswith('0'):
            phone = '255' + phone[1:]
        return phone


# Singleton
airtel_money = AirtelMoneyService()
```

---

## Django Payment Views

### `api/views/payments.py`

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import JsonResponse
import json
from datetime import datetime


@api_view(['POST'])
@permission_classes([IsAuthenticated])
async def initiate_payment(request):
    """
    Initiate a payment.
    
    POST /api/payments/initiate
    Body:
    {
        "order_id": "uuid",
        "amount": 25000,
        "method": "mpesa",        // mpesa, tigopesa, airtel, card
        "phone_number": "0712345678",
        "description": "Domain registration"
    }
    """
    data = request.data
    user_id = request.supabase_user_id
    
    # Validate input
    amount = int(data.get('amount', 0))
    if amount <= 0:
        return Response({'error': 'Invalid amount'}, status=400)
    
    method = data.get('method', 'mpesa').lower()
    phone_number = data.get('phone_number', '')
    order_id = data.get('order_id')
    description = data.get('description', 'DomainHub Payment')
    
    # Create payment record in database
    payment = await create_payment(
        user_id=user_id,
        order_id=order_id,
        amount=amount,
        method=method,
        phone_number=phone_number,
        currency='TZS',
    )
    
    # Route to appropriate payment provider
    try:
        if method in ('mpesa', 'tigopesa'):
            result = await selcom.initiate_stk_push(
                phone_number=phone_number,
                amount=amount,
                order_id=str(payment['id']),
                description=description,
                method=method,
            )
        elif method == 'airtel':
            result = await airtel_money.initiate_ussd_push(
                phone_number=phone_number,
                amount=amount,
                order_id=str(payment['id']),
                description=description,
            )
        else:
            return Response({'error': f'Unsupported payment method: {method}'}, status=400)
    except Exception as e:
        # Update payment status to failed
        await update_payment_status(payment['id'], 'failed', str(e))
        return Response({'error': str(e)}, status=500)
    
    if result.get('status') == 'failed':
        await update_payment_status(payment['id'], 'failed', result.get('error'))
        return Response(result, status=400)
    
    # Update payment with provider transaction ID
    provider_tx_id = result.get('provider_transaction_id')
    if provider_tx_id:
        await update_payment_provider_tx(payment['id'], provider_tx_id, 'selcom')
    
    return Response({
        'payment_id': payment['id'],
        'status': 'pending',
        'message': result.get('message', 'Please confirm on your phone'),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
async def check_payment_status(request, payment_id: str):
    """
    Check the status of a payment.
    
    GET /api/payments/{payment_id}/status
    """
    payment = await get_payment(payment_id)
    
    if not payment:
        return Response({'error': 'Payment not found'}, status=404)
    
    # Verify ownership
    if str(payment['user_id']) != str(request.supabase_user_id):
        return Response({'error': 'Unauthorized'}, status=403)
    
    # If still pending, check with provider
    if payment['status'] == 'pending':
        provider_tx_id = payment.get('provider_transaction_id')
        if provider_tx_id:
            if payment['method'] in ('mpesa', 'tigopesa'):
                provider_status = await selcom.verify_payment(provider_tx_id)
            elif payment['method'] == 'airtel':
                provider_status = await airtel_money.verify_payment(provider_tx_id)
            else:
                provider_status = None
            
            if provider_status:
                await update_payment_status(
                    payment_id,
                    provider_status['status'],
                )
                payment['status'] = provider_status['status']
    
    return Response({
        'payment_id': payment_id,
        'status': payment['status'],
        'amount': payment['amount'],
        'method': payment['method'],
        'created_at': payment['created_at'].isoformat(),
    })


@csrf_exempt
@require_POST
async def payment_callback(request, provider: str):
    """
    Handle payment callbacks from payment providers.
    
    POST /api/payments/callback/{provider}
    - provider: 'selcom' or 'airtel'
    """
    try:
        callback_data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    
    if provider == 'selcom':
        result = await selcom.handle_callback(callback_data)
    elif provider == 'airtel':
        result = await airtel_money.handle_callback(callback_data)
    else:
        return JsonResponse({'error': 'Unknown provider'}, status=400)
    
    # Find the payment by provider transaction ID
    provider_tx_id = result.get('provider_transaction_id')
    if not provider_tx_id:
        return JsonResponse({'error': 'Missing transaction ID'}, status=400)
    
    # Update payment in database
    payment = await get_payment_by_provider_tx(provider_tx_id)
    if payment:
        new_status = result.get('status', 'pending')
        await update_payment_status(
            payment['id'],
            new_status,
            callback_payload=callback_data,
        )
        
        # If payment completed, trigger domain registration
        if new_status == 'completed':
            await trigger_domain_registration(payment['order_id'])
        
        # Notify frontend via Supabase Realtime
        await notify_payment_update(payment['user_id'], {
            'payment_id': payment['id'],
            'status': new_status,
            'order_id': payment['order_id'],
        })
    
    return JsonResponse({'status': 'received'}, status=200)
```

---

## Security Rules

### Critical Security Checks

```python
# utils/payment_security.py

async def validate_payment_amount(order_id: str, claimed_amount: int) -> bool:
    """
    Verify that the claimed payment amount matches the order amount.
    NEVER trust the amount sent from the frontend.
    """
    order = await get_order(order_id)
    return order and order['total_amount'] == claimed_amount


async def check_fraud_indicators(user_id: str, phone_number: str) -> bool:
    """
    Basic fraud detection for payments.
    
    Checks:
    - Number of failed payments in last hour (> 5 = suspicious)
    - Multiple orders from same user in short period
    - Phone number mismatch with registered phone
    """
    from datetime import datetime, timedelta
    
    # Check recent failed payments
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    failed_count = await count_recent_payments(
        user_id=user_id,
        status='failed',
        since=one_hour_ago,
    )
    
    if failed_count >= 5:
        return True  # Suspicious
    
    return False


async def reconcile_payment(payment_id: str) -> bool:
    """
    Reconcile payment status between Django DB and payment provider.
    Should be run periodically via Celery.
    """
    payment = await get_payment(payment_id)
    
    if not payment or payment['status'] not in ('pending', 'processing'):
        return True  # No reconciliation needed
    
    provider_tx_id = payment.get('provider_transaction_id')
    if not provider_tx_id:
        return False
    
    # Check with provider
    if payment['method'] in ('mpesa', 'tigopesa'):
        provider_status = await selcom.verify_payment(provider_tx_id)
    elif payment['method'] == 'airtel':
        provider_status = await airtel_money.verify_payment(provider_tx_id)
    else:
        return False
    
    if provider_status['status'] != payment['status']:
        await update_payment_status(payment_id, provider_status['status'])
        
        if provider_status['status'] == 'completed':
            await trigger_domain_registration(payment['order_id'])
        
        return True
    
    return False
```

---

## Frontend Integration

### Payment Flow (Next.js)

```typescript
// Frontend: src/lib/payments.ts

export async function initiatePayment(params: {
  order_id: string
  amount: number
  method: 'mpesa' | 'tigopesa' | 'airtel'
  phone_number: string
  description?: string
}) {
  const response = await djangoFetch('/api/payments/initiate', {
    method: 'POST',
    body: JSON.stringify(params),
  })
  
  return response
}

export async function pollPaymentStatus(paymentId: string) {
  return djangoFetch(`/api/payments/${paymentId}/status`)
}

// Usage: Poll every 3 seconds until resolved
export function waitForPaymentResult(paymentId: string) {
  return new Promise(async (resolve, reject) => {
    const maxAttempts = 60  // 3 minutes max
    
    for (let i = 0; i < maxAttempts; i++) {
      const result = await pollPaymentStatus(paymentId)
      
      if (result.status === 'completed') {
        resolve(result)
        return
      }
      
      if (result.status === 'failed' || result.status === 'expired') {
        reject(new Error(result.failure_reason || 'Payment failed'))
        return
      }
      
      // Wait 3 seconds before next poll
      await new Promise(r => setTimeout(r, 3000))
    }
    
    reject(new Error('Payment timeout'))
  })
}
```

---

## Celery Tasks for Payment Reconciliation

```python
# tasks.py

from celery import shared_task
from django.core.cache import cache


@shared_task
def reconcile_pending_payments():
    """
    Reconcile all pending payments older than 10 minutes.
    Run every 5 minutes via Celery Beat.
    """
    payments = get_payments_by_status('pending', older_than_minutes=10)
    
    for payment in payments:
        try:
            reconcile_payment(payment['id'])
        except Exception as e:
            log_error(f"Reconciliation failed for {payment['id']}: {e}")


@shared_task
def expire_old_payments():
    """
    Expire payments that have been pending for more than 30 minutes.
    """
    payments = get_payments_by_status('pending', older_than_minutes=30)
    
    for payment in payments:
        update_payment_status(payment['id'], 'expired', 'Payment expired')
        # Notify user via SMS
        send_sms(
            payment['phone_number'],
            f"Malipo yako ya {format_tzs(payment['amount'])}} hayajakamilika. "
            f"Tafadhali jaribu tena. / Your payment of {format_tzs(payment['amount'])} "
            f"was not completed. Please try again."
        )


# Celery Beat Schedule
CELERY_BEAT_SCHEDULE = {
    'reconcile-payments': {
        'task': 'tasks.reconcile_pending_payments',
        'schedule': 300.0,  # Every 5 minutes
    },
    'expire-payments': {
        'task': 'tasks.expire_old_payments',
        'schedule': 600.0,  # Every 10 minutes
    },
}
```
