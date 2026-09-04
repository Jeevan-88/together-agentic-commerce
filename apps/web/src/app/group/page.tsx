"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Member = {
  id: string;
  userId?: string;
  name?: string;
  email?: string;
  role: "OWNER" | "MEMBER";
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

type Group = {
  id: string;
  name: string;
  members: Member[];
};

export default function GroupPage() {
  const router = useRouter();

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const [groupName, setGroupName] = useState("");
  const [userName, setUserName] = useState("");

  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");

  async function loadGroups() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/api/groups/demo/current`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setGroups([]);
          return;
        }
        throw new Error(data.message || "Unable to load groups");
      }

      const loadedGroups: Group[] = data.groups || [];
      setGroups(loadedGroups);

      if (loadedGroups.length > 0 && !selectedGroupId) {
        setSelectedGroupId(loadedGroups[0].id);
      }
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error ? error.message : "Unable to load groups",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGroups();
    const stored = localStorage.getItem("together_user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u.name) setUserName(u.name);
      } catch (e) {}
    }
  }, []);

  async function createGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!groupName.trim() || !userName.trim()) {
      setIsError(true);
      setMessage("Please enter a group name and your name.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setIsError(false);

      const stored = localStorage.getItem("together_user");
      let email = "demo@together.local";
      if (stored) {
        try {
          const u = JSON.parse(stored);
          if (u.email) email = u.email;
        } catch (e) {}
      }

      const response = await fetch(`${API_URL}/api/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: groupName.trim(),
          userName: userName.trim(),
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create group");
      }

      const newGroup = data.group;
      setGroups((current) => [newGroup, ...current]);
      setSelectedGroupId(newGroup.id);
      setGroupName("");
      setUserName("");
      setIsError(false);
      setMessage(`Group "${newGroup.name}" created successfully.`);
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error ? error.message : "Unable to create group",
      );
    } finally {
      setSaving(false);
    }
  }

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedGroupId) {
      setIsError(true);
      setMessage("Select a group first.");
      return;
    }

    if (!memberName.trim() || !memberEmail.trim()) {
      setIsError(true);
      setMessage("Please enter the member name and email.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setIsError(false);

      const response = await fetch(
        `${API_URL}/api/groups/${selectedGroupId}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: memberName.trim(),
            email: memberEmail.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to add member");
      }

      setGroups((current) =>
        current.map((group) =>
          group.id === selectedGroupId
            ? {
                ...group,
                members: data.member
                  ? [...group.members, data.member]
                  : data.group?.members || group.members,
              }
            : group,
        ),
      );

      setMemberName("");
      setMemberEmail("");
      setIsError(false);
      setMessage("Member added successfully.");
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error ? error.message : "Unable to add member",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeMember(memberId: string) {
    if (!selectedGroupId) {
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setIsError(false);

      const response = await fetch(
        `${API_URL}/api/groups/${selectedGroupId}/members/${memberId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to remove member");
      }

      setGroups((current) =>
        current.map((group) =>
          group.id === selectedGroupId
            ? {
                ...group,
                members: group.members.filter((m) => m.id !== memberId && m.email !== memberId),
              }
            : group,
        ),
      );

      setIsError(false);
      setMessage("Member removed.");
      // Reload in background to ensure sync
      loadGroups();
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error ? error.message : "Unable to remove member",
      );
    } finally {
      setSaving(false);
    }
  }

  function continueShopping() {
    if (!selectedGroupId) {
      setIsError(true);
      setMessage("Select a group before continuing.");
      return;
    }

    router.push(
      `/shop?mode=group&groupId=${encodeURIComponent(selectedGroupId)}`,
    );
  }

  const selectedGroup = groups.find((group) => group.id === selectedGroupId);

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-6 sm:px-10">
        <Header currentStep="Groups" />

        <div className="py-10">
          <div className="mb-8">
            <Link
              href="/"
              className="oval-pill-btn mb-3 border-black/20 bg-white text-[10px] text-black/60 transition hover:border-black hover:text-black"
            >
              &larr; Back to Home
            </Link>

            <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Shopping groups
            </h1>

            <p className="mt-2 max-w-2xl text-base text-black/60">
              Create a group, add people you are shopping with, and keep everyone
              connected to the final purchase.
            </p>
          </div>

          {message && (
            <div
              className={`mb-6 rounded-2xl border p-4 text-sm font-medium ${
                isError
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-black/10 bg-white text-black"
              }`}
            >
              {message}
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            {/* Create Group Form */}
            <section className="surface-card rounded-3xl p-6 sm:p-7">
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-black/45">
                  New Group
                </span>
                <h2 className="mt-1 text-xl font-bold">Start a group</h2>
                <p className="mt-1 text-sm text-black/55">
                  Create a new shopping circle where you are the group owner.
                </p>
              </div>

              <form onSubmit={createGroup} className="space-y-4">
                <div>
                  <label
                    htmlFor="groupName"
                    className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-black/60"
                  >
                    Group name
                  </label>
                  <input
                    id="groupName"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Weekend trip, Office supplies, Roommates"
                    className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-black/30 focus:border-black/40"
                  />
                </div>

                <div>
                  <label
                    htmlFor="userName"
                    className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-black/60"
                  >
                    Your name
                  </label>
                  <input
                    id="userName"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-black/30 focus:border-black/40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="oval-pill-btn w-full border-black bg-black py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Creating group..." : "Create group"}
                </button>
              </form>
            </section>

            {/* Existing Groups List */}
            <section className="surface-card rounded-3xl p-6 sm:p-7">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.15em] text-black/45">
                    Selection
                  </span>
                  <h2 className="mt-1 text-xl font-semibold">Your groups</h2>
                </div>

                <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-black/70">
                  {groups.length} {groups.length === 1 ? "group" : "groups"}
                </span>
              </div>

              {loading ? (
                <div className="surface-inset rounded-2xl p-6 text-center text-sm text-black/50">
                  Loading groups...
                </div>
              ) : groups.length === 0 ? (
                <div className="surface-inset rounded-2xl p-8 text-center">
                  <p className="font-semibold">No groups yet</p>
                  <p className="mt-1 text-xs text-black/50">
                    Create your first shopping group on the left to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groups.map((group) => {
                    const isSelected = selectedGroupId === group.id;
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => setSelectedGroupId(group.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          isSelected
                            ? "border-black bg-black text-white shadow-sm"
                            : "border-black/10 bg-white hover:border-black/25"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{group.name}</p>
                            <p
                              className={`mt-1 text-xs ${
                                isSelected ? "text-white/70" : "text-black/50"
                              }`}
                            >
                              {group.members.length}{" "}
                              {group.members.length === 1
                                ? "member"
                                : "members"}
                            </p>
                          </div>

                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                              isSelected
                                ? "bg-white text-black"
                                : "border border-black/20 text-transparent"
                            }`}
                          >
                            ✓
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Selected Group Details & Members */}
          {selectedGroup && (
            <section className="surface-card mt-8 rounded-3xl p-6 sm:p-7">
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.15em] text-black/45">
                    Active Group
                  </span>
                  <h2 className="text-2xl font-semibold">{selectedGroup.name}</h2>
                </div>

                <button
                  type="button"
                  onClick={continueShopping}
                  className="oval-pill-btn border-black bg-black px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-black/80"
                >
                  Shop with this group &rarr;
                </button>
              </div>

              <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                {/* Members List */}
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-black/50">
                    Group Members ({selectedGroup.members.length})
                  </h3>

                  <div className="space-y-2.5">
                    {selectedGroup.members.map((member) => {
                      const displayName =
                        member.user?.name ||
                        member.name ||
                        member.user?.email ||
                        member.email ||
                        "Group Member";
                      const displayEmail =
                        member.user?.email || member.email || "";
                      const memberIdToRemove =
                        member.userId || member.user?.id || member.id;

                      return (
                        <div
                          key={member.id}
                          className="flex items-center justify-between rounded-xl border border-black/10 bg-white px-4 py-3 shadow-sm"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-950">
                              {displayName}
                            </p>
                            {displayEmail && (
                              <p className="text-xs font-medium text-black/50">
                                {displayEmail}
                              </p>
                            )}
                          </div>

                          {member.role === "OWNER" ? (
                            <span className="rounded-full bg-black px-2.5 py-0.5 text-[11px] font-bold text-white">
                              Owner
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => removeMember(memberIdToRemove)}
                              disabled={saving}
                              className="text-xs font-semibold text-red-600 transition hover:text-red-700 disabled:opacity-50"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Add Member Form */}
                <form
                  onSubmit={addMember}
                  className="surface-inset rounded-2xl p-5"
                >
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-black/50">
                    Add another person
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="memberName"
                        className="mb-1 block text-xs font-medium text-black/60"
                      >
                        Name
                      </label>
                      <input
                        id="memberName"
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                        placeholder="Friend or colleague"
                        className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-black/40"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="memberEmail"
                        className="mb-1 block text-xs font-medium text-black/60"
                      >
                        Email
                      </label>
                      <input
                        id="memberEmail"
                        type="email"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-black/40"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="oval-pill-btn w-full border-black/25 bg-white py-2.5 text-xs font-bold uppercase tracking-wider text-black transition hover:border-black hover:bg-black hover:text-white disabled:opacity-50"
                    >
                      {saving ? "Adding..." : "Add to group"}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
