# TOGETHER — Autonomous Agentic Commerce & Collaborative Procurement Engine

> **Razorpay Buildathon Submission**  
> **Track**: *AI Growth & Agentic Commerce* — Growing merchant revenue and making merchants 100% transactable by AI buyers end-to-end with bounded, explainable, and audited payment execution.

---

```mermaid
graph TD
    User["User / AI Agent"] -->|Express Intent & Audio| WebApp["Next.js Web App (Port 3000)"]
    WebApp -->|REST API Requests| API["Express Engine (Port 4000)"]
    API -->|Prisma ORM| DB[(PostgreSQL Database)]
    API -->|Order & Verification| RZP["Razorpay Test Gateway"]
    RZP -->|HMAC Webhook Callback| API
    API -->|Audit Trail Log| DB
```

---

## 🏆 Razorpay Buildathon Alignment & Vision

### The Problem
Traditional e-commerce platforms were built for humans browsing websites with manual mouse clicks. As AI agents become the primary buyers of products on behalf of individuals, families, and organizations, merchants risk losing revenue unless their catalog, purchasing rules, and checkout APIs are **agent-readable and agent-transactable**. Furthermore, group purchases (travel, office supplies, team gear) suffer from fragmented communication, unverified payment split requests, and budget overruns.

### The Solution: TOGETHER
**TOGETHER** is an end-to-end Agentic Commerce & Collaborative Procurement Engine integrated with **Razorpay Test Mode APIs**. It enables both solo buyers and collaborative groups to:
1. **Express Natural Intent**: State purchase needs via text or audio input.
2. **Execute Agentic Catalog Search**: Match prompt intent against 100+ items, enforce exact price bounds, and prevent budget overruns automatically.
3. **Establish Consensual Group Approval**: Manage group membership, enforce owner authorization, and maintain transparent consensus.
4. **Autonomous Bounded Payment Execution**: Execute Razorpay Test Mode checkouts with server-side HMAC SHA256 signatures, idempotent webhook reconciliation, and a complete audit trail.

---

## 📐 Interactive System Flow & Architecture Diagrams

### 1. System Architecture Diagram

```mermaid
flowchart TB
    subgraph ClientLayer["Client & Agent Interface"]
        UI["Next.js App Router (React 19, Tailwind)"]
        Voice["Browser Web Speech Engine"]
    end

    subgraph ServerLayer["Backend API Server (Express 5)"]
        CatalogModule["Catalog & Keyword Matcher"]
        GroupModule["Group Access & Owner RBAC"]
        PurchaseModule["Purchase State Machine"]
        PaymentModule["Razorpay Order & Verification Engine"]
        WebhookModule["HMAC-SHA256 Idempotent Webhook Handler"]
    end

    subgraph DataLayer["Persistence & Gateway"]
        PostgreSQL[("PostgreSQL 17 Database")]
        RazorpayAPI["Razorpay Payment Gateway (Test Mode)"]
    end

    UI -->|REST / JSON| CatalogModule
    UI -->|REST / JSON| GroupModule
    UI -->|REST / JSON| PurchaseModule
    UI -->|Checkout Request| PaymentModule
    Voice --> UI

    CatalogModule --> PostgreSQL
    GroupModule --> PostgreSQL
    PurchaseModule --> PostgreSQL
    PaymentModule --> RazorpayAPI
    RazorpayAPI -->|POST /api/webhooks/razorpay| WebhookModule
    WebhookModule --> PostgreSQL
```

![System Architecture](docs/images/01-system-architecture.png)

---

