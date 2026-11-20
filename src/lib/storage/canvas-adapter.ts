import type { User } from "@supabase/supabase-js";
import type {
  CanvasEntry,
  CanvasEntryKind,
  CanvasPerson,
  GiftingCanvas,
} from "@/features/canvas/types";
import type { BoardPosition } from "@/features/canvas/positions";
import { getBrowserSupabase } from "@/lib/supabase/browser";

interface PersonRow {
  id: string;
  name: string;
  name_size: number | null;
  pos_x: number | null;
  pos_y: number | null;
  created_at: string;
}

interface EntryRow {
  id: string;
  person_id: string | null;
  related_entry_id: string | null;
  kind: CanvasEntryKind;
  content: string;
  storage_path: string | null;
  image_size: number | null;
  font_size: number | null;
  pos_x: number | null;
  pos_y: number | null;
  created_at: string;
}

const canvasStickerPaths: Record<string, string> = {
  pot: "/pot.jpg",
  humankind: "/stickers/humankind.png",
  rekin: "/stickers/rekin.png",
  love: "/stickers/love.png",
  foto: "/stickers/foto.png",
};

function requireSupabase() {
  const supabase = getBrowserSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured for this site.");
  }
  return supabase;
}

async function requireUser(): Promise<User> {
  const { data, error } = await requireSupabase().auth.getUser();
  if (error) throw new Error(`Could not check your sign-in: ${error.message}`);
  if (!data.user) throw new Error("Please sign in to use your canvas.");
  return data.user;
}

async function toCanvasEntry(row: EntryRow): Promise<CanvasEntry> {
  let imageUrl: string | null = null;
  if (row.kind === "image" && row.storage_path) {
    if (row.storage_path.startsWith("/")) imageUrl = row.storage_path;
    else {
      const { data, error } = await requireSupabase()
        .storage.from("canvas-images")
        .createSignedUrl(row.storage_path, 3600);
      if (error) throw new Error(`Could not load a canvas image: ${error.message}`);
      imageUrl = data.signedUrl;
    }
  } else if (row.kind === "sticker") {
    if (row.storage_path) {
      if (row.storage_path.startsWith("/stickers/")) imageUrl = canvasStickerPaths[row.content.trim()] ?? null;
      else if (row.storage_path.startsWith("/")) imageUrl = row.storage_path;
      else {
        const { data, error } = await requireSupabase()
          .storage.from("canvas-images")
          .createSignedUrl(row.storage_path, 3600);
        if (error) throw new Error(`Could not load a canvas sticker: ${error.message}`);
        imageUrl = data.signedUrl;
      }
    } else {
      const key = row.content.trim();
      imageUrl = canvasStickerPaths[key] ?? null;
    }
  }

  return {
    id: row.id,
    personId: row.person_id,
    relatedEntryId: row.related_entry_id,
    kind: row.kind,
    content: row.content,
    storagePath: row.storage_path,
    imageUrl,
    imageSize: row.image_size,
    fontSize: row.font_size,
    posX: row.pos_x,
    posY: row.pos_y,
    createdAt: row.created_at,
  };
}

export function subscribeToCanvasAuth(
  listener: (user: User | null) => void,
): (() => void) | null {
  const supabase = getBrowserSupabase();
  if (!supabase) return null;

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    listener(session?.user ?? null);
  });
  return () => data.subscription.unsubscribe();
}

export async function getCanvasUser(): Promise<User | null> {
  const supabase = getBrowserSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(`Could not check your sign-in: ${error.message}`);
  return data.session?.user ?? null;
}

