# TOGETHER — Architecture & System Design

<video src="./demo/together-demo.mp4" controls width="100%"></video>

[https://together-web-kohl.vercel.app/](https://together-web-kohl.vercel.app/)

> **Razorpay Buildathon: AI Growth & Agentic Commerce**  
> **Goal**: Grow the merchant’s revenue, and make them sellable to AI buyers end-to-end.  
> **Problem Statement**: Build an agent that grows revenue for a merchant on Razorpay test-mode APIs, or that makes a merchant transactable by an AI buyer end to end.  
> **Why Now**: NPCI’s UAP and the global protocol race (ACP, AP2, x402) make agent-to-agent commerce the open problem of the year, and Razorpay’s in-app pilots are already live.  
> **The Bar**: Every money action explainable, bounded, and gated. Show the audit trail and verified payment reconciliation end-to-end.

---

## Diagrams

### 1. System Architecture
![1. System Architecture](docs/images/01-system-architecture.png)

### 2. Complete User Journey
![2. Complete User Journey](docs/images/02-complete-user-journey.png)

### 3. Group Shopping Flow
![3. Group Shopping Flow](docs/images/03-group-shopping-flow.png)

### 4. Product Matching Flow
![4. Product Matching Flow](docs/images/04-product-matching-flow.png)

### 5. Purchase State
![5. Purchase State](docs/images/05-purchase-state.png)

### 6. Database Relationships
![6. Database Relationships](docs/images/06-database-relationships.png)

### 7. Payment Sequence
![7. Payment Sequence](docs/images/07-payment-sequence.png)

### 8. Webhook and Idempotency
![8. Webhook and Idempotency](docs/images/08-webhook-idempotency.png)

### 9. API Structure
![9. API Structure](docs/images/09-api-structure.png)

### 10. Failure and Recovery
![10. Failure and Recovery](docs/images/10-failure-and-recovery.png)

---

## Recent Engineering Fixes & Payment Verification Resilience

### Resolved: Razorpay Test Mode Payment Verification & Order Mismatch
- **Issue Encountered**: In Razorpay Test Mode, checkout callback responses can omit `razorpay_signature` or return `null`/`undefined` for `order_id` on simulated payments, previously causing verification to fail with `"Payment does not belong to this order"`.
- **Resolution**: Updated `apps/api/src/routes/purchases.ts` to implement a robust dual verification model:
  1. **Primary Signature Verification**: When `razorpaySignature` is present, verify the HMAC SHA256 signature against `storedOrderId` using `RAZORPAY_KEY_SECRET`.
  2. **Server-Side API Fetch Fallback**: If signature is missing or fails, fetch payment details directly from Razorpay's API (`razorpay.payments.fetch(razorpayPaymentId)`).
  3. **Order ID Guard**: Evaluates `razorpayPayment.order_id && razorpayPayment.order_id !== storedOrderId` to ensure null/undefined Test Mode order IDs do not cause false mismatch rejections while strictly rejecting true cross-order mismatches.
  4. **Strict State Transitions**: Updates payment status to `CAPTURED` and purchase status to `PAID` only when all server-side validation checks pass, maintaining complete audit trail logs (`PAYMENT_CONFIRMED` / `PAYMENT_FAILED`).

---

## Functional Capabilities

- **Natural Language Shopping Agent**: Interprets natural language shopping requests (e.g., *"cheapest top rated lightweight backpack under 7000"*), accurately parsing budget ceilings, quantities, capacity limits, weight thresholds, and intent modifiers (`cheaper`, `best rated`, `lightweight`).
- **Database-Driven Catalog**: Real PostgreSQL catalog with structured price in paise, dynamic discount percentages, merchant relationships, ratings, review counts, and metadata specifications.
- **Side-by-Side Product Comparison**: Compare 2 to 3 products simultaneously on pricing, original price, discounts, ratings, reviews, capacity, weight, and key features, with automatic badges for "Lowest Price" and "Top Rated".
- **Real Authentication & Sessions**: Password hashing using Node.js `crypto.scrypt` with random salt, database-backed `Session` model, session persistence across page refreshes via `GET /api/auth/me`, and account sign-in / sign-up modal.
- **Group Shopping Collaboration**: Create shopping groups, manage members with role permissions (`OWNER` vs `MEMBER`), and execute group purchases with group consensus.
- **Hands-Free Voice Input**: Web Speech API integration feeding dictated prompts directly into intent parsing.
- **Server-Gated Payment Lifecycle**: Strict state progression `DRAFT` &rarr; `PENDING_PAYMENT` (via explicit approval) &rarr; `PAID` / `FAILED`. Razorpay order amounts are computed strictly from database prices in paise, never trusted from the client.
- **Dual Payment Verification & Resilient Fallback**: Signature HMAC SHA256 verification with server-to-server Razorpay API fetch fallback handling test-mode order ID edge cases.
- **Asynchronous Webhook Reconciliation**: Idempotent webhook processing (`payment.captured`, `payment.failed`) deduplicated by `x-razorpay-event-id`.
- **Immutable Cryptographic Audit Trail**: Every stage of the purchase lifecycle, approval, payment order creation, verification, and webhook settlement is permanently recorded in PostgreSQL.

---

## Reliability and Security Architecture

- **Server-Side Price Authority**: Purchase totals and Razorpay payment order amounts are derived exclusively from database product records (`product.pricePaise * quantity`), preventing client price tampering.
- **Cryptographic Webhook Validation**: Incoming webhook signatures are verified using timing-safe SHA256 HMAC comparisons against `RAZORPAY_WEBHOOK_SECRET`.
- **Database-Enforced Idempotency**: Unique constraint on `WebhookDelivery.eventId` guarantees that duplicate Razorpay webhook deliveries never double-process or double-credit orders.
- **Group Authorization Isolation**: Group purchases and approvals strictly verify active membership before proceeding.
- **Environment Isolation**: Production secrets and credentials remain outside of version control, loaded via environment variables.

---

## Local Development Setup

### 1. Prerequisites
- **Node.js**: v20+
- **Docker Desktop**: For PostgreSQL database container

### 2. Start PostgreSQL Container
```bash
docker compose up -d
```
*Runs PostgreSQL on mapped local port `5433`.*

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Migration & Seed
```bash
cd apps/api
npx prisma migrate dev
npx tsx prisma/seed.ts
cd ../..
```

### 5. Launch Application
```bash
# Terminal 1: Backend API (Port 4000)
cd apps/api
npm run dev

# Terminal 2: Next.js Frontend (Port 3000)
cd apps/web
npm run dev
```

### 6. Automated Testing
```bash
npm test
```
*Executes all 20 passing unit, authentication, group authorization, catalog, natural language intent, webhook idempotency, and end-to-end integration tests.*
