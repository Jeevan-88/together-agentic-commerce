import test from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.TEST_API_URL || "http://localhost:4000";

test("Auth Flow - signup, duplicate check, signin, session persistence, and signout", async () => {
  const timestamp = Date.now();
  const testEmail = `auth_test_${timestamp}@together.local`;
  const testPassword = "securePassword123";
  const testName = "Auth Test User";

  // 1. Unauthenticated /api/auth/me should return 401
  const unauthRes = await fetch(`${BASE_URL}/api/auth/me`);
  assert.equal(unauthRes.status, 401, "Unauthenticated access should return 401");
  const unauthBody = await unauthRes.json();
  assert.equal(unauthBody.success, false);

  // 2. Signup with valid details
  const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: testName,
      email: testEmail,
      password: testPassword,
    }),
  });

  assert.equal(signupRes.status, 201, "Signup should return 201 Created");
  const signupBody = await signupRes.json();
  assert.equal(signupBody.success, true);
  assert.ok(signupBody.token, "Signup must return session token");
  assert.equal(signupBody.user.email, testEmail.toLowerCase());
  assert.equal(signupBody.user.name, testName);

  const initialToken = signupBody.token;

  // 3. Duplicate email signup should return 409 Conflict
  const duplicateRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Duplicate User",
      email: testEmail,
      password: "anotherPassword",
    }),
  });

  assert.equal(duplicateRes.status, 409, "Duplicate email signup must return 409 Conflict");
  const duplicateBody = await duplicateRes.json();
  assert.equal(duplicateBody.success, false);
  assert.match(duplicateBody.message, /already exists/i);

  // 4. GET /api/auth/me with Bearer token
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${initialToken}`,
    },
  });

  assert.equal(meRes.status, 200, "/api/auth/me should return 200 with valid session");
  const meBody = await meRes.json();
  assert.equal(meBody.success, true);
  assert.equal(meBody.user.email, testEmail.toLowerCase());
  assert.equal(meBody.user.name, testName);

  // 5. Signin with incorrect password should return 401
  const badSigninRes = await fetch(`${BASE_URL}/api/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: "wrongPassword",
    }),
  });

  assert.equal(badSigninRes.status, 401, "Invalid password should return 401");
  const badSigninBody = await badSigninRes.json();
  assert.equal(badSigninBody.success, false);

  // 6. Signin with correct credentials
  const signinRes = await fetch(`${BASE_URL}/api/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });

  assert.equal(signinRes.status, 200, "Valid signin should return 200 OK");
  const signinBody = await signinRes.json();
  assert.equal(signinBody.success, true);
  assert.ok(signinBody.token, "Signin must return a new session token");

  const newToken = signinBody.token;

  // 7. Signout with session token
  const signoutRes = await fetch(`${BASE_URL}/api/auth/signout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${newToken}`,
    },
  });

  assert.equal(signoutRes.status, 200, "Signout should return 200 OK");

  // 8. Session token should now be invalidated
  const invalidatedRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${newToken}`,
    },
  });

  assert.equal(invalidatedRes.status, 401, "Invalidated session should return 401");
});

test("Auth Flow - seeded demo user login", async () => {
  const signinRes = await fetch(`${BASE_URL}/api/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo@together.local",
      password: "password123",
    }),
  });

  assert.equal(signinRes.status, 200, "Seeded demo user must be able to sign in");
  const signinBody = await signinRes.json();
  assert.equal(signinBody.success, true);
  assert.ok(signinBody.token);
  assert.equal(signinBody.user.email, "demo@together.local");
});
