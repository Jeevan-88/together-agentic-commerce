"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "../../../components/Header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Member = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MEMBER";
};

type Group = {
  id: string;
  name: string;
  members: Member[];
};

function ProposalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const productId = searchParams.get("productId") || "";
  const product = searchParams.get("product") || "";
  const merchant = searchParams.get("merchant") || "";
  const price = searchParams.get("price") || "";
  const request = searchParams.get("request") || "";
  const mode = searchParams.get("mode") || "solo";
  const incomingGroupId = searchParams.get("groupId") || "";

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState(incomingGroupId);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (mode !== "group") {
      return;
    }

    async function loadGroups() {
      try {
        setLoadingGroups(true);
        setError("");

        const response = await fetch(`${API_URL}/api/groups/demo/current`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load groups");
        }

        const loadedGroups: Group[] = data.groups || [];
        setGroups(loadedGroups);

        if (incomingGroupId && loadedGroups.some((g) => g.id === incomingGroupId)) {
          setSelectedGroupId(incomingGroupId);
        } else if (loadedGroups.length > 0) {
          setSelectedGroupId(loadedGroups[0].id);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load groups",
        );
      } finally {
        setLoadingGroups(false);
      }
    }

    loadGroups();
  }, [mode, incomingGroupId]);

  async function createAndApprovePurchase() {
    if (!productId || !request) {
      setError("Product or request information is missing.");
      return;
    }

    if (mode === "group" && !selectedGroupId) {
      setError("Please select a group before continuing.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const purchasePayload: {
        productId: string;
        requestText: string;
        mode: string;
        groupId?: string;
      } = {
        productId,
        requestText: request,
        mode,
      };

      if (mode === "group") {
        purchasePayload.groupId = selectedGroupId;
      }

      const purchaseResponse = await fetch(`${API_URL}/api/purchases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(purchasePayload),
      });

      const purchaseData = await purchaseResponse.json();

      if (!purchaseResponse.ok) {
        throw new Error(purchaseData.message || "Unable to create purchase");
      }

      const purchaseId = purchaseData.purchase?.id;

      if (!purchaseId) {
        throw new Error("Purchase ID was not returned.");
      }

      // Transition from DRAFT to PENDING_PAYMENT via approval
      const approveResponse = await fetch(
        `${API_URL}/api/purchases/${purchaseId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const approveData = await approveResponse.json();

      if (!approveResponse.ok) {
        throw new Error(approveData.message || "Unable to approve purchase");
      }

      router.push(`/shop/payment?purchaseId=${encodeURIComponent(purchaseId)}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to complete proposal",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-6 sm:px-10">
        <Header currentStep="Review & Approve" />

        <div className="py-10">
          <div className="mb-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-xs font-semibold uppercase tracking-wider text-black/50 transition hover:text-black"
            >
              Back to Options
            </button>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Purchase proposal
            </h1>

            <p className="mt-3 max-w-2xl text-base text-black/60">
              Review your product selection and group allocation before continuing
              to Razorpay test checkout.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {/* Product Summary Card */}
          <section className="surface-card rounded-3xl p-6 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                  {merchant || "Merchant"}
                </span>

                <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                  {product || "Selected Product"}
                </h2>

                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-black/50">
                  {mode === "group" ? "Group Purchase" : "Solo Purchase"}
                </p>
              </div>

              <div className="sm:text-right">
                <span className="text-xs text-black/40">Total Amount</span>
                <p className="mt-0.5 text-3xl font-semibold text-slate-950">
                  {price || "₹0"}
                </p>
              </div>
            </div>

            <div className="surface-inset mt-6 rounded-2xl p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-black/50">
                Original Request
              </span>
              <p className="mt-1.5 text-sm leading-6 text-black/75">
                {request || "No request text provided"}
              </p>
            </div>
          </section>

          {/* Group Details Card if Group Mode */}
          {mode === "group" && (
            <section className="surface-card mt-6 rounded-3xl p-6 sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-black/45">
                    Collaboration
                  </span>
                  <h2 className="mt-1 text-xl font-semibold">Shopping group</h2>
                </div>

                <Link
                  href="/group"
                  className="text-xs font-semibold text-black underline-offset-4 hover:underline"
                >
                  Manage groups
                </Link>
              </div>

              {loadingGroups ? (
                <div className="surface-inset rounded-2xl p-6 text-center text-sm text-black/50">
                  Loading groups...
                </div>
              ) : groups.length === 0 ? (
                <div className="surface-inset rounded-2xl p-6 text-center">
                  <p className="font-semibold">No active group found</p>
                  <p className="mt-1 text-xs text-black/50">
                    Create a group first to proceed with a group purchase.
                  </p>
                  <Link
                    href="/group"
                    className="mt-4 inline-block rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white"
                  >
                    Create a group
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {groups.map((group) => {
                    const isSelected = selectedGroupId === group.id;
                    return (
                      <label
                        key={group.id}
                        className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition ${
                          isSelected
                            ? "border-black bg-black text-white shadow-sm ring-1 ring-black"
                            : "border-black/10 bg-white hover:border-black/25"
                        }`}
                      >
                        <div>
                          <p className="font-semibold">{group.name}</p>
                          <p
                            className={`mt-1 text-xs ${
                              isSelected ? "text-white/70" : "text-black/50"
                            }`}
                          >
                            {group.members.length}{" "}
                            {group.members.length === 1 ? "member" : "members"}
                          </p>
                        </div>

                        <input
                          type="radio"
                          name="selectedGroup"
                          value={group.id}
                          checked={isSelected}
                          onChange={() => setSelectedGroupId(group.id)}
                          className="h-4 w-4 accent-black"
                        />
                      </label>
                    );
                  })}

                  {selectedGroup && (
                    <div className="surface-inset mt-4 rounded-2xl p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-black/50">
                        Members involved
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedGroup.members.map((member) => (
                          <span
                            key={member.id}
                            className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/75"
                          >
                            {member.name} {member.role === "OWNER" && "(Owner)"}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Review & Consent Block */}
          <div className="surface-card mt-6 rounded-3xl p-6 sm:p-7">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-black/20 accent-black focus:ring-black"
              />
              <span className="text-sm leading-6 text-black/75">
                <strong className="text-black">Confirm purchase details:</strong> I have
                reviewed the product, pricing, and {mode === "group" ? "group consensus" : "purchase terms"}.
                Proceeding will open Razorpay Test Mode checkout.
              </span>
            </label>

            <div className="mt-6 flex flex-col gap-4 border-t border-black/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-black/45">
                {confirmed
                  ? "Ready to initiate payment"
                  : "Please check the confirmation box above"}
              </p>

              <button
                type="button"
                onClick={createAndApprovePurchase}
                disabled={
                  submitting ||
                  !confirmed ||
                  (mode === "group" && (!selectedGroupId || groups.length === 0))
                }
                className="rounded-xl bg-black px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? "Preparing order..." : "Approve and continue &rarr;"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ProposalPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
          <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6">
            <p className="text-sm text-black/50">Loading proposal...</p>
          </div>
        </main>
      }
    >
      <ProposalContent />
    </Suspense>
  );
}