export async function loadCanvas(): Promise<GiftingCanvas> {
  await requireUser();
  const supabase = requireSupabase();
  const [peopleResult, entriesResult] = await Promise.all([
    supabase
      .from("canvas_people")
      .select("id,name,name_size,pos_x,pos_y,created_at")
      .order("sort_order", { ascending: true }),
    supabase
      .from("canvas_entries")
      .select("id,person_id,related_entry_id,kind,content,storage_path,image_size,font_size,pos_x,pos_y,created_at")
      .order("sort_order", { ascending: true }),
  ]);
  if (peopleResult.error) {
    throw new Error(`Could not load your people: ${peopleResult.error.message}`);
  }
  if (entriesResult.error) {
    throw new Error(`Could not load your entries: ${entriesResult.error.message}`);
  }

  const peopleRows = peopleResult.data as PersonRow[];
  const entries = await Promise.all(
    (entriesResult.data as EntryRow[]).map(toCanvasEntry),
  );
  const people: CanvasPerson[] = peopleRows.map((row) => ({
    id: row.id,
    name: row.name,
    nameSize: row.name_size,
    posX: row.pos_x,
    posY: row.pos_y,
    createdAt: row.created_at,
    entries: entries.filter((entry) => entry.personId === row.id),
  }));
  return {
    people,
    unsorted: entries.filter((entry) => entry.personId === null),
  };
}

export async function createCanvasPerson(name: string, position: BoardPosition | null = null): Promise<void> {
  const user = await requireUser();
  const { error } = await requireSupabase()
    .from("canvas_people")
    .insert({
      user_id: user.id,
      name: name.trim(),
      pos_x: position?.x ?? null,
      pos_y: position?.y ?? null,
    });
  if (error) throw new Error(`Could not add this person: ${error.message}`);
}

export async function renameCanvasPerson(
  personId: string,
  name: string,
): Promise<void> {
  const { error } = await requireSupabase()
    .from("canvas_people")
    .update({ name: name.trim() })
    .eq("id", personId);
  if (error) throw new Error(`Could not rename this person: ${error.message}`);
}

export async function deleteCanvasPerson(personId: string): Promise<void> {
  const { error } = await requireSupabase()
    .from("canvas_people")
    .delete()
    .eq("id", personId);
  if (error) throw new Error(`Could not delete this person: ${error.message}`);
}

export async function createCanvasText(content: string, personId: string | null = null, position: BoardPosition | null = null): Promise<void> {
  const user = await requireUser();
  const { error } = await requireSupabase()
    .from("canvas_entries")
    .insert({
      user_id: user.id,
      kind: "text",
      person_id: personId,
      content: content.trim(),
      pos_x: position?.x ?? null,
      pos_y: position?.y ?? null,
    });
  if (error) throw new Error(`Could not add this note: ${error.message}`);
}

async function parentPersonId(
  relatedEntryId: string | null,
): Promise<string | null> {
  if (!relatedEntryId) return null;
  const { data, error } = await requireSupabase()
    .from("canvas_entries")
    .select("person_id,kind")
    .eq("id", relatedEntryId)
    .single();
  if (error) throw new Error(`Could not attach the image: ${error.message}`);
  if (data.kind !== "text") throw new Error("Images can only attach to a text note.");
  return data.person_id;
}

export async function createCanvasImage(
  file: File,
  relatedEntryId: string | null = null,
  targetPersonId: string | null = null,
  position: BoardPosition | null = null,
): Promise<void> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Images must be 5 MB or smaller.");
  }

  const user = await requireUser();
  const supabase = requireSupabase();
  const id = crypto.randomUUID();
  const storagePath = `${user.id}/${id}`;
  const personId = relatedEntryId ? await parentPersonId(relatedEntryId) : targetPersonId;
  const { error: uploadError } = await supabase.storage
    .from("canvas-images")
    .upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error(`Could not upload this image: ${uploadError.message}`);

  const { error: insertError } = await supabase.from("canvas_entries").insert({
    id,
    user_id: user.id,
    person_id: personId,
    related_entry_id: relatedEntryId,
    kind: "image",
    content: "",
    storage_path: storagePath,
    pos_x: position?.x ?? null,
    pos_y: position?.y ?? null,
  });
  if (insertError) {
    const { error: cleanupError } = await supabase.storage
      .from("canvas-images")
      .remove([storagePath]);
    if (cleanupError) {
      throw new Error(
        `Could not save this image: ${insertError.message}. Its temporary upload could not be removed: ${cleanupError.message}`,
      );
    }
    throw new Error(`Could not save this image: ${insertError.message}`);
  }
}

