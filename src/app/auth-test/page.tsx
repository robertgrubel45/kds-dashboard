import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AuthTestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-4">Auth Test</h1>

        {user ? (
          <div className="space-y-2">
            <p className="text-sm">Signed in as:</p>
            <p className="font-medium">{user.email}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm">No active session.</p>
            <Link href="/login" className="inline-block rounded-lg border px-3 py-2">
              Go to login
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}