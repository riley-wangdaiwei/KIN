import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

// A community canvas: one weekly question and every answer to it, collected
// automatically from the canvas entries linked to that question. No login
// required. Answers are text only — no names are attached to them.
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!isUuid(id)) {
    return NextResponse.json(
      { error: "This community canvas could not be found." },
      { status: 404 },
    );
  }

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
  const [questionResult, answersResult] = await Promise.all([
    supabase
      .from("community_questions")
      .select("id,question,created_at")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("canvas_entries")
      .select("id,content,created_at")
      .eq("question_id", id)
      .eq("kind", "text")
      .order("created_at", { ascending: true }),
  ]);
  if (questionResult.error || answersResult.error) {
    return NextResponse.json(
      { error: "Could not load this community canvas." },
      { status: 500 },
    );
  }
  if (!questionResult.data) {
    return NextResponse.json(
      { error: "This community canvas could not be found." },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      question: {
        id: questionResult.data.id as string,
        question: questionResult.data.question as string,
        createdAt: questionResult.data.created_at as string,
      },
      answers: (answersResult.data ?? []).map((row) => ({
        id: row.id as string,
        content: row.content as string,
        createdAt: row.created_at as string,
      })),
    },
    { headers: { "Cache-Control": "no-store, private" } },
  );
}
