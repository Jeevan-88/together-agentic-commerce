import test from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.TEST_API_URL || "http://localhost:4000";

async function getFirstProduct() {
  const res = await fetch(`${BASE_URL}/api/products`);
  const body = await res.json();
  return body.products[0];
}

test("Purchases - validation of request payload", async () => {
  const product = await getFirstProduct();

  // 1. Invalid short request text
  const shortRes = await fetch(`${BASE_URL}/api/purchases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: product.id,
      requestText: "no",
      mode: "solo",
    }),
  });
  assert.equal(shortRes.status, 400, "Should reject request text < 3 chars");

  // 2. Invalid purchase mode
  const modeRes = await fetch(`${BASE_URL}/api/purchases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: product.id,
      requestText: "Valid travel request",
      mode: "unsupported_mode",
    }),
  });
  assert.equal(modeRes.status, 400, "Should reject invalid purchase mode");

  // 3. Group purchase without groupId
  const noGroupRes = await fetch(`${BASE_URL}/api/purchases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: product.id,
      requestText: "Need group backpack",
      mode: "group",
    }),
  });
  assert.equal(noGroupRes.status, 400, "Group purchase requires groupId");
  const noGroupBody = await noGroupRes.json();
  assert.match(noGroupBody.message, /groupId is required/i);

  // 4. Group purchase with non-member groupId
  const nonMemberRes = await fetch(`${BASE_URL}/api/purchases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: product.id,
      requestText: "Need group backpack",
      mode: "group",
      groupId: "00000000-0000-0000-0000-000000000000",
    }),
  });
  assert.equal(nonMemberRes.status, 403, "Should return 403 when not a member of group");
});

test("Purchases - solo purchase lifecycle from creation to approval and payment order", async () => {
  const product = await getFirstProduct();

  // 1. Create a valid solo purchase
  const createRes = await fetch(`${BASE_URL}/api/purchases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: product.id,
      requestText: "I need a durable backpack for my trip",
      mode: "solo",
    }),
  });

  assert.equal(createRes.status, 201, "Should create purchase with 201");
  const createBody = await createRes.json();
  assert.equal(createBody.success, true);
  assert.equal(createBody.purchase.status, "DRAFT");
  assert.equal(createBody.purchase.mode, "SOLO");
  assert.equal(createBody.purchase.totalPaise, product.pricePaise);

  const purchaseId = createBody.purchase.id;
  assert.ok(purchaseId, "Must return purchaseId");

  // 2. Approve the purchase
  const approveRes = await fetch(`${BASE_URL}/api/purchases/${purchaseId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  assert.equal(approveRes.status, 200, "Should approve draft purchase");
  const approveBody = await approveRes.json();
  assert.equal(approveBody.success, true);
  assert.equal(approveBody.purchase.status, "PENDING_PAYMENT");
  assert.equal(approveBody.purchase.approval.status, "APPROVED");

  // 3. Prevent second approval on already approved purchase (409 Conflict)
  const doubleApproveRes = await fetch(`${BASE_URL}/api/purchases/${purchaseId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  assert.equal(doubleApproveRes.status, 409, "Must return 409 when approving non-draft");

  // 4. Create payment order (Razorpay test order)
  const orderRes = await fetch(`${BASE_URL}/api/purchases/${purchaseId}/payment-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  assert.equal(orderRes.status, 201, "Should create payment order with 201");
  const orderBody = await orderRes.json();
  assert.equal(orderBody.success, true);
  assert.ok(orderBody.payment.orderId, "Must return Razorpay orderId");
  assert.equal(orderBody.payment.amountPaise, product.pricePaise);
  assert.equal(orderBody.payment.currency, "INR");

  const orderId = orderBody.payment.orderId;

  // 5. Duplicate payment order request returns the existing order
  const dupOrderRes = await fetch(`${BASE_URL}/api/purchases/${purchaseId}/payment-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  assert.equal(dupOrderRes.status, 200, "Should return existing payment order with 200");
  const dupOrderBody = await dupOrderRes.json();
  assert.equal(dupOrderBody.payment.orderId, orderId);

  // 6. Payment verification with bad signature returns 400
  const badVerifyRes = await fetch(`${BASE_URL}/api/purchases/${purchaseId}/verify-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpayPaymentId: "pay_test_dummy_123",
      razorpayOrderId: orderId,
      razorpaySignature: "invalid_tampered_signature_hex_code",
    }),
  });
  assert.equal(badVerifyRes.status, 400, "Should reject invalid payment signature");
});
