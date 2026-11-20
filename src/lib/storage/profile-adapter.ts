import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { ProfileCanvasRow } from "@/app/api/profile/canvases/route";

export type { ProfileCanvasRow };

// Client access to the profile API routes (gifting styles + named
// canvases). Every call sends the browser session's access token; the
// routes validate it and run as that user, so RLS applies. Calls throw
// on failure — the profile page falls back to local state (starter
// styles, board-only directory) instead of breaking when the tables or
// the session are not there yet.

async function accessToken(): Promise<string | null> {
  const supabase = getBrowserSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(`Could not check your sign-in: ${error.message}`);
  return data.session?.access_token ?? null;
}

async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await accessToken();
  if (!token) throw new Error("Please sign in.");
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  return response;
}

async function readError(response: Response, fallback: string): Promise<string> {
  const result = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return result?.error ?? fallback;
}

export async function listGiftingStyles(): Promise<string[]> {
  const response = await authedFetch("/api/profile/styles");
  if (!response.ok) throw new Error(await readError(response, "Your styles could not be loaded."));
  const result = (await response.json()) as { styles?: string[] };
  return result.styles ?? [];
}

export async function addGiftingStyle(style: string): Promise<void> {
  const response = await authedFetch("/api/profile/styles", {
    method: "POST",
    body: JSON.stringify({ style }),
  });
  if (!response.ok) throw new Error(await readError(response, "That style could not be saved."));
}

export async function removeGiftingStyle(style: string): Promise<void> {
  const response = await authedFetch("/api/profile/styles", {
    method: "DELETE",
    body: JSON.stringify({ style }),
  });
  if (!response.ok) throw new Error(await readError(response, "That style could not be removed."));
}

export async function listProfileCanvases(): Promise<ProfileCanvasRow[]> {
  const response = await authedFetch("/api/profile/canvases");
  if (!response.ok) throw new Error(await readError(response, "Your canvases could not be loaded."));
  const result = (await response.json()) as { canvases?: ProfileCanvasRow[] };
  return result.canvases ?? [];
}

export async function createProfileCanvas(
  name: string,
  personId: string | null,
): Promise<ProfileCanvasRow> {
  const response = await authedFetch("/api/profile/canvases", {
    method: "POST",
    body: JSON.stringify({ name, personId }),
  });
  if (!response.ok) throw new Error(await readError(response, "That canvas could not be added."));
  const result = (await response.json()) as { canvas: ProfileCanvasRow };
  return result.canvas;
}
