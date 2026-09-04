# TOGETHER

A collaborative group and solo commerce platform designed for the Razorpay Buildathon. TOGETHER bridges the gap between collective intent, product discovery, consensual approval, and fast, verified payment settlement.

---

## Project Overview

Shopping with others is often messy. Friends, families, or coworkers share links across chat apps, lose track of budgets, disagree on choices, and struggle with who pays.

TOGETHER turns group and solo shopping into a structured, transparent process:
1. **Intent Formulation**: State what you want to buy using text or voice input.
2. **Catalog Discovery**: Compare merchant products by price, capacity, weight, and feature match.
3. **Consensual Approval**: Organize a shopping group, review options, and gain consensus.
4. **Verified Checkout**: Launch Razorpay Test Mode checkout with server-side signature verification, duplicate-safe webhook reconciliation, and a complete audit trail.

---

## System Architecture

```
User (Browser)
  -> Next.js Web App (Port 3000)
       -> Express API (Port 4000)
            -> PostgreSQL (Port 5433, Prisma 7)
            -> Razorpay API (Order creation, lookup)

Razorpay Gateway
  -> Webhook (POST /api/webhooks/razorpay)
       -> HMAC SHA256 Signature Verification
       -> Idempotent Event Deduplication
       -> Express API
            -> Purchase & Payment State Update (PAID / FAILED)
            -> Audit Trail Log
```

### Core Flows

#### 1. Group Flow
```
Users -> Group Creation -> Add Members -> Selection -> Product Match -> Collective Approval -> Payment
```

#### 2. Payment Flow
```
Purchase Draft -> Approval Granted (PENDING_PAYMENT) -> Create Payment Order -> Razorpay Modal Checkout -> Verification (Signature / Fallback) -> Confirmed
```

#### 3. Webhook Reconciliation Flow
```
Razorpay Event -> Signature Check (HMAC SHA256) -> Event ID Deduplication -> Amount & Currency Validation -> Transactional State Update -> Audit Log
```

#### 4. Audit Trail Flow
Every milestone triggers an immutable audit entry:
- `PURCHASE_CREATED`
- `PURCHASE_VALIDATED`
- `APPROVAL_CREATED`
- `APPROVAL_GRANTED`
- `PAYMENT_ORDER_CREATED`
- `PAYMENT_CONFIRMED`
- `PAYMENT_FAILED`
- `WEBHOOK_RECEIVED`
- `WEBHOOK_DUPLICATE`

---

## Tech Stack

- **Frontend**: Next.js 16.3.4 (Turbopack, App Router), React 19, Tailwind CSS v4
- **Backend**: Express 5, Node.js, TypeScript
- **Database & ORM**: PostgreSQL 17 (Docker container `together-postgres`), Prisma 7
- **Payment Gateway**: Razorpay Test Mode
- **Testing**: Native Node.js Test Runner (`node:test`, `node:assert/strict`) with `tsx`

---

## Deployment & Environments

### Local Endpoints
- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **PostgreSQL**: `localhost:5433` (Docker container: `together-postgres`)

### Production Endpoints
- **Production API**: https://together-api-rho.vercel.app
- **Production Frontend**: https://together-web-kohl.vercel.app

---

## Environment Variables

### Backend (`apps/api/.env`)
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (e.g., `postgresql://postgres:postgres@localhost:5433/together?schema=public`) |
| `PORT` | API server port (default: `4000`) |
| `WEB_ORIGIN` | Allowed CORS origin (e.g., `http://localhost:3000` or production URL) |
| `RAZORPAY_KEY_ID` | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay API key secret |
| `RAZORPAY_WEBHOOK_SECRET` | Secret used to verify HMAC SHA256 signatures on incoming webhooks |

### Frontend (`apps/web/.env.local`)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API (e.g., `http://localhost:4000` or production API) |

---

## Local Development Setup

### 1. Prerequisites
- Node.js (v20+ recommended, tested on v24)
- Docker Desktop (for local PostgreSQL container)

### 2. Start PostgreSQL Database
```bash
docker compose up -d
```
PostgreSQL runs on port `5433` mapped to container port `5432`.

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
Seeds catalog items from merchants:
- TrailWorks: Urban Trail 25L (₹4,999)
- Northline: Voyager Carry 28L (₹5,499)
- MoveDaily: LitePack 24L (₹4,399)

### 5. Start Development Servers
Start both backend and frontend:
```bash
# Terminal 1: Backend API (Port 4000)
cd apps/api
npm run dev

# Terminal 2: Frontend Web App (Port 3000)
cd apps/web
npm run dev
```

---

## Testing

An automated test suite covers all API routes, edge cases, group access controls, and payment/webhook scenarios:

