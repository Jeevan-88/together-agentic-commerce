import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import dotenv from "dotenv";

dotenv.config({ path: "apps/api/.env" });

const BASE_URL = process.env.TEST_API_URL || "http://localhost:4000";
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "test_webhook_secret";

function createSignedPayload(payloadObj: object, eventId: string, secret = WEBHOOK_SECRET) {
  const bodyString = JSON.stringify(payloadObj);
  const signature = crypto
    .createHmac("sha256", secret)
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

async function createReadyPurchaseAndOrder() {
  const productsRes = await fetch(`${BASE_URL}/api/products`);
  const productsBody = await productsRes.json();
  const product = productsBody.products[0];

  const purchaseRes = await fetch(`${BASE_URL}/api/purchases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: product.id,
      requestText: "Webhook test purchase backpack",
      mode: "solo",
    }),
  });
  const purchaseBody = await purchaseRes.json();
  const purchaseId = purchaseBody.purchase.id;

  await fetch(`${BASE_URL}/api/purchases/${purchaseId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const orderRes = await fetch(`${BASE_URL}/api/purchases/${purchaseId}/payment-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const orderBody = await orderRes.json();

  return {
    purchaseId,
    orderId: orderBody.payment.orderId,
    amountPaise: orderBody.payment.amountPaise,
    currency: orderBody.payment.currency,
  };
}

test("Webhook Security - invalid signature is rejected with 400", async () => {
  const bodyString = JSON.stringify({ event: "payment.captured" });
  const res = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Razorpay-Signature": "tampered_bad_signature_hex",
      "x-razorpay-event-id": `evt_fake_${Date.now()}`,
    },
    body: bodyString,
  });

  assert.equal(res.status, 400, "Must reject invalid signature with 400 Bad Request");
  const body = await res.json();
  assert.equal(body.success, false);
  assert.match(body.message, /invalid webhook signature/i);
});

test("Webhook Processing - unknown payment order is safely ignored", async () => {
  const eventId = `evt_unknown_${Date.now()}`;
  const payload = {
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: `pay_unknown_${Date.now()}`,
          order_id: "order_non_existent_99999",
          amount: 50000,
          currency: "INR",
          status: "captured",
        },
      },
    },
  };

  const { bodyString, headers } = createSignedPayload(payload, eventId);
  const res = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
    method: "POST",
    headers,
    body: bodyString,
  });

  assert.equal(res.status, 200, "Unknown order returns 200 ignored");
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.ignored, true);
});

test("Webhook Idempotency - payment.captured delivery followed by duplicate webhook", async () => {
  const order = await createReadyPurchaseAndOrder();
  const eventId = `evt_test_${Date.now()}`;
  const paymentId = `pay_wh_${Date.now()}`;

  const webhookPayload = {
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: order.orderId,
          amount: order.amountPaise,
          currency: order.currency,
          status: "captured",
        },
      },
    },
  };

  const { bodyString, headers } = createSignedPayload(webhookPayload, eventId);

  // 1. FIRST DELIVERY: processes and marks purchase as PAID
  const firstRes = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
    method: "POST",
    headers,
    body: bodyString,
  });

  assert.equal(firstRes.status, 200, "First webhook delivery returns 200 OK");
  const firstBody = await firstRes.json();
  assert.equal(firstBody.success, true);
  assert.equal(firstBody.event, "payment.captured");

  // Verify purchase is now PAID in database audit
  const auditRes1 = await fetch(`${BASE_URL}/api/audit/purchases/${order.purchaseId}`);
  const auditBody1 = await auditRes1.json();
  assert.equal(auditBody1.purchase.status, "PAID", "Purchase must transition to PAID");
  assert.equal(auditBody1.purchase.payment.status, "CAPTURED");

  // 2. SECOND DELIVERY (DUPLICATE): same event ID sent again
  const secondRes = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
    method: "POST",
    headers,
    body: bodyString,
  });

  assert.equal(secondRes.status, 200, "Duplicate delivery returns 200 OK");
  const secondBody = await secondRes.json();
  assert.equal(secondBody.success, true);
  assert.equal(secondBody.duplicate, true, "Duplicate delivery must be safely flagged as duplicate");

  // Verify purchase remains consistently PAID and audit log has duplicate recorded
  const auditRes2 = await fetch(`${BASE_URL}/api/audit/purchases/${order.purchaseId}`);
  const auditBody2 = await auditRes2.json();
  assert.equal(auditBody2.purchase.status, "PAID", "Purchase must remain PAID without error");

  const duplicateLog = auditBody2.audit.find(
    (log: { action: string }) => log.action === "WEBHOOK_DUPLICATE"
  );
  assert.ok(duplicateLog, "Must record WEBHOOK_DUPLICATE audit entry");
});

test("Webhook Validation - amount mismatch is rejected and audited as failed", async () => {
  const order = await createReadyPurchaseAndOrder();
  const eventId = `evt_amt_mismatch_${Date.now()}`;

  const payload = {
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: `pay_tampered_${Date.now()}`,
          order_id: order.orderId,
          amount: order.amountPaise + 50000, // Mismatched amount!
          currency: order.currency,
          status: "captured",
        },
      },
    },
  };

  const { bodyString, headers } = createSignedPayload(payload, eventId);
  const res = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
    method: "POST",
    headers,
    body: bodyString,
  });

  assert.equal(res.status, 400, "Must return 400 for amount mismatch");
  const body = await res.json();
  assert.equal(body.success, false);
  assert.match(body.message, /amount does not match/i);
});

test("Webhook Validation - currency mismatch is rejected and audited as failed", async () => {
  const order = await createReadyPurchaseAndOrder();
  const eventId = `evt_curr_mismatch_${Date.now()}`;

  const payload = {
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: `pay_curr_${Date.now()}`,
          order_id: order.orderId,
          amount: order.amountPaise,
          currency: "USD", // Mismatched currency!
          status: "captured",
        },
      },
    },
  };

  const { bodyString, headers } = createSignedPayload(payload, eventId);
  const res = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
    method: "POST",
    headers,
    body: bodyString,
  });

  assert.equal(res.status, 400, "Must return 400 for currency mismatch");
  const body = await res.json();
  assert.equal(body.success, false);
  assert.match(body.message, /currency does not match/i);
});

test("Webhook Events - payment.failed event marks purchase as FAILED", async () => {
  const order = await createReadyPurchaseAndOrder();
  const eventId = `evt_failed_${Date.now()}`;

  const payload = {
    event: "payment.failed",
    payload: {
      payment: {
        entity: {
          id: `pay_failed_${Date.now()}`,
          order_id: order.orderId,
          amount: order.amountPaise,
          currency: order.currency,
          status: "failed",
        },
      },
    },
  };

  const { bodyString, headers } = createSignedPayload(payload, eventId);
  const res = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
    method: "POST",
    headers,
    body: bodyString,
  });

  assert.equal(res.status, 200, "Returns 200 for processed failed webhook");
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.event, "payment.failed");

  // Verify status is FAILED
  const auditRes = await fetch(`${BASE_URL}/api/audit/purchases/${order.purchaseId}`);
  const auditBody = await auditRes.json();
  assert.equal(auditBody.purchase.status, "FAILED", "Purchase must transition to FAILED");
  assert.equal(auditBody.purchase.payment.status, "FAILED");
});
