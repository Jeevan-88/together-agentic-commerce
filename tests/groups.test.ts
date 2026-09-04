import test from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.TEST_API_URL || "http://localhost:4000";

test("Group Flow - create group, prevent duplicate members, protect owner", async () => {
  const uniqueSuffix = Date.now();
  const groupName = `Test Group ${uniqueSuffix}`;
  const ownerName = "Test Owner";
  const ownerEmail = `owner_${uniqueSuffix}@example.local`;

  // 1. Create a new group
  const createRes = await fetch(`${BASE_URL}/api/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: groupName,
      userName: ownerName,
      email: ownerEmail,
    }),
  });

  assert.equal(createRes.status, 201, "Should create group with 201 Created");
  const createBody = await createRes.json();
  assert.equal(createBody.success, true);
  assert.ok(createBody.group.id, "Created group must have an ID");

  const groupId = createBody.group.id;
  const ownerMember = createBody.group.members.find(
    (m: { role: string }) => m.role === "OWNER"
  );
  assert.ok(ownerMember, "Group creator must have OWNER role");
  const ownerUserId = ownerMember.userId;

  // 2. Fetch group by ID
  const getRes = await fetch(`${BASE_URL}/api/groups/${groupId}`);
  assert.equal(getRes.status, 200, "Should retrieve group by ID");
  const getBody = await getRes.json();
  assert.equal(getBody.group.name, groupName);

  // 3. Add a regular member
  const memberName = "Alice Member";
  const memberEmail = `alice_${uniqueSuffix}@example.local`;
  const addRes = await fetch(`${BASE_URL}/api/groups/${groupId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: memberName,
      email: memberEmail,
    }),
  });

  assert.equal(addRes.status, 201, "Should add member with 201 Created");
  const addBody = await addRes.json();
  assert.equal(addBody.success, true);
  assert.equal(addBody.member.role, "MEMBER");
  const addedUserId = addBody.member.userId;

  // 4. Duplicate member prevention (409 Conflict)
  const dupRes = await fetch(`${BASE_URL}/api/groups/${groupId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: memberName,
      email: memberEmail,
    }),
  });

  assert.equal(dupRes.status, 409, "Must return 409 Conflict for duplicate member");
  const dupBody = await dupRes.json();
  assert.equal(dupBody.success, false);
  assert.match(dupBody.message, /already a group member/i);

  // 5. Owner removal prevention (409 Conflict)
  const removeOwnerRes = await fetch(
    `${BASE_URL}/api/groups/${groupId}/members/${ownerUserId}`,
    { method: "DELETE" }
  );

  assert.equal(removeOwnerRes.status, 409, "Must prevent removing the group OWNER");
  const removeOwnerBody = await removeOwnerRes.json();
  assert.equal(removeOwnerBody.success, false);
  assert.match(removeOwnerBody.message, /owner cannot be removed/i);

  // 6. Regular member removal succeeds (200 OK)
  const removeMemberRes = await fetch(
    `${BASE_URL}/api/groups/${groupId}/members/${addedUserId}`,
    { method: "DELETE" }
  );

  assert.equal(removeMemberRes.status, 200, "Should remove regular member");
  const removeMemberBody = await removeMemberRes.json();
  assert.equal(removeMemberBody.success, true);

  // 7. Non-existent member removal returns 404
  const removeMissingRes = await fetch(
    `${BASE_URL}/api/groups/${groupId}/members/fake-user-id-999`,
    { method: "DELETE" }
  );
  assert.equal(removeMissingRes.status, 404, "Must return 404 for nonexistent member");
});

test("Group Flow - demo current groups retrieval", async () => {
  const res = await fetch(`${BASE_URL}/api/groups/demo/current`);
  // If demo user exists, returns 200, otherwise 404
  assert.ok(res.status === 200 || res.status === 404);
  const body = await res.json();
  if (res.status === 200) {
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.groups));
  }
});
