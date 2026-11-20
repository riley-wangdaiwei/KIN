import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// The current weekly question, for the canvas waterfall. No login required.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return NextResponse.json(
      { error: "This week's question is not configured yet." },
      { status: 503 },
    );
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase
    .from("community_questions")
    .select("id,question")
    .eq("is_current", true)
    .maybeSingle();
  if (error) {
    return NextResponse.json(
      { error: "Could not load this week's question." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      question: data
        ? { id: data.id as string, question: data.question as string }
        : null,
    },
    { headers: { "Cache-Control": "no-store, private" } },
  );
}