```bash
# Run all tests from repository root
npm test
```

### Test Suite Coverage
- **Catalog & Products (`tests/products.test.ts`)**: Listing, lookup by ID, 404 for unknown items, ranking recommendations, validation on short query text.
- **Groups & Membership (`tests/groups.test.ts`)**: Group creation, OWNER assignment, duplicate member prevention (409), protection against removing group owner (409), member removal, demo user groups.
- **Purchases & Approvals (`tests/purchases.test.ts`)**: Solo purchase lifecycle, invalid payload rejections, group purchase without groupId (400), group purchase by non-member (403), draft-to-approval transition, duplicate payment order prevention.
- **Webhooks & Idempotency (`tests/webhooks.test.ts`)**: HMAC SHA256 signature verification, rejection of tampered payloads, safe handling of unknown orders, payment.captured processing, duplicate delivery idempotency, amount mismatch detection, currency mismatch detection, payment.failed event handling.
- **End-to-End (`tests/e2e-payment.test.ts`)**: Full Solo and Group transaction journeys with real database records and webhook settlements.

---

## "What Broke, and How You Got Out?"

Real engineering challenges encountered during development and their resolutions:

### 1. PostgreSQL Container Stopped (Prisma P1001)
- **Symptom**: The backend suddenly failed with `PrismaClientInitializationError: Can't reach database server at localhost:5433 (P1001)`.
- **Root Cause**: The local Docker container (`together-postgres`) was paused after a system restart, causing all connection attempts on port 5433 to drop.
- **Resolution**: Diagnosed using `docker ps -a`, started the container via `docker compose up -d`, and verified connectivity via `GET /health/database` which runs `SELECT 1`.

### 2. Merchant Response Object vs String Runtime Error
- **Symptom**: The frontend results page crashed when rendering products with `Objects are not valid as a React child (found: object with keys {id, name, slug})`.
- **Root Cause**: Prisma was returning `merchant` as an included relational object (`{ id, name, slug }`), while earlier frontend code assumed `product.merchant` was a string.
- **Resolution**: Updated all components to safely extract `typeof product.merchant === "string" ? product.merchant : product.merchant?.name || "Merchant"`.

### 3. Razorpay Test Mode Handler Field Omission
- **Symptom**: During simulated checkouts in Razorpay Test Mode, handler responses occasionally omitted either `razorpay_order_id` or `razorpay_signature`.
- **Root Cause**: Test Mode checkout modals can return incomplete response objects on certain browsers or interrupted payments.
- **Resolution**: Built a dual-verification strategy in `POST /api/purchases/:id/verify-payment`: when signature is present, it validates via HMAC SHA256 timing-safe comparison; when absent, it executes an authenticated server-to-server payment fetch (`razorpay.payments.fetch(paymentId)`) to verify amount, order linkage, and captured status.

---

## 5-Minute Video Demonstration Plan

| Timestamp | Segment | Description |
|---|---|---|
| **0:00 - 0:30** | The Problem | Group shopping friction: link sharing, budget confusion, split payments, lack of trust. |
| **0:30 - 1:00** | What TOGETHER Does | Unified platform for group and solo shopping with Razorpay settlement. |
| **1:00 - 1:30** | Shopping Request | Formulate shopping intent via text or the built-in Voice Input (Speak button). |
| **1:30 - 2:00** | Product Comparison | Transparent catalog view comparing price, capacity, weight, and merchant fit. |
| **2:00 - 2:30** | Group Creation | Create a shopping circle, add members, establish ownership and consensus. |
| **2:30 - 3:00** | Proposal & Decision | Review product choice, confirm group allocation, approve the purchase. |
| **3:00 - 3:40** | Razorpay Checkout | Open Razorpay Test Mode modal, execute payment order, see verification. |
| **3:40 - 4:20** | Webhook & Audit | Live polling status showing transition to PAID, audit trail, and group members. |
| **4:20 - 4:50** | Resilience & Recovery | Demonstrate duplicate webhook delivery idempotency and safe error recovery. |
| **4:50 - 5:00** | Conclusion | Summary of benefits, security posture, and production readiness. |

---

## Security & Compliance

- **No Exposed Secrets**: All sensitive keys (`RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `DATABASE_URL`) are loaded from environment variables and excluded from source control.
- **Timing-Safe Comparison**: Webhook signatures are verified using `crypto.timingSafeEqual` to eliminate timing attacks.
- **Role Isolation**: Group owners cannot be removed; group purchases reject non-members.
- **Idempotency**: Webhook events are hashed and recorded with unique constraints to prevent duplicate charge processing.

---

## License

ISC License. Built for the Razorpay Buildathon.
