# TOGETHER — Autonomous Agentic Commerce & Collaborative Procurement Engine

> **Razorpay Buildathon Submission**  
> **Track**: *AI Growth & Agentic Commerce* — Growing merchant revenue and making merchants 100% transactable by AI buyers end-to-end with bounded, explainable, and audited payment execution.

---

![System Architecture](docs/images/01-system-architecture.png)

---

## 🏆 Razorpay Buildathon Alignment & Vision

### The Problem
Traditional e-commerce platforms were built for humans browsing websites with manual mouse clicks. As AI agents become the primary buyers of products on behalf of individuals, families, and organizations, merchants risk losing revenue unless their catalog, purchasing rules, and checkout APIs are **agent-readable and agent-transactable**. Furthermore, group purchases (travel, office supplies, team gear) suffer from fragmented communication, unverified payment split requests, and budget overruns.

### The Solution: TOGETHER
**TOGETHER** is an end-to-end Agentic Commerce & Collaborative Procurement Engine integrated with **Razorpay Test Mode APIs**. It enables both solo buyers and collaborative groups to:
1. **Express Natural Intent**: State purchase needs via text or hands-free **Voice AI Assistant**.
2. **Execute Agentic Catalog Search**: Match prompt intent against 100+ items, enforce exact price bounds, and prevent budget overruns automatically.
3. **Establish Consensual Group Approval**: Manage group membership, enforce owner authorization, and maintain transparent consensus.
4. **Autonomous Bounded Payment Execution**: Execute Razorpay Test Mode checkouts via voice ("Yes" / "No") or click, verified server-side with HMAC SHA256 signatures, idempotent webhook reconciliation, and a complete audit trail.

---

## 📐 Architecture Diagrams & Technical Deep Dives

### 1. System Architecture
Comprehensive view of the web application, backend API services, PostgreSQL database layer, Razorpay payment gateway integration, and webhook listeners.

![01-system-architecture.png](docs/images/01-system-architecture.png)

---

### 2. Complete User Journey
Step-by-step walkthrough from initial prompt formulation and product discovery to group approval, payment execution, and receipt generation.

![02-complete-user-journey.png](docs/images/02-complete-user-journey.png)

---

### 3. Group Shopping & Procurement Flow
How multiple users collaborate, join groups, allocate proposals to shared circles, and collect necessary approvals before initiating payment.

![03-group-shopping-flow.png](docs/images/03-group-shopping-flow.png)

---

### 4. Product Matching & Budget Guard Engine
Autonomous matching logic that parses search keywords, enforces strict budget bounds, filters catalog options, and alerts when items exceed limits.

![04-product-matching-flow.png](docs/images/04-product-matching-flow.png)

---

### 5. Purchase State Machine
State transitions enforcing strict phase gates (`DRAFT` → `PENDING_APPROVAL` → `PENDING_PAYMENT` → `PAID` / `FAILED`).

![05-purchase-state.png](docs/images/05-purchase-state.png)

---

### 6. Database Schema & Entity Relationships
Relational schema connecting Users, Groups, Group Memberships, Catalog Products, Merchants, Purchases, Approvals, Webhook Events, and Audit Logs.

![06-database-relationships.png](docs/images/06-database-relationships.png)

---

### 7. Payment Sequence & Verification
Razorpay Test Mode order creation flow, frontend modal initialization, dual verification (HMAC SHA256 timing-safe signature check and direct server-to-server Razorpay API lookup fallback).

![07-payment-sequence.png](docs/images/07-payment-sequence.png)

---

### 8. Webhook Idempotency & Deduplication
HMAC SHA256 signature verification, event hashing, unique constraint database insertion, and transactional state update guaranteeing zero double-captures.

![08-webhook-idempotency.png](docs/images/08-webhook-idempotency.png)

---

### 9. REST API Endpoint Structure
Clear separation of concerns across Catalog, Groups, Purchases, Payments, Webhooks, and Audit Trail modules.

![09-api-structure.png](docs/images/09-api-structure.png)

---

### 10. Failure Modes, Recovery & Real-time Audit Trail
System resilience handling network interruptions, signature validation failures, payment dropouts, and real-time audit trail recording.

![10-failure-and-recovery.png](docs/images/10-failure-and-recovery.png)

---

## 🌟 Key Features & Innovations

- 🎤 **Hands-Free Voice AI Payment Assistant**: Integrated browser Speech Recognition and Web Speech Synthesis (`SpeechSynthesisUtterance`). Listens for natural verbal confirmation ("Yes", "Proceed", "Pay") to trigger payment or ("No", "Cancel") to decline. Includes instant Mute/Unmute audio controls.
- 🤖 **Intelligent Agentic Catalog Matching**: Ranks 100+ catalog products based on keyword relevance and budget limits. Includes budget overflow warnings (e.g. flagging ₹4,999 item against ₹5,000 budget) and filter tabs.
- 👥 **Group Commerce & Role-Based Access Control**: Owners create groups, invite members, and maintain exclusive control over membership edits. Rejects non-member group purchase attempts with HTTP 403.
- 🔐 **Dual Payment Verification**: Combines client signature verification with fallback server-to-server Razorpay REST API checks (`razorpay.payments.fetch(paymentId)`).
- 🛡️ **Cryptographic Webhook Idempotency**: Secures `POST /api/webhooks/razorpay` with `crypto.timingSafeEqual` signature checks and prevents duplicate delivery replay attacks.
- 📋 **Immutable Audit Log**: Records every state change (`PURCHASE_CREATED`, `APPROVAL_GRANTED`, `PAYMENT_CONFIRMED`, `WEBHOOK_DUPLICATE`) with timestamped metadata.

