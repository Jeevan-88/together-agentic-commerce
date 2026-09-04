# Architecture & Technical Specification

This document details the system design, data models, state machines, and API contracts for TOGETHER.

---

## 1. System Topology

```
+-------------------------------------------------------------+
|                      Client Layer                           |
|  Next.js 16 (React 19, Tailwind CSS v4, Web Speech API)     |
+------------------------------+------------------------------+
                               | HTTPS / JSON
+------------------------------v------------------------------+
|                       API Layer                             |
|  Express 5 (TypeScript, Zod Validation, Helmet, CORS)       |
+--------------+-------------------------------+--------------+
               |                               |
               | Prisma ORM                    | HTTPS
+--------------v---------------+  +------------v--------------+
|       Data Layer             |  |      Payment Gateway      |
|  PostgreSQL 17 Container     |  |      Razorpay Test Mode   |
|  (Tables: User, Group,       |  |  (Orders, Payments,       |
|   Member, Product, Purchase, |  |   Webhook Callbacks)      |
|   Payment, Webhook, Audit)   |  +---------------------------+
+------------------------------+
```

---

## 2. State Machines

### Purchase Status Lifecycle

```
[ DRAFT ]
   |
   | User / Group Approval (POST /api/purchases/:id/approve)
   v
[ PENDING_PAYMENT ]
   |
   | Payment Order Creation & Razorpay Checkout
   v
[ PAYMENT_PROCESSING ]
   |
   +---> Webhook: payment.captured / Verification Success ---> [ PAID ]
   |
   +---> Webhook: payment.failed / Verification Failure   ---> [ FAILED ]
   |
   +---> Cancellation                                    ---> [ CANCELLED ]
```

### Payment Status Lifecycle

```
[ CREATED ]
   |
   v
[ AUTHORIZED ]
   |
   +---> Capture Confirmation ---> [ CAPTURED ]
   |
   +---> Failure / Rejection  ---> [ FAILED ]
```

---

## 3. Database Schema Reference

- **User**: Represents buyers and group owners (`id`, `name`, `email`, `createdAt`, `updatedAt`).
- **Group**: A collaborative shopping circle (`id`, `name`, `createdBy`, `createdAt`, `updatedAt`).
- **GroupMember**: Junction connecting users to groups with roles (`id`, `groupId`, `userId`, `role`: `OWNER` | `MEMBER`, `joinedAt`).
- **Merchant**: Product supplier (`id`, `name`, `slug`, `active`).
- **Product**: Catalog item (`id`, `merchantId`, `name`, `description`, `pricePaise`, `currency`, `metadata`).
- **Purchase**: Purchase entity (`id`, `userId`, `groupId`, `mode`: `SOLO` | `GROUP`, `status`, `totalPaise`, `currency`, `requestText`).
- **PurchaseItem**: Snapshot of product details at checkout time (`id`, `purchaseId`, `productId`, `productName`, `merchantName`, `unitPricePaise`, `quantity`).
- **Approval**: Consensus state for a purchase (`id`, `purchaseId`, `status`: `PENDING` | `APPROVED` | `REJECTED` | `EXPIRED`, `approvedBy`, `approvedAt`, `expiresAt`).
- **Payment**: Razorpay order tracking (`id`, `purchaseId`, `status`, `amountPaise`, `currency`, `razorpayOrderId`, `razorpayPaymentId`, `capturedAt`).
- **WebhookEvent**: Idempotency ledger for incoming callbacks (`id`, `eventId`, `eventType`, `payloadHash`, `receivedAt`, `processedAt`).
- **AuditLog**: Immutable historical events (`id`, `purchaseId`, `action`, `actorId`, `details`, `createdAt`).

---

## 4. Webhook Reconciliation & Idempotency

Incoming webhooks at `POST /api/webhooks/razorpay`:
1. **Raw Body Buffer Verification**: The route utilizes `express.raw({ type: "application/json" })` to ensure the cryptographic payload is byte-for-byte identical to what Razorpay signed.
2. **Signature Verification**: Verifies `X-Razorpay-Signature` against `RAZORPAY_WEBHOOK_SECRET` using `crypto.timingSafeEqual`.
3. **Event Deduplication**: Attempts insertion into `WebhookEvent` table with unique constraint on `eventId`. If duplicate is caught:
   - Records `WEBHOOK_DUPLICATE` in audit trail.
   - Responds with `200 OK` and `{ duplicate: true }`.
   - Halts further state modification to avoid duplicate side effects.
4. **Consistency Checks**: Confirms that payload amount and currency strictly match the purchase database record.
