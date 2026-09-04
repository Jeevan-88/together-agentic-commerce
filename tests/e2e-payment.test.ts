import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import dotenv from "dotenv";

dotenv.config({ path: "apps/api/.env" });

const BASE_URL = process.env.TEST_API_URL || "http://localhost:4000";
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "test_webhook_secret";

function signWebhook(payload: object, eventId: string) {
  const bodyString = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(bodyString)
    .digest("hex");

  return {
    bodyString,
    headers: {
      "Content-Type": "application/json",
      "X-Razorpay-Signature": signature,
      "x-razorpay-event-id": eventId,
    },
  };
}

test("E2E Solo Flow - Intent -> Discovery -> Recommendation -> Approval -> Order -> Webhook -> Audit", async () => {
  // 1. Discovery
  const productsRes = await fetch(`${BASE_URL}/api/products`);
  assert.equal(productsRes.status, 200);
  const productsBody = await productsRes.json();
  const product = productsBody.products[0];

  // 2. Recommendations
  const recRes = await fetch(`${BASE_URL}/api/products/recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestText: "Solo traveler cabin backpack under 6000" }),
  });
  assert.equal(recRes.status, 200);

  // 3. Purchase Creation (SOLO)
  const purchaseRes = await fetch(`${BASE_URL}/api/purchases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: product.id,
      requestText: "Solo traveler cabin backpack under 6000",
      mode: "solo",
    }),
  });
  assert.equal(purchaseRes.status, 201);
  const purchaseBody = await purchaseRes.json();
  const purchaseId = purchaseBody.purchase.id;
  assert.equal(purchaseBody.purchase.status, "DRAFT");

  // 4. Approval
  const approveRes = await fetch(`${BASE_URL}/api/purchases/${purchaseId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  assert.equal(approveRes.status, 200);
  const approveBody = await approveRes.json();
  assert.equal(approveBody.purchase.status, "PENDING_PAYMENT");

  // 5. Payment Order Creation
  const orderRes = await fetch(`${BASE_URL}/api/purchases/${purchaseId}/payment-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  assert.equal(orderRes.status, 201);
  const orderBody = await orderRes.json();
  const orderId = orderBody.payment.orderId;
  assert.ok(orderId);

  // 6. Razorpay Webhook Confirmation
  const eventId = `evt_e2e_solo_${Date.now()}`;
  const webhookPayload = {
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: `pay_e2e_solo_${Date.now()}`,
          order_id: orderId,
          amount: product.pricePaise,
          currency: "INR",
          status: "captured",
        },
      },
    },
  };
  const { bodyString, headers } = signWebhook(webhookPayload, eventId);
  const whRes = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
    method: "POST",
    headers,
    body: bodyString,
  });
  assert.equal(whRes.status, 200);

  // 7. Audit Verification
  const auditRes = await fetch(`${BASE_URL}/api/audit/purchases/${purchaseId}`);
  assert.equal(auditRes.status, 200);
  const auditBody = await auditRes.json();
  assert.equal(auditBody.purchase.status, "PAID");
  assert.equal(auditBody.purchase.payment.status, "CAPTURED");

  const loggedActions = auditBody.audit.map((a: { action: string }) => a.action);
  assert.ok(loggedActions.includes("PURCHASE_CREATED"));
  assert.ok(loggedActions.includes("APPROVAL_GRANTED"));
  assert.ok(loggedActions.includes("PAYMENT_ORDER_CREATED"));
  assert.ok(loggedActions.includes("PAYMENT_CONFIRMED"));
});

test("E2E Group Flow - Group Creation -> Members -> Selection -> Approval -> Order -> Webhook -> Verified State", async () => {
  const ts = Date.now();

  // 1. Group Creation (uses internal demo user email as owner)
  const groupRes = await fetch(`${BASE_URL}/api/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `Himalayan Trekkers ${ts}`,
      userName: "Lead Trekker",
      email: "demo@together.local",
    }),
  });
  assert.equal(groupRes.status, 201);
  const groupBody = await groupRes.json();
  const groupId = groupBody.group.id;

  // 2. Add Group Member
  const addRes = await fetch(`${BASE_URL}/api/groups/${groupId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Co-Trekker Bob",
      email: `bob_${ts}@example.local`,
    }),
  });
  assert.equal(addRes.status, 201);

  // 3. Product Choice
  const productsRes = await fetch(`${BASE_URL}/api/products`);
  const productsBody = await productsRes.json();
  const product = productsBody.products[1] || productsBody.products[0];

  // 4. Group Purchase Creation
  const purchaseRes = await fetch(`${BASE_URL}/api/purchases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: product.id,
      requestText: "Group purchase for mountain expedition",
      mode: "group",
      groupId,
    }),
  });
  assert.equal(purchaseRes.status, 201);
  const purchaseBody = await purchaseRes.json();
  const purchaseId = purchaseBody.purchase.id;
  assert.equal(purchaseBody.purchase.mode, "GROUP");
  assert.equal(purchaseBody.purchase.groupId, groupId);

  // 5. Group Approval
  const approveRes = await fetch(`${BASE_URL}/api/purchases/${purchaseId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  assert.equal(approveRes.status, 200);

  // 6. Payment Order
  const orderRes = await fetch(`${BASE_URL}/api/purchases/${purchaseId}/payment-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  assert.equal(orderRes.status, 201);
  const orderBody = await orderRes.json();
  const orderId = orderBody.payment.orderId;

  // 7. Webhook Settlement
  const eventId = `evt_e2e_grp_${ts}`;
  const webhookPayload = {
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: `pay_e2e_grp_${ts}`,
          order_id: orderId,
          amount: product.pricePaise,
          currency: "INR",
          status: "captured",
        },
      },
    },
  };
  const { bodyString, headers } = signWebhook(webhookPayload, eventId);
  const whRes = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
    method: "POST",
    headers,
    body: bodyString,
  });
  assert.equal(whRes.status, 200);

  // 8. Verify Status and Group details in Audit
  const auditRes = await fetch(`${BASE_URL}/api/audit/purchases/${purchaseId}`);
  assert.equal(auditRes.status, 200);
  const auditBody = await auditRes.json();
  assert.equal(auditBody.purchase.status, "PAID");
  assert.ok(auditBody.purchase.group);
  assert.equal(auditBody.purchase.group.id, groupId);
  assert.ok(auditBody.purchase.group.members.length >= 2, "Group must show members in status audit");
});