---

## 🛠️ Tech Stack & Infrastructure

- **Frontend**: Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4
- **Backend**: Express 5, Node.js (v20+), TypeScript
- **Database & ORM**: PostgreSQL 17 (Docker container `together-postgres`), Prisma ORM 7
- **Payment Infrastructure**: Razorpay Test Mode APIs & Webhooks
- **Voice AI**: Web Speech API (SpeechRecognition & SpeechSynthesis)
- **Testing**: Native Node.js Test Runner (`node:test`, `node:assert/strict`) with `tsx`

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: v20 or higher
- **Docker Desktop**: For running PostgreSQL locally

### 2. Launch PostgreSQL Container
```bash
docker compose up -d
```
*Maps local port `5433` to container port `5432`.*

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup & Seeding
```bash
cd apps/api
npx prisma migrate dev
npx tsx prisma/seed.ts
cd ../..
```
*Seeds merchant catalog items across multiple categories (bags, electronics, office gear).*

### 5. Start Development Servers
Run backend API and frontend concurrently:
```bash
# Terminal 1: API Backend (Port 4000)
cd apps/api
npm run dev

# Terminal 2: Next.js Web App (Port 3000)
cd apps/web
npm run dev
```

---

## 🔑 Environment Configuration

### API Backend (`apps/api/.env`)
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/together?schema=public"
PORT=4000
WEB_ORIGIN="http://localhost:3000"
RAZORPAY_KEY_ID="rzp_test_YourKeyIdHere"
RAZORPAY_KEY_SECRET="YourKeySecretHere"
RAZORPAY_WEBHOOK_SECRET="YourWebhookSecretHere"
```

### Web Frontend (`apps/web/.env.local`)
```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

---

## 🧪 Automated Test Suite

The repository features an end-to-end automated test suite testing catalog search, group access permissions, payment validation, and webhook idempotency:

```bash
# Run all tests from root directory
npm test
```

### Test Coverage Highlights (17/17 Passing):
- **Catalog & Products (`tests/products.test.ts`)**: Lookup, keyword matching, budget filtering, 404 validation.
- **Groups & Memberships (`tests/groups.test.ts`)**: Group creation, owner protection, duplicate rejection (409), member removal.
- **Purchases & Approvals (`tests/purchases.test.ts`)**: Group ownership validation, non-member rejection (403), draft state transition.
- **Webhooks & Idempotency (`tests/webhooks.test.ts`)**: HMAC SHA256 timing-safe check, payload tampering rejection, idempotency deduplication.
- **End-to-End (`tests/e2e-payment.test.ts`)**: Complete purchase cycle from intent to Razorpay payment settlement.

---

## 💡 Technical Q&A & Design Rationale

#### Why separate Next.js Web App from Express API?
Separating the web client from the backend API mirrors real-world agentic commerce where external AI agents (or alternative UIs like WhatsApp bots or CLI tools) transact directly with the REST API without relying on Next.js server actions.

#### How is the payment amount protected from tampering?
Payment order amounts (`amountPaise`) are calculated exclusively on the backend from database product records, never accepted blindly from client request payloads.

#### How is webhook signature verified and duplicate delivery handled?
Every webhook request is verified using HMAC SHA256 (`RAZORPAY_WEBHOOK_SECRET`). The unique `x-razorpay-event-id` header is recorded in the `WebhookEvent` table; subsequent requests with the same event ID return `200 OK` with `WEBHOOK_DUPLICATE` logged to the audit trail without modifying database balances.

#### What would need to change before live production payments?
1. Switch `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to Live production keys.
2. Deploy API to a public HTTPS domain with SSL certificates for Razorpay webhook callbacks.
3. Enable PCI-DSS compliant secret vault management (e.g. AWS Secrets Manager or HashiCorp Vault).

---

## 🛠️ "What Broke, and How We Fixed It"

1. **PostgreSQL Container Connection Drop (`Prisma P1001`)**:
   - *Issue*: Local Docker container paused after host sleep mode.
   - *Fix*: Added system readiness script and fallback health check endpoint (`GET /health/database`).
2. **Merchant Schema Type Mismatch**:
   - *Issue*: UI crashed when rendering nested merchant objects from Prisma query.
   - *Fix*: Normalized product payload format across all catalog endpoints to ensure client components handle both relational objects and formatted strings cleanly.
3. **Razorpay Test Mode Signature Key Nullability**:
   - *Issue*: Test mode modal handler omitted `razorpay_signature` in certain browser environments.
   - *Fix*: Created a dual-verification strategy fallback that queries `razorpay.payments.fetch(paymentId)` directly when client signatures are absent.

---

## 🎬 5-Minute Pitch & Video Demo Outline

| Timestamp | Topic | Key Highlight |
|---|---|---|
| **0:00 - 0:45** | Problem & Vision | AI Agent Commerce & Razorpay Test Mode Integration. |
| **0:45 - 1:30** | Intent & Catalog Search | Expressing needs via text/voice, 100+ item catalog matching. |
| **1:30 - 2:30** | Group Procurement | Group formation, member access control, consensual approval. |
| **2:30 - 3:45** | Voice AI Payment | Hands-free "Yes"/"No" voice payment execution with Razorpay modal. |
| **3:45 - 4:30** | Webhook & Audit Trail | Live HMAC signature verification, duplicate deduplication, audit log. |
| **4:30 - 5:00** | Conclusion | Security posture, scalability, and production readiness. |

---

## 📄 License

ISC License. Built for the Razorpay Buildathon 2026.
