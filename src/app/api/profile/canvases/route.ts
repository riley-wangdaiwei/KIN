import { NextResponse } from "next/server";
import { getAuthedProfileClient } from "@/lib/supabase/route-auth";

const MAX_NAME_LENGTH = 120;

export interface ProfileCanvasRow {
  id: string;
  name: string;
  person_id: string | null;
  created_at: string;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

// The signed-in user's named canvases, oldest first. A missing table
// (migration not applied yet) reads as an empty list — the profile page
// falls back to showing just the whole board instead of breaking.
export async function GET(request: Request) {
  const authed = await getAuthedProfileClient(request);
  if (!authed) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }
  const { data, error } = await authed.supabase
    .from("profile_canvases")
    .select("id,name,person_id,created_at")
    .order("created_at", { ascending: true });
  if (error) {
    return NextResponse.json({ canvases: [] }, { status: 200 });
  }
  return NextResponse.json({
    canvases: (data ?? []) as ProfileCanvasRow[],
  });
}

export async function POST(request: Request) {
  const authed = await getAuthedProfileClient(request);
  if (!authed) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    name?: unknown;
    personId?: unknown;
  } | null;
  const name =
    typeof body?.name === "string" ? body.name.trim() : "";
  if (name === "" || name.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { error: "Give the canvas a name up to 120 characters." },
      { status: 400 },
    );
  }
  const personId =
    typeof body?.personId === "string" && body.personId !== ""
      ? body.personId
      : null;
  if (personId !== null && !isUuid(personId)) {
    return NextResponse.json(
      { error: "That person could not be found." },
      { status: 400 },
    );
  }
  // A linked person must be one of the caller's own people on their board.
  if (personId !== null) {
    const { data: person, error: personError } = await authed.supabase
      .from("canvas_people")
      .select("id")
      .eq("id", personId)
      .eq("user_id", authed.user.id)
      .maybeSingle();
    if (personError || !person) {
      return NextResponse.json(
        { error: "That person could not be found." },
        { status: 400 },
      );
    }
  }
  const { data, error } = await authed.supabase
    .from("profile_canvases")
    .insert({
      user_id: authed.user.id,
      name,
      person_id: personId,
    })
    .select("id,name,person_id,created_at")
    .single();
  if (error || !data) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "23505") {
      return NextResponse.json(
        { error: "You already have a canvas with that name." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "That canvas could not be added." },
      { status: 500 },
    );
  }
  return NextResponse.json(
    { canvas: data as ProfileCanvasRow },
    { status: 201 },
  );
}
