import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth/getCurrentAppUser";

export default async function AppUserTestPage() {
  const appUser = await getCurrentAppUser();

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-4">App User Test</h1>

        {!appUser ? (
          <div className="space-y-3">
            <p>No mapped app user found.</p>
            <Link href="/login" className="inline-block rounded-lg border px-3 py-2">
              Go to login
            </Link>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <p><strong>Auth User ID:</strong> {appUser.authUserId}</p>
            <p><strong>Email:</strong> {appUser.email}</p>
            <p><strong>DB User ID:</strong> {appUser.dbUserId}</p>
            <p><strong>Name:</strong> {appUser.name ?? "—"}</p>
            <p><strong>Role:</strong> {appUser.role ?? "—"}</p>
            <p><strong>Company ID:</strong> {appUser.companyId ?? "—"}</p>
            <p><strong>Company Type:</strong> {appUser.companyType ?? "—"}</p>
          </div>
        )}
      </div>
    </main>
  );
}