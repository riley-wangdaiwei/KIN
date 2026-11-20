import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Public read for the community page: published canvases + the community
// canvases (one per weekly question). No login required. Reads go through
// the service role, the same pattern as the canvas share route, so the
// response never depends on the visitor's session.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return NextResponse.json(
      { error: "The community is not configured yet." },
      { status: 503 },
    );
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const [publicationsResult, questionsResult] = await Promise.all([
    supabase
      .from("canvas_publications")
      .select("token,name,created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("community_questions")
      .select("id,question,created_at")
      .order("created_at", { ascending: false }),
  ]);
  if (publicationsResult.error || questionsResult.error) {
    return NextResponse.json(
      { error: "Could not load the community." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      publications: (publicationsResult.data ?? []).map((row) => ({
        token: row.token as string,
        name: row.name as string,
        createdAt: row.created_at as string,
      })),
      communityCanvases: (questionsResult.data ?? []).map((row) => ({
        id: row.id as string,
        question: row.question as string,
        createdAt: row.created_at as string,
      })),
    },
    { headers: { "Cache-Control": "no-store, private" } },
  );
}