### 2. Complete User Journey Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as User / AI Agent
    participant App as Next.js Web App
    participant API as Express API Server
    participant DB as PostgreSQL Database
    participant RZP as Razorpay Gateway

    Buyer->>App: Input Shopping Prompt & Budget
    App->>API: POST /api/products/recommend
    API->>DB: Query Catalog & Match Keywords
    DB-->>API: Return Matched Products
    API-->>App: Return Filtered Top Options
    Buyer->>App: Select Item & Allocate to Group/Solo
    App->>API: POST /api/purchases (Status: DRAFT)
    App->>API: POST /api/purchases/:id/approve (Status: PENDING_PAYMENT)
    App->>API: POST /api/purchases/:id/payment-order
    API->>RZP: Create Order (amountPaise)
    RZP-->>API: Return razorpayOrderId
    API-->>App: Open Razorpay Checkout Modal
    Buyer->>RZP: Complete Test Mode Payment
    RZP-->>App: Payment Response (PaymentID, OrderID, Signature)
    App->>API: POST /api/purchases/:id/verify-payment
    API->>DB: Update State to PAID & Record Audit Log
    RZP-->>API: Async Webhook (payment.captured)
    API->>DB: Idempotent Webhook Reconciliation & Audit Log
    API-->>App: Confirmed Paid Status
```

![Complete User Journey](docs/images/02-complete-user-journey.png)

---

### 3. Group Procurement & Approval Flow

```mermaid
flowchart LR
    CreateGroup["Owner Creates Shopping Group"] --> AddMembers["Invite Group Members"]
    AddMembers --> ProposeItem["Submit Purchase Proposal"]
    ProposeItem --> CheckOwner{"Owner Authorization Check"}
    CheckOwner -- Rejected --> Block["HTTP 403 Forbidden"]
    CheckOwner -- Approved --> PendingPay["Status: PENDING_PAYMENT"]
    PendingPay --> ExecutePay["Trigger Razorpay Payment"]
```

![Group Shopping Flow](docs/images/03-group-shopping-flow.png)

---

### 4. Product Matching & Budget Guard Engine

![Product Matching Flow](docs/images/04-product-matching-flow.png)

---

### 5. Purchase State Machine

```mermaid
stateDiagram-v2
    [*] --> DRAFT : User / Agent Creates Proposal
    DRAFT --> PENDING_APPROVAL : Submitted for Group Consensus
    PENDING_APPROVAL --> PENDING_PAYMENT : Owner / Group Approves
    PENDING_PAYMENT --> PAID : Razorpay Signature / Webhook Verified
    PENDING_PAYMENT --> FAILED : Payment Declined / Signature Invalid
    PAID --> [*]
    FAILED --> [*]
```

![Purchase State](docs/images/05-purchase-state.png)

---

### 6. Database Schema & Entity Relationships

![Database Relationships](docs/images/06-database-relationships.png)

---

### 7. Razorpay Payment Sequence

![Payment Sequence](docs/images/07-payment-sequence.png)

---

### 8. Webhook Idempotency & Deduplication

```mermaid
flowchart TD
    Hook["Incoming Razorpay Webhook Call"] --> SigCheck{"Verify HMAC SHA256 Signature"}
    SigCheck -- Invalid Signature --> Reject["Return HTTP 400 Bad Request"]
    SigCheck -- Valid Signature --> EventCheck{"Check x-razorpay-event-id in DB"}
    EventCheck -- Already Processed --> Duplicate["Return HTTP 200 OK (Audit Log: WEBHOOK_DUPLICATE)"]
    EventCheck -- New Event --> SaveEvent["Save Event ID to WebhookEvent Table"]
    SaveEvent --> UpdateState["Update Purchase to PAID & Record Audit Trail"]
    UpdateState --> Success["Return HTTP 200 OK"]
```

![Webhook Idempotency](docs/images/08-webhook-idempotency.png)

---

### 9. REST API Endpoint Structure

![API Structure](docs/images/09-api-structure.png)

---

### 10. Failure Modes & Recovery Engine

![Failure and Recovery](docs/images/10-failure-and-recovery.png)

---

## 🌟 Key Features & Innovations

- 🤖 **Intelligent Agentic Catalog Matching**: Ranks 100+ catalog products based on keyword relevance and budget limits. Includes budget overflow warnings and filter tabs.
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

### 3. Environment Setup
Copy template configuration files in `apps/api` and `apps/web` for your local environment variables.

### 4. Install Dependencies
```bash
npm install
```

### 5. Database Setup & Seeding
```bash
cd apps/api
npx prisma migrate dev
npx tsx prisma/seed.ts
cd ../..
```

### 6. Start Development Servers
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

## 📄 License

ISC License. Built for the Razorpay Buildathon 2026.
