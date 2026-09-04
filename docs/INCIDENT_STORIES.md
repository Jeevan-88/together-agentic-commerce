# Real Incident Stories & Engineering Recovery

This document details three real engineering failures encountered during the development of TOGETHER, how they were identified, the technical root causes, and how we recovered from them.

---

## Incident 1: Database Connectivity Loss (Prisma Error P1001)

### What Broke
While testing backend API routes, every database request suddenly failed with:
```
PrismaClientInitializationError: Can't reach database server at `localhost:5433`
Please make sure your database server is running at `localhost:5433`.
Error code: P1001
```
The API server health check at `/health` continued returning 200 OK, but `/health/database` threw 500 Disconnected.

### Investigation
- Checked `apps/api/.env` to confirm the connection string: `postgresql://postgres:postgres@localhost:5433/together?schema=public`.
- Executed `netstat -ano | findstr 5433` which returned empty output: nothing was listening on port 5433.
- Executed `docker ps -a` and discovered that the `together-postgres` container had exited with code 0 after a Docker daemon restart.

### How We Got Out
1. Re-started the container using Docker Compose:
   ```bash
   docker compose up -d
   ```
2. Verified the container was healthy:
   ```bash
   docker ps --filter "name=together-postgres"
   ```
3. Tested database queries through the dedicated health endpoint:
   ```bash
   curl http://localhost:4000/health/database
   # Response: {"success":true,"database":"connected"}
   ```
4. Added persistent Docker restart policies (`restart: unless-stopped`) in `docker-compose.yml` to prevent future automatic stops.

---

## Incident 2: Merchant Object Serialization Runtime Crash

### What Broke
When navigating to the product results page (`/shop/results`), the frontend React application crashed with the following client-side runtime error:
```
Error: Objects are not valid as a React child (found: object with keys {id, name, slug, active, createdAt, updatedAt}).
If you meant to render a collection of children, use an array instead.
```

### Investigation
- Inspected `apps/api/src/routes/products.ts`. The query used:
  ```ts
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { merchant: true }
  });
  ```
  Prisma returned `merchant` as a full object (`{ id: string, name: string, slug: string }`).
- Inspected the frontend JSX in `apps/web/src/app/shop/results/page.tsx`:
  Earlier code had written `<p>{product.merchant}</p>`, directly attempting to render the JavaScript object as text children in React 19.

### How We Got Out
1. Updated product typing on the client to acknowledge both string and merchant object formats:
   ```ts
   type Product = {
     id: string;
     name: string;
     merchant: string | { id: string; name: string; slug: string };
     ...
   };
   ```
2. Implemented safe accessor logic before rendering:
   ```ts
   const merchantName = typeof product.merchant === "string"
     ? product.merchant
     : product.merchant?.name || "Merchant";
   ```
3. Added automated unit tests in `tests/products.test.ts` to assert that all catalog items return an accessible `merchant.name`.

---

## Incident 3: Razorpay Test Mode Handler Incompleteness

### What Broke
During Razorpay Test Mode checkouts, the frontend payment verification callback failed intermittently with:
```
{"success":false,"message":"Payment signature verification failed"}
```
Upon inspecting the browser network payload sent to `/api/purchases/:id/verify-payment`, `razorpay_signature` was empty or `razorpay_order_id` was undefined when users closed or re-triggered test checkout modals.

### Investigation
- In Razorpay Test Mode, certain automated mock dismissals and payment handlers do not consistently return all three fields (`razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`).
- If the backend strictly depended only on client-provided signatures, legitimate test transactions would be marked as failed.

### How We Got Out
1. Implemented a robust dual-path verification architecture in `apps/api/src/routes/purchases.ts`:
   - **Primary Path**: If both `razorpaySignature` and `razorpayOrderId` are present, compute HMAC SHA256 using `RAZORPAY_KEY_SECRET` and compare timing-safely.
   - **Fallback Path**: If signature fields are omitted, make an authenticated server-side API call to Razorpay using the SDK:
     ```ts
     const payment = await razorpay.payments.fetch(razorpayPaymentId);
     ```
     The server verifies:
     - `payment.order_id === storedOrderId`
     - `payment.amount === purchase.totalPaise`
     - `payment.currency === purchase.currency`
     - `payment.status === "captured" || payment.status === "authorized"`
2. Tested both branches with automated test suites in `tests/purchases.test.ts` and `tests/webhooks.test.ts`.
3. Kept webhook reconciliation (`payment.captured`) as the final authority to guarantee eventual consistency regardless of browser state.
