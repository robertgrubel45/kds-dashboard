import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth/getCurrentAppUser";
import DashboardClient from "./DashboardClient";

export default async function Page() {
  const appUser = await getCurrentAppUser();

  if (!appUser) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 space-y-4">
            <h1 className="text-3xl font-semibold">KDS Dashboard</h1>
            <p className="text-neutral-400">You are not authenticated.</p>
            <Link
              href="/login"
              className="inline-block rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-900"
            >
              Go to login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (appUser.companyType !== "customer") {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 space-y-4">
            <h1 className="text-3xl font-semibold">KDS Dashboard</h1>
            <p className="text-red-400">
              Access denied. This page is for customer accounts only.
            </p>
            <p className="text-sm text-neutral-400">
              Signed in as: {appUser.email}
            </p>
            <Link
              href="/reseller"
              className="inline-block rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-900"
            >
              Go to reseller dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <DashboardClient appUser={appUser} />;
}