export async function createCanvasSticker(
  key: string = "pot",
  personId: string | null = null,
  relatedEntryId: string | null = null,
  position: BoardPosition | null = null,
): Promise<void> {
  const user = await requireUser();
  const stickerKey = key.trim() || "pot";
  const targetPersonId = relatedEntryId ? await parentPersonId(relatedEntryId) : personId;
  const { error } = await requireSupabase().from("canvas_entries").insert({
    user_id: user.id,
    person_id: targetPersonId,
    related_entry_id: relatedEntryId,
    kind: "sticker",
    content: stickerKey,
    storage_path: canvasStickerPaths[stickerKey] ?? null,
    pos_x: position?.x ?? null,
    pos_y: position?.y ?? null,
  });
  if (error) throw new Error(`Could not add this sticker: ${error.message}`);
}

export async function createCanvasStickerUpload(
  file: File,
  targetPersonId: string | null = null,
  relatedEntryId: string | null = null,
  position: BoardPosition | null = null,
): Promise<void> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Images must be 5 MB or smaller.");
  }

  const user = await requireUser();
  const supabase = requireSupabase();
  const id = crypto.randomUUID();
  const storagePath = `${user.id}/${id}`;
  const personId = relatedEntryId ? await parentPersonId(relatedEntryId) : targetPersonId;
  const { error: uploadError } = await supabase.storage
    .from("canvas-images")
    .upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error(`Could not upload this sticker: ${uploadError.message}`);

  const { error: insertError } = await supabase.from("canvas_entries").insert({
    id,
    user_id: user.id,
    person_id: personId,
    related_entry_id: relatedEntryId,
    kind: "sticker",
    content: file.name,
    storage_path: storagePath,
    pos_x: position?.x ?? null,
    pos_y: position?.y ?? null,
  });
  if (insertError) {
    const { error: cleanupError } = await supabase.storage
      .from("canvas-images")
      .remove([storagePath]);
    if (cleanupError) {
      throw new Error(
        `Could not save this sticker: ${insertError.message}. Its temporary upload could not be removed: ${cleanupError.message}`,
      );
    }
    throw new Error(`Could not save this sticker: ${insertError.message}`);
  }
}

export async function createCanvasImageFromUrl(
  path: string,
  personId: string | null,
  relatedEntryId: string | null = null,
  position: BoardPosition | null = null,
): Promise<void> {
  if (!/^\/jar\/frames\/vase_\d{2}\.webp$/.test(path)) throw new Error("Invalid public canvas image.");
  const user = await requireUser();
  const targetPersonId = relatedEntryId ? await parentPersonId(relatedEntryId) : personId;
  const { error } = await requireSupabase().from("canvas_entries").insert({
    user_id: user.id,
    person_id: targetPersonId,
    related_entry_id: relatedEntryId,
    kind: "image",
    content: "",
    storage_path: path,
    pos_x: position?.x ?? null,
    pos_y: position?.y ?? null,
  });
  if (error) throw new Error(`Could not add this image: ${error.message}`);
}

export async function updateCanvasPersonPosition(
  personId: string,
  position: BoardPosition,
): Promise<void> {
  const { error } = await requireSupabase()
    .from("canvas_people")
    .update({ pos_x: Math.round(position.x), pos_y: Math.round(position.y) })
    .eq("id", personId);
  if (error) throw new Error(`Could not move this person: ${error.message}`);
}

export async function updateCanvasEntryPosition(
  entryId: string,
  position: BoardPosition,
): Promise<void> {
  const { error } = await requireSupabase()
    .from("canvas_entries")
    .update({ pos_x: Math.round(position.x), pos_y: Math.round(position.y) })
    .eq("id", entryId);
  if (error) throw new Error(`Could not move this entry: ${error.message}`);
}

