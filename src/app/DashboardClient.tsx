"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type CurrentAppUser = {
  authUserId: string;
  email: string;
  dbUserId: string;
  name: string | null;
  role: string | null;
  companyId: string | null;
  companyType: string | null;
};

type SubscriptionLicense = {
  id: string;
  licenseMode: "subscription";
  planName: string;
  active: boolean;
  seatCount: number;
  expiresAt: string | null;
  subscriptionStatus: string | null;
  billingInterval: string | null;
  currentPeriodEnd: string | null;
};

type PerpetualLicense = {
  id: string;
  licenseMode: "perpetual";
  claimCode: string;
  planName: string;
  status: string;
  active: boolean;
  claimedAt: string | null;
  activatedAt: string | null;
  lastRecoveryAt: string | null;
  recoveryCount: number;
  currentDevice: {
    id: string;
    deviceId: string;
    deviceName: string | null;
    active: boolean;
    lastSeenAt: string | null;
  } | null;
};

type Device = {
  id: string;
  deviceId: string;
  deviceName: string | null;
  active: boolean;
  lastSeenAt: string | null;
  createdAt: string;
};

type DashboardResponse = {
  ok: boolean;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
  company: {
    id: string;
    name: string;
    contactEmail: string;
  };
  subscriptionLicenses: SubscriptionLicense[];
  perpetualLicenses: PerpetualLicense[];
  devices: Device[];
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function getPerpetualStatusLabel(license: PerpetualLicense) {
  if (!license.active) return "Inactive";
  if (license.activatedAt && license.currentDevice) return "Active on device";
  if (license.claimedAt && !license.activatedAt) return "Ready to activate";
  return "Unassigned";
}

function getPerpetualStatusClass(license: PerpetualLicense) {
  if (!license.active) return "bg-red-950 text-red-300 border-red-800";
  if (license.activatedAt && license.currentDevice) {
    return "bg-green-950 text-green-300 border-green-800";
  }
  if (license.claimedAt && !license.activatedAt) {
    return "bg-yellow-950 text-yellow-300 border-yellow-800";
  }
  return "bg-neutral-900 text-neutral-300 border-neutral-700";
}

export default function DashboardClient({
  appUser,
}: {
  appUser: CurrentAppUser;
}) {
  const email = appUser.email;
  const supabase = createClient();

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [actionLoadingByCode, setActionLoadingByCode] = useState<Record<string, boolean>>({});
  const [actionMessageByCode, setActionMessageByCode] = useState<Record<string, string>>({});
  const [actionErrorByCode, setActionErrorByCode] = useState<Record<string, string>>({});

  function clearLicenseActionState(claimCode: string) {
    setActionMessageByCode((prev) => ({ ...prev, [claimCode]: "" }));
    setActionErrorByCode((prev) => ({ ...prev, [claimCode]: "" }));
  }

  async function getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = await getAccessToken();

      if (!token) {
        throw new Error("No active session token");
      }

      const res = await fetch(`${baseUrl}/dashboard/licenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to load dashboard");
      }

      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function activateLicense(claimCode: string) {
    try {
      clearLicenseActionState(claimCode);
      setActionLoadingByCode((prev) => ({ ...prev, [claimCode]: true }));

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = await getAccessToken();

      if (!token) {
        throw new Error("No active session token");
      }

      const deviceId = `dashboard-activate-${Date.now()}`;
      const deviceName = "Dashboard Test Device";

      const res = await fetch(`${baseUrl}/perpetual/activate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          claimCode,
          deviceId,
          deviceName,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Activation failed");
      }

      setActionMessageByCode((prev) => ({
        ...prev,
        [claimCode]: `License activated on ${deviceName}.`,
      }));

      await loadDashboard();
    } catch (err) {
      setActionErrorByCode((prev) => ({
        ...prev,
        [claimCode]: err instanceof Error ? err.message : "Activation failed",
      }));
    } finally {
      setActionLoadingByCode((prev) => ({ ...prev, [claimCode]: false }));
    }
  }

  async function recoverLicense(claimCode: string) {
    try {
      clearLicenseActionState(claimCode);
      setActionLoadingByCode((prev) => ({ ...prev, [claimCode]: true }));

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = await getAccessToken();

      if (!token) {
        throw new Error("No active session token");
      }

      const newDeviceId = `dashboard-recover-${Date.now()}`;
      const newDeviceName = "Recovered Dashboard Device";

      const res = await fetch(`${baseUrl}/perpetual/recover`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          claimCode,
          newDeviceId,
          newDeviceName,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Recovery failed");
      }

      setActionMessageByCode((prev) => ({
        ...prev,
        [claimCode]: `License recovered to ${newDeviceName}.`,
      }));

      await loadDashboard();
    } catch (err) {
      setActionErrorByCode((prev) => ({
        ...prev,
        [claimCode]: err instanceof Error ? err.message : "Recovery failed",
      }));
    } finally {
      setActionLoadingByCode((prev) => ({ ...prev, [claimCode]: false }));
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold">KDS Dashboard</h1>
              <p className="text-sm text-neutral-400">
                Customer license, perpetual activation, and device visibility.
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
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-neutral-400">
              Signed in as <span className="text-white">{email}</span>
            </div>

            <button
              onClick={loadDashboard}
              className="rounded-xl border border-neutral-700 px-5 py-3 hover:bg-neutral-900"
            >
              {loading ? "Loading..." : "Refresh Dashboard"}
            </button>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm text-neutral-400">
            Device binding is handled automatically in this dashboard test UI.
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </div>

        {data ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 space-y-2">
                <h2 className="text-xl font-medium">User</h2>
                <p>Name: {data.user.name || "—"}</p>
                <p>Email: {data.user.email}</p>
                <p>Role: {data.user.role}</p>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 space-y-2">
                <h2 className="text-xl font-medium">Company</h2>
                <p>Name: {data.company.name}</p>
                <p>Contact: {data.company.contactEmail}</p>
                <p>ID: {data.company.id}</p>
              </div>
            </div>

            <section className="space-y-4">
              <h2 className="text-2xl font-medium">Subscription Licenses</h2>
              {data.subscriptionLicenses.length === 0 ? (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 text-neutral-400">
                  No subscription licenses
                </div>
              ) : (
                <div className="grid gap-4">
                  {data.subscriptionLicenses.map((license) => (
                    <div
                      key={license.id}
                      className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 space-y-2"
                    >
                      <p>Plan: {license.planName}</p>
                      <p>Active: {String(license.active)}</p>
                      <p>Seats: {license.seatCount}</p>
                      <p>Status: {license.subscriptionStatus || "—"}</p>
                      <p>Billing: {license.billingInterval || "—"}</p>
                      <p>Expires: {formatDate(license.expiresAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-medium">Perpetual Licenses</h2>
              {data.perpetualLicenses.length === 0 ? (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 text-neutral-400">
                  No perpetual licenses
                </div>
              ) : (
                <div className="grid gap-4">
                  {data.perpetualLicenses.map((license) => {
                    const isLoading = !!actionLoadingByCode[license.claimCode];
                    const actionMessage = actionMessageByCode[license.claimCode];
                    const actionError = actionErrorByCode[license.claimCode];

                    return (
                      <div
                        key={license.id}
                        className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 space-y-3"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-lg font-medium">{license.planName}</p>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs ${getPerpetualStatusClass(
                              license
                            )}`}
                          >
                            {getPerpetualStatusLabel(license)}
                          </span>
                        </div>

                        <p>Claim Code: {license.claimCode}</p>
                        <p>Backend Status: {license.status}</p>
                        <p>Active: {String(license.active)}</p>
                        <p>Claimed At: {formatDate(license.claimedAt)}</p>
                        <p>Activated At: {formatDate(license.activatedAt)}</p>
                        <p>Recovery Count: {license.recoveryCount}</p>
                        <p>Last Recovery: {formatDate(license.lastRecoveryAt)}</p>

                        <div className="pt-2">
                          <p className="font-medium">Current Device</p>
                          {license.currentDevice ? (
                            <div className="pl-4 space-y-1">
                              <p>Device ID: {license.currentDevice.deviceId}</p>
                              <p>Name: {license.currentDevice.deviceName || "—"}</p>
                              <p>Active: {String(license.currentDevice.active)}</p>
                              <p>Last Seen: {formatDate(license.currentDevice.lastSeenAt)}</p>
                            </div>
                          ) : (
                            <p className="pl-4 text-neutral-400">No device bound</p>
                          )}
                        </div>

                        <div className="pt-4 flex gap-3">
                          {!license.activatedAt && (
                            <button
                              onClick={() => activateLicense(license.claimCode)}
                              disabled={isLoading}
                              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-800 disabled:opacity-50"
                            >
                              {isLoading ? "Activating..." : "Activate"}
                            </button>
                          )}

                          {license.activatedAt && (
                            <button
                              onClick={() => recoverLicense(license.claimCode)}
                              disabled={isLoading}
                              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-800 disabled:opacity-50"
                            >
                              {isLoading ? "Recovering..." : "Recover"}
                            </button>
                          )}
                        </div>

                        {actionMessage ? (
                          <p className="text-sm text-green-400">{actionMessage}</p>
                        ) : null}

                        {actionError ? (
                          <p className="text-sm text-red-400">{actionError}</p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-medium">Devices</h2>
              {data.devices.length === 0 ? (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 text-neutral-400">
                  No devices
                </div>
              ) : (
                <div className="grid gap-4">
                  {data.devices.map((device) => (
                    <div
                      key={device.id}
                      className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 space-y-1"
                    >
                      <p>Device ID: {device.deviceId}</p>
                      <p>Name: {device.deviceName || "—"}</p>
                      <p>Active: {String(device.active)}</p>
                      <p>Last Seen: {formatDate(device.lastSeenAt)}</p>
                      <p>Created: {formatDate(device.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}