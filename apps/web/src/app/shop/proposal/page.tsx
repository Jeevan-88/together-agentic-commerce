"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Group = {
  id: string;
  name: string;
  members?: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
};

function ProposalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const product = searchParams.get("product") || "Selected product";
  const merchant = searchParams.get("merchant") || "Merchant";
  const price = searchParams.get("price") || "₹0";
  const request = searchParams.get("request") || "Your purchase request";
  const mode = searchParams.get("mode") || "solo";
  const productId = searchParams.get("productId") || "";

  const [approved, setApproved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  useEffect(() => {
    if (mode !== "group") {
      return;
    }

    async function loadGroups() {
      setIsLoadingGroups(true);
      setError("");

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/groups/demo/current`,
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load groups");
        }

        const availableGroups = Array.isArray(data.groups)
          ? data.groups
          : [];

        setGroups(availableGroups);

        if (availableGroups.length > 0) {
          setSelectedGroupId(availableGroups[0].id);
        }
      } catch (err) {
        console.error("Failed to load groups:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load your groups.",
        );
      } finally {
        setIsLoadingGroups(false);
      }
    }

    loadGroups();
  }, [mode]);

  async function handleContinue() {
    if (!approved || isSubmitting) {
      return;
    }

    if (!productId) {
      setError("Product information is missing. Please start again.");
      return;
    }

    if (mode === "group" && !selectedGroupId) {
      setError("Please select a group before continuing.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const createResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/purchases`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId,
            requestText: request,
            mode,
            ...(mode === "group"
              ? {
                  groupId: selectedGroupId,
                }
              : {}),
          }),
        },
      );

      const createData = await createResponse.json();

      if (!createResponse.ok || !createData.success) {
        throw new Error(
          createData.message || "Failed to create purchase",
        );
      }

      const purchaseId = createData.purchase?.id;

      if (!purchaseId) {
        throw new Error("Purchase ID was not returned by the server");
      }

      const approveResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/purchases/${purchaseId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const approveData = await approveResponse.json();

      if (!approveResponse.ok || !approveData.success) {
        throw new Error(
          approveData.message || "Failed to approve purchase",
        );
      }

      const params = new URLSearchParams({
        product,
        merchant,
        price,
        request,
        mode,
        productId,
        purchaseId,
      });

      if (mode === "group") {
        params.set("groupId", selectedGroupId);
      }

      router.push(`/shop/payment?${params.toString()}`);
    } catch (err) {
      console.error("Purchase flow failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );

      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      <div className="mx-auto min-h-screen max-w-5xl px-6 py-8 sm:px-10">
        <header className="flex items-center justify-between border-b border-black/10 pb-5">
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="Go to TOGETHER home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-sm font-semibold text-white">
              T
            </div>

            <span className="text-lg font-semibold tracking-tight">
              TOGETHER
            </span>
          </Link>

          <Link
            href="/shop/results"
            className="text-sm text-black/50 transition hover:text-black"
          >
            Back to options
          </Link>
        </header>

        <section className="mx-auto max-w-3xl py-14">
          <div className="mb-10">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-black/45">
              Review
            </p>

            <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              Here is the purchase we are proposing.
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-black/60 sm:text-lg">
              Check the details carefully before approving the purchase.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
            <div className="border-b border-black/10 p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-black/40">
                    {merchant}
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    {product}
                  </h2>

                  <p className="mt-2 text-sm text-black/50">
                    {mode === "group"
                      ? "Group purchase"
                      : "Solo purchase"}
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="text-xs text-black/40">Total</p>

                  <p className="mt-1 text-3xl font-semibold tracking-tight">
                    {price}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-b border-black/10 p-6 sm:p-8">
              <p className="text-xs font-medium uppercase tracking-wide text-black/40">
                Your request
              </p>

              <div className="mt-4 rounded-2xl bg-[#f5f5f3] p-5">
                <p className="text-sm leading-7 text-black/65">
                  {request}
                </p>
              </div>
            </div>

            <div className="border-b border-black/10 p-6 sm:p-8">
              <p className="text-xs font-medium uppercase tracking-wide text-black/40">
                Purchase details
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between border-b border-black/5 pb-4">
                  <span className="text-sm text-black/50">
                    Product
                  </span>

                  <span className="text-sm font-medium">
                    {product}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-black/5 pb-4">
                  <span className="text-sm text-black/50">
                    Merchant
                  </span>

                  <span className="text-sm font-medium">
                    {merchant}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-black/5 pb-4">
                  <span className="text-sm text-black/50">
                    Purchase type
                  </span>

                  <span className="text-sm font-medium">
                    {mode === "group" ? "Group" : "Solo"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-black/50">
                    Total
                  </span>

                  <span className="text-lg font-semibold">
                    {price}
                  </span>
                </div>
              </div>
            </div>

            {mode === "group" && (
              <div className="border-b border-black/10 bg-[#fafaf8] p-6 sm:p-8">
                <p className="text-xs font-medium uppercase tracking-wide text-black/40">
                  Group
                </p>

                <h3 className="mt-2 text-lg font-semibold">
                  Choose who this purchase belongs to
                </h3>

                <p className="mt-2 text-sm leading-6 text-black/50">
                  The purchase will be linked to the selected group.
                </p>

                {isLoadingGroups ? (
                  <div className="mt-5 rounded-2xl border border-black/10 bg-white p-5">
                    <p className="text-sm text-black/50">
                      Loading your groups...
                    </p>
                  </div>
                ) : groups.length > 0 ? (
                  <div className="mt-5 space-y-3">
                    {groups.map((group) => (
                      <label
                        key={group.id}
                        className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-5 transition ${
                          selectedGroupId === group.id
                            ? "border-black bg-white"
                            : "border-black/10 bg-white hover:border-black/25"
                        }`}
                      >
                        <input
                          type="radio"
                          name="group"
                          value={group.id}
                          checked={selectedGroupId === group.id}
                          disabled={isSubmitting}
                          onChange={(event) =>
                            setSelectedGroupId(event.target.value)
                          }
                          className="h-5 w-5 accent-black"
                        />

                        <span className="min-w-0">
                          <span className="block text-sm font-medium">
                            {group.name}
                          </span>

                          <span className="mt-1 block text-xs text-black/45">
                            {group.members?.length ?? 0} member
                            {(group.members?.length ?? 0) === 1
                              ? ""
                              : "s"}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <p className="text-sm font-medium text-amber-900">
                      No group is available yet.
                    </p>

                    <p className="mt-1 text-sm leading-6 text-amber-800">
                      Create a group before starting a group purchase.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="bg-[#fafaf8] p-6 sm:p-8">
              <label className="flex cursor-pointer gap-4">
                <input
                  type="checkbox"
                  checked={approved}
                  disabled={
                    isSubmitting ||
                    (mode === "group" &&
                      (!selectedGroupId || isLoadingGroups))
                  }
                  onChange={(event) =>
                    setApproved(event.target.checked)
                  }
                  className="mt-1 h-5 w-5 shrink-0 accent-black"
                />

                <span>
                  <span className="block text-sm font-medium">
                    I approve this purchase
                  </span>

                  <span className="mt-1 block text-sm leading-6 text-black/50">
                    I have reviewed the product, merchant, purchase
                    type and total amount. I want to continue to
                    payment.
                  </span>
                </span>
              </label>

              {error && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="button"
                disabled={
                  !approved ||
                  isSubmitting ||
                  (mode === "group" && !selectedGroupId)
                }
                onClick={handleContinue}
                className="mt-6 w-full rounded-xl bg-black py-4 text-sm font-medium text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:bg-black/20"
              >
                {isSubmitting
                  ? "Preparing purchase..."
                  : "Continue to payment"}
              </button>

              {!approved && !isSubmitting && (
                <p className="mt-4 text-center text-xs text-black/40">
                  Approval is required before continuing.
                </p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/shop"
              className="block text-center text-sm font-medium text-black/45 transition hover:text-black"
            >
              Start a new purchase
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ProposalPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
          <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">
            <p className="text-sm text-black/50">
              Loading proposal...
            </p>
          </div>
        </main>
      }
    >
      <ProposalContent />
    </Suspense>
  );
}