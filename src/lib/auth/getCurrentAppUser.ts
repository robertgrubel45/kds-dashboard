import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export type CurrentAppUser = {
  authUserId: string;
  email: string;
  dbUserId: string;
  name: string | null;
  role: string | null;
  companyId: string | null;
  companyType: string | null;
};

export async function getCurrentAppUser(): Promise<CurrentAppUser | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return null;
  }

  const res = await fetch(`${process.env.BACKEND_API_URL}/auth/me`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": process.env.BACKEND_INTERNAL_API_KEY!,
    },
    body: JSON.stringify({
      email: user.email,
      authUserId: user.id,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  const json = await res.json();

  if (!json.ok) {
    return null;
  }

  return {
    authUserId: user.id,
    email: json.user.email,
    dbUserId: json.user.id,
    name: json.user.name,
    role: json.user.role,
    companyId: json.user.companyId,
    companyType: json.user.companyType,
  };
}