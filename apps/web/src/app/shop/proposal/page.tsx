"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "../../../components/Header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Member = {
  id: string;
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
  const imageUrl = searchParams.get("imageUrl") || "";
  const originalPricePaise = searchParams.get("originalPricePaise") || "";
  const discountPercent = searchParams.get("discountPercent") || "";
  const category = searchParams.get("category") || "";
  const rating = searchParams.get("rating") || "";

  const [productData, setProductData] = useState<{
    imageUrl?: string;
    originalPricePaise?: number;
    discountPercent?: number;
    category?: string;
    rating?: number;
  } | null>(null);

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState(incomingGroupId);
  const [currentUser, setCurrentUser] = useState<{ id?: string; name: string; email: string } | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  function getAuthHeaders(): Record<string, string> {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("together_token")
        : null;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  useEffect(() => {
    function checkUser() {
      const token = localStorage.getItem("together_token");
      const stored = localStorage.getItem("together_user");
      if (token && stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    }

    checkUser();
    window.addEventListener("together_auth_changed", checkUser);
    return () => {
      window.removeEventListener("together_auth_changed", checkUser);
    };
  }, []);

  useEffect(() => {
    if (productId && !imageUrl) {
      fetch(`${API_URL}/api/products/${productId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.product) {
            setProductData({
              imageUrl:
                data.product.imageUrl || data.product.metadata?.imageUrl,
              originalPricePaise:
                data.product.originalPricePaise ||
                data.product.metadata?.originalPricePaise,
              discountPercent: data.product.metadata?.discountPercent,
              category: data.product.category || data.product.metadata?.category,
              rating: data.product.rating || data.product.metadata?.rating,
            });
          }
        })
        .catch(() => {});
    }
  }, [productId, imageUrl]);

  useEffect(() => {
    if (mode !== "group") {
      return;
    }

    async function loadGroups() {
      try {
        setLoadingGroups(true);
        setError("");

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("together_token")
            : null;

        if (!token) {
          setGroups([]);
          setLoadingGroups(false);
          return;
        }

        const headers = getAuthHeaders();
        const response = await fetch(`${API_URL}/api/groups`, { headers });
        const data = await response.json();

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
  }, [mode, incomingGroupId, currentUser]);

  async function createAndApprovePurchase() {
    if (!currentUser) {
      setError("Please sign in or create an account to authorize this purchase.");
      window.dispatchEvent(new CustomEvent("open_together_auth"));
      return;
    }

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

      const headers = getAuthHeaders();

      const purchaseResponse = await fetch(`${API_URL}/api/purchases`, {
        method: "POST",
        headers,
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
          headers,
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

  const displayImageUrl = imageUrl || productData?.imageUrl;
  const displayOriginalPrice = originalPricePaise
    ? `₹${(Number(originalPricePaise) / 100).toLocaleString("en-IN")}`
    : productData?.originalPricePaise
      ? `₹${(productData.originalPricePaise / 100).toLocaleString("en-IN")}`
      : null;
  const displayDiscount = discountPercent
    ? `${discountPercent}% OFF`
    : productData?.discountPercent
      ? `${productData.discountPercent}% OFF`
      : null;
  const displayCategory = category || productData?.category;
  const displayRating = rating || productData?.rating;

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-6 sm:px-10">
        <Header currentStep="Review & Approve" />

        <div className="py-10">
          <div className="mb-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="oval-pill-btn mb-3 border-black/20 bg-white text-[10px] text-black/60 transition hover:border-black hover:text-black"
            >
              &larr; Back to Options
            </button>

            <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Purchase proposal
            </h1>

            <p className="mt-2 max-w-2xl text-base text-black/60">
              Review your product selection, real-time discount, and group allocation before continuing
              to Razorpay test checkout.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {/* Product Summary Card with Rich Visuals */}
          <section className="surface-card overflow-hidden rounded-3xl p-6 sm:p-7">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              {/* Product Thumbnail */}
              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-inner sm:h-36 sm:w-36">
                {displayImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={displayImageUrl}
                    alt={product || "Selected product"}
                    className="h-full w-full object-cover object-center"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-black/5 text-2xl font-bold text-black/20">
                    TG
                  </div>
                )}
                {displayDiscount && (
                  <div className="absolute bottom-1.5 left-1.5 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-black uppercase text-white shadow">
                    {displayDiscount}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-black/45">
                    {merchant || "Merchant"}
                  </span>
                  {displayCategory && (
                    <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[10px] font-semibold text-black/65">
                      {displayCategory}
                    </span>
                  )}
                  {displayRating && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200">
                      ★ {displayRating}
                    </span>
                  )}
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold uppercase text-black/60">
                    {mode === "group" ? "Group Purchase" : "Solo Purchase"}
                  </span>
                </div>

                <h2 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
                  {product || "Selected Product"}
                </h2>

                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-slate-950">
                    {price || "₹0"}
                  </span>
                  {displayOriginalPrice && (
                    <span className="text-base text-black/40 line-through">
                      {displayOriginalPrice}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-emerald-700">
                    Test Checkout Ready
                  </span>
                </div>
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
                        {selectedGroup.members.map((member) => {
                          const displayName =
                            member.user?.name ||
                            member.name ||
                            member.user?.email ||
                            member.email ||
                            "Member";
                          return (
                            <span
                              key={member.id}
                              className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/75"
                            >
                              {displayName} {member.role === "OWNER" && "(Owner)"}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Review & Consent Block */}
          <div className="surface-card mt-6 rounded-3xl p-6 sm:p-7">
            {!currentUser && (
              <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-700">
                      Sign In Required
                    </span>
                    <p className="text-xs font-bold text-slate-950 mt-0.5">
                      Authentication required to create and authorize this purchase.
                    </p>
                    <p className="text-[11px] text-black/60 mt-0.5">
                      Your identity is cryptographically linked to the order and payment audit trail.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent("open_together_auth"))}
                    className="oval-pill-btn shrink-0 border-black bg-black px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-black/80 transition"
                  >
                    Sign In / Register &rarr;
                  </button>
                </div>
              </div>
            )}

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
                className="oval-pill-btn border-black bg-black px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-40"
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
