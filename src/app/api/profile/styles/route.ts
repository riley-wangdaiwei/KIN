import { NextResponse } from "next/server";
import { getAuthedProfileClient } from "@/lib/supabase/route-auth";

const MAX_STYLE_LENGTH = 40;

function cleanStyle(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed === "" || trimmed.length > MAX_STYLE_LENGTH) return null;
  return trimmed;
}

// The signed-in user's gifting styles, oldest first. A missing table
// (migration not applied yet) reads as an empty list — the profile page
// falls back to its local starter styles instead of breaking.
export async function GET(request: Request) {
  const authed = await getAuthedProfileClient(request);
  if (!authed) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }
  const { data, error } = await authed.supabase
    .from("user_gifting_styles")
    .select("style")
    .order("created_at", { ascending: true });
  if (error) {
    return NextResponse.json({ styles: [] }, { status: 200 });
  }
  return NextResponse.json({
    styles: (data ?? []).map((row) => row.style as string),
  });
}

export async function POST(request: Request) {
  const authed = await getAuthedProfileClient(request);
  if (!authed) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    style?: unknown;
  } | null;
  const style = cleanStyle(body?.style);
  if (!style) {
    return NextResponse.json(
      { error: "Give a keyword up to 40 characters." },
      { status: 400 },
    );
  }
  const { error } = await authed.supabase
    .from("user_gifting_styles")
    .insert({ user_id: authed.user.id, style });
  if (error) {
    // A duplicate (unique index on user + lower(style)) reads as a
    // conflict; anything else is a server error.
    const code = (error as { code?: string }).code;
    if (code === "23505") {
      return NextResponse.json(
        { error: "That style is already on your profile." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "That style could not be saved." },
      { status: 500 },
    );
  }
  return NextResponse.json({ style }, { status: 201 });
}

export async function DELETE(request: Request) {
  const authed = await getAuthedProfileClient(request);
  if (!authed) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    style?: unknown;
  } | null;
  const style = cleanStyle(body?.style);
  if (!style) {
    return NextResponse.json(
      { error: "Give a keyword up to 40 characters." },
      { status: 400 },
    );
  }
  const { error } = await authed.supabase
    .from("user_gifting_styles")
    .delete()
    .eq("user_id", authed.user.id)
    .ilike("style", style);
  if (error) {
    return NextResponse.json(
      { error: "That style could not be removed." },
      { status: 500 },
    );
  }
  return NextResponse.json({ style });
}
