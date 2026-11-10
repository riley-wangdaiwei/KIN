import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type {
  CanvasEntry,
  CanvasPerson,
  SharedCanvas,
} from "@/features/canvas/types";

interface ShareRow {
  user_id: string;
  person_id: string | null;
}

interface PersonRow {
  id: string;
  name: string;
  created_at: string;
}

interface EntryRow {
  id: string;
  person_id: string | null;
  related_entry_id: string | null;
  kind: "text" | "image" | "sticker";
  content: string;
  storage_path: string | null;
  created_at: string;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  if (!isUuid(token)) {
    return NextResponse.json({ error: "This share link is not valid." }, { status: 404 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Shared canvases are not configured yet." },
      { status: 503 },
    );
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: share, error: shareError } = await supabase
    .from("canvas_shares")
    .select("user_id,person_id")
    .eq("token", token)
    .maybeSingle();
  if (shareError) {
    return NextResponse.json({ error: "Could not load this share link." }, { status: 500 });
  }
  if (!share) {
    return NextResponse.json({ error: "This share link is no longer available." }, { status: 404 });
  }

  const shareRow = share as ShareRow;
  const peopleQuery = supabase
    .from("canvas_people")
    .select("id,name,created_at")
    .eq("user_id", shareRow.user_id)
    .order("created_at", { ascending: true });
  const [peopleResult, unsortedResult] = await Promise.all([
    shareRow.person_id
      ? peopleQuery.eq("id", shareRow.person_id)
      : peopleQuery,
    supabase
      .from("canvas_entries")
      .select("id,person_id,related_entry_id,kind,content,storage_path,created_at")
      .eq("user_id", shareRow.user_id)
      .is("person_id", null)
      .order("created_at", { ascending: true }),
  ]);
  if (peopleResult.error || unsortedResult.error) {
    return NextResponse.json({ error: "Could not load this shared canvas." }, { status: 500 });
  }

  const personRows = peopleResult.data as PersonRow[];
  const personEntryResults = await Promise.all(
    personRows.map((person) =>
      supabase
        .from("canvas_entries")
        .select("id,person_id,related_entry_id,kind,content,storage_path,created_at")
        .eq("user_id", shareRow.user_id)
        .eq("person_id", person.id)
        .order("created_at", { ascending: true }),
    ),
  );
  const entryRows = [
    ...(unsortedResult.data as EntryRow[]),
    ...personEntryResults.flatMap((result) => {
      if (result.error) return [];
      return result.data as EntryRow[];
    }),
  ];
  if (personEntryResults.some((result) => result.error)) {
    return NextResponse.json({ error: "Could not load this shared canvas." }, { status: 500 });
  }

  async function toEntry(row: EntryRow): Promise<CanvasEntry> {
    let imageUrl: string | null = null;
    if (row.kind === "image" && row.storage_path) {
      const { data, error } = await supabase.storage
        .from("canvas-images")
        .createSignedUrl(row.storage_path, 600);
      if (error) throw new Error("Could not load an image for this share.");
      imageUrl = data.signedUrl;
    } else if (row.kind === "sticker") {
      imageUrl = "/pot.jpg";
    }

    return {
      id: row.id,
      personId: row.person_id,
      relatedEntryId: row.related_entry_id,
      kind: row.kind,
      content: row.content,
      storagePath: null,
      imageUrl,
      createdAt: row.created_at,
    };
  }

  let entries: CanvasEntry[];
  try {
    entries = await Promise.all(entryRows.map(toEntry));
  } catch {
    return NextResponse.json({ error: "Could not load an image for this share." }, { status: 500 });
  }

  const people: CanvasPerson[] = personRows.map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    entries: entries.filter((entry) => entry.personId === row.id),
  }));
  const result: SharedCanvas = {
    person: shareRow.person_id
      ? (() => {
          const person = people[0];
          return person ? { id: person.id, name: person.name } : null;
        })()
      : null,
    people,
    unsorted: shareRow.person_id
      ? []
      : entries.filter((entry) => entry.personId === null),
  };

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store, private" },
  });
}
