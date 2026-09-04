import test from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.TEST_API_URL || "http://localhost:4000";

test("Product Catalog - listing all active products", async () => {
  const res = await fetch(`${BASE_URL}/api/products`);
  assert.equal(res.status, 200, "Should return HTTP 200");

  const body = await res.json();
  assert.equal(body.success, true, "Response success must be true");
  assert.ok(Array.isArray(body.products), "Products should be an array");
  assert.ok(body.products.length >= 3, "Catalog should have at least 3 seed products");

  const sample = body.products[0];
  assert.ok(sample.id, "Product must have an id");
  assert.ok(sample.name, "Product must have a name");
  assert.ok(sample.pricePaise > 0, "Product must have a positive price in paise");
  assert.ok(sample.merchant, "Product must include merchant details");
  assert.ok(sample.merchant.name, "Merchant must have a name");
});

test("Product Lookup - retrieve product by valid ID", async () => {
  const listRes = await fetch(`${BASE_URL}/api/products`);
  const listBody = await listRes.json();
  const validId = listBody.products[0].id;

  const res = await fetch(`${BASE_URL}/api/products/${validId}`);
  assert.equal(res.status, 200, "Should return HTTP 200");

  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.product.id, validId);
  assert.ok(body.product.merchant);
});

test("Product Lookup - reject invalid or nonexistent product ID", async () => {
  const res = await fetch(`${BASE_URL}/api/products/non-existent-product-id-9999`);
  assert.equal(res.status, 404, "Should return HTTP 404 for unknown product");

  const body = await res.json();
  assert.equal(body.success, false);
  assert.match(body.message, /not found/i);
});

test("Product Recommendations - score and rank based on request text", async () => {
  const res = await fetch(`${BASE_URL}/api/products/recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestText: "I need a 25L lightweight backpack under 5000",
    }),
  });

  assert.equal(res.status, 200, "Should return HTTP 200");
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(body.recommendation, "Should provide a top recommendation");
  assert.ok(body.recommendation.score >= 0, "Recommendation score should be valid");
  assert.ok(Array.isArray(body.recommendation.reasons), "Should provide reasoning list");
});

test("Product Recommendations - reject invalid short request text", async () => {
  const res = await fetch(`${BASE_URL}/api/products/recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestText: "hi",
    }),
  });

  assert.equal(res.status, 400, "Should return HTTP 400 for request < 3 characters");
  const body = await res.json();
  assert.equal(body.success, false);
});
