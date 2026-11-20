import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

// Authenticate a profile API request with the caller's own session: the
// client sends its Supabase access token as `Authorization: Bearer <token>`
// (taken from the browser session), and the route validates it and runs
// every query as that user, so RLS applies. No service role key is used
// here — user-owned rows stay owner-only.
export async function getAuthedProfileClient(
  request: Request,
): Promise<{ supabase: SupabaseClient; user: User } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!url || !anonKey || !token) return null;

  const supabase = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { supabase, user: data.user };
}
