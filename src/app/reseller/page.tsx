"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ResellerLicense = {
  id: string;
  claimCode: string;
  batchId: string;
  purchaseReference: string | null;
  planName: string;
  status: string;
  active: boolean;
  claimedAt: string | null;
  activatedAt: string | null;
  lastRecoveryAt: string | null;
  recoveryCount: number;
  assignedCompany: {
    id: string;
    name: string;
    contactEmail: string;
  } | null;
  assignedUser: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  } | null;
  currentDevice: {
    id: string;
    deviceId: string;
    deviceName: string | null;
    active: boolean;
    lastSeenAt: string | null;
  } | null;
};

type ResellerInventoryResponse = {
  ok: boolean;
  resellerCompanyId: string;
  summary: {
    total: number;
    inventory: number;
    claimed: number;
    activated: number;
    disabled: number;
  };
  licenses: ResellerLicense[];
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function ResellerPage() {
  const [resellerCompanyId, setResellerCompanyId] = useState("cmnwlcuas000028dvym12vzra");
  const [data, setData] = useState<ResellerInventoryResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [assigningCode, setAssigningCode] = useState<string | null>(null);
  const [assignMessage, setAssignMessage] = useState("");
  const [assignError, setAssignError] = useState("");

  const [customerEmail, setCustomerEmail] = useState("restaurant-a@example.com");
  const [customerName, setCustomerName] = useState("Restaurant A Owner");
  const [customerCompanyName, setCustomerCompanyName] = useState("Restaurant A");

  async function loadInventory() {
    try {
      setLoading(true);
      setError("");
      setAssignMessage("");
      setAssignError("");

      const res = await fetch(
        `/api/reseller/inventory?resellerCompanyId=${encodeURIComponent(
          resellerCompanyId
        )}`
      );

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to load reseller inventory");
      }

      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }
useEffect(() => {
  loadInventory();
}, [resellerCompanyId]);

  async function assignLicense(claimCode: string) {
    try {
      setAssigningCode(claimCode);
      setAssignMessage("");
      setAssignError("");

      const res = await fetch("/api/reseller/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          claimCode,
          customerEmail,
          customerName,
          customerCompanyName,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to assign perpetual license");
      }

      setAssignMessage(`Assigned ${claimCode} to ${customerCompanyName}.`);
      await loadInventory();
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : "Assignment failed");
    } finally {
      setAssigningCode(null);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-3">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-semibold">Reseller Inventory Dashboard</h1>
      <p className="text-sm text-neutral-400">
        View reseller perpetual inventory and assign licenses to customers.
      </p>
    </div>

    <div className="flex gap-3">
      <Link
        href="/"
        className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-900"
      >
        Customer Dashboard
      </Link>
      <Link
        href="/reseller"
        className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-900"
      >
        Reseller Dashboard
      </Link>
    </div>
  </div>
</div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex-1 rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm text-neutral-400">
                Reseller Company ID: {resellerCompanyId}
            </div>
            <button
                onClick={loadInventory}
                className="rounded-xl border border-neutral-700 px-5 py-3 hover:bg-neutral-900"
            >
                {loading ? "Loading..." : "Refresh Inventory"}
            </button>
            </div>

          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="rounded-xl border border-neutral-700 bg-black px-4 py-3 outline-none"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="customer email"
            />
            <input
              className="rounded-xl border border-neutral-700 bg-black px-4 py-3 outline-none"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="customer name"
            />
            <input
              className="rounded-xl border border-neutral-700 bg-black px-4 py-3 outline-none"
              value={customerCompanyName}
              onChange={(e) => setCustomerCompanyName(e.target.value)}
              placeholder="customer company name"
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {assignMessage ? <p className="text-sm text-green-400">{assignMessage}</p> : null}
          {assignError ? <p className="text-sm text-red-400">{assignError}</p> : null}
        </div>

        {data ? (
          <>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
                <p className="text-sm text-neutral-400">Total</p>
                <p className="text-2xl font-semibold">{data.summary.total}</p>
              </div>
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
                <p className="text-sm text-neutral-400">Inventory</p>
                <p className="text-2xl font-semibold">{data.summary.inventory}</p>
              </div>
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
                <p className="text-sm text-neutral-400">Claimed</p>
                <p className="text-2xl font-semibold">{data.summary.claimed}</p>
              </div>
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
                <p className="text-sm text-neutral-400">Activated</p>
                <p className="text-2xl font-semibold">{data.summary.activated}</p>
              </div>
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
                <p className="text-sm text-neutral-400">Disabled</p>
                <p className="text-2xl font-semibold">{data.summary.disabled}</p>
              </div>
            </div>

            <section className="space-y-4">
              <h2 className="text-2xl font-medium">Licenses</h2>
              <div className="grid gap-4">
                {data.licenses.map((license) => (
                  <div
                    key={license.id}
                    className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 space-y-2"
                  >
                    <p>Claim Code: {license.claimCode}</p>
                    <p>Plan: {license.planName}</p>
                    <p>Status: {license.status}</p>
                    <p>Batch: {license.batchId}</p>
                    <p>Purchase Ref: {license.purchaseReference || "—"}</p>
                    <p>Claimed At: {formatDate(license.claimedAt)}</p>
                    <p>Activated At: {formatDate(license.activatedAt)}</p>

                    <div className="pt-2">
                      <p className="font-medium">Assigned Company</p>
                      {license.assignedCompany ? (
                        <div className="pl-4 space-y-1">
                          <p>Name: {license.assignedCompany.name}</p>
                          <p>Email: {license.assignedCompany.contactEmail}</p>
                        </div>
                      ) : (
                        <p className="pl-4 text-neutral-400">Not assigned</p>
                      )}
                    </div>

                    <div className="pt-2">
                      <p className="font-medium">Current Device</p>
                      {license.currentDevice ? (
                        <div className="pl-4 space-y-1">
                          <p>Device ID: {license.currentDevice.deviceId}</p>
                          <p>Name: {license.currentDevice.deviceName || "—"}</p>
                          <p>Last Seen: {formatDate(license.currentDevice.lastSeenAt)}</p>
                        </div>
                      ) : (
                        <p className="pl-4 text-neutral-400">No device bound</p>
                      )}
                    </div>

                    {license.status === "inventory" && (
                      <div className="pt-4">
                        <button
                          onClick={() => assignLicense(license.claimCode)}
                          disabled={assigningCode === license.claimCode}
                          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-800 disabled:opacity-50"
                        >
                          {assigningCode === license.claimCode ? "Assigning..." : "Assign to Customer"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}