export async function placeCanvasEntry(
  entryId: string,
  personId: string | null,
  position: BoardPosition,
): Promise<void> {
  const { error } = await requireSupabase()
    .from("canvas_entries")
    .update({
      person_id: personId,
      pos_x: Math.round(position.x),
      pos_y: Math.round(position.y),
    })
    .eq("id", entryId);
  if (error) throw new Error(`Could not move this entry: ${error.message}`);
}

export async function updateCanvasEntrySize(entryId: string, imageSize: number): Promise<void> {
  if (!Number.isInteger(imageSize) || imageSize < 16 || imageSize > 10000) {
    throw new Error("Choose an image size between 16 pixels and 10000 pixels.");
  }
  const { error } = await requireSupabase()
    .from("canvas_entries")
    .update({ image_size: imageSize })
    .eq("id", entryId)
    .neq("kind", "text");
  if (error) throw new Error(`Could not resize this image: ${error.message}`);
}

export async function updateCanvasEntryFontSize(entryId: string, fontSize: number): Promise<void> {
  if (!Number.isInteger(fontSize) || fontSize < 14 || fontSize > 80) {
    throw new Error("Choose a text size between 14 and 80 pixels.");
  }
  const { error } = await requireSupabase()
    .from("canvas_entries")
    .update({ font_size: fontSize })
    .eq("id", entryId)
    .eq("kind", "text");
  if (error) throw new Error(`Could not resize this note: ${error.message}`);
}

export async function updateCanvasPersonSize(personId: string, nameSize: number): Promise<void> {
  if (!Number.isInteger(nameSize) || nameSize < 24 || nameSize > 240) {
    throw new Error("Choose a name size between 24 and 240 pixels.");
  }
  const { error } = await requireSupabase()
    .from("canvas_people")
    .update({ name_size: nameSize })
    .eq("id", personId);
  if (error) throw new Error(`Could not resize this name: ${error.message}`);
}

export async function deleteCanvasEntry(entryId: string): Promise<void> {
  const supabase = requireSupabase();
  const { data, error: readError } = await supabase
    .from("canvas_entries")
    .select("id,kind,storage_path")
    .eq("id", entryId)
    .single();
  if (readError) throw new Error(`Could not find this entry: ${readError.message}`);

  let attachedImagePaths: string[] = [];
  if (data.kind === "text") {
    const { data: childRows, error: childError } = await supabase
      .from("canvas_entries")
      .select("storage_path")
      .eq("related_entry_id", entryId);
    if (childError) throw new Error(`Could not inspect attached images: ${childError.message}`);
    attachedImagePaths = (childRows as { storage_path: string | null }[])
      .flatMap((row) => row.storage_path ? [row.storage_path] : []);
  }

  const { error } = await supabase.from("canvas_entries").delete().eq("id", entryId);
  if (error) throw new Error(`Could not delete this entry: ${error.message}`);
  if (data.kind === "text") {
    if (attachedImagePaths.length) {
      const { error: cleanupError } = await supabase.storage
        .from("canvas-images")
        .remove(attachedImagePaths);
      if (cleanupError) {
        throw new Error(`The entry was deleted, but its images could not be removed: ${cleanupError.message}`);
      }
    }
  } else if (data.storage_path && !data.storage_path.startsWith("/")) {
    const { error: cleanupError } = await supabase.storage
      .from("canvas-images")
      .remove([data.storage_path]);
    if (cleanupError) {
      throw new Error(`The entry was deleted, but its image could not be removed: ${cleanupError.message}`);
    }
  }
}

export async function createCanvasShare(
  personId: string | null,
): Promise<string> {
  const user = await requireUser();
  const { data, error } = await requireSupabase()
    .from("canvas_shares")
    .insert({ user_id: user.id, person_id: personId })
    .select("token")
    .single();
  if (error) throw new Error(`Could not create a share link: ${error.message}`);
  return data.token as string;
}
