import { NextResponse } from "next/server";

interface ResendResponse {
  id?: string;
  message?: string;
  name?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseShareUrl(value: unknown): string | null {
  if (!isRecord(value) || typeof value.shareUrl !== "string") return null;
  const shareUrl = value.shareUrl.trim();
  if (shareUrl.length === 0 || shareUrl.length > 2048) return null;
  let url: URL;
  try {
    url = new URL(shareUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  const token = url.pathname.replace(/^\/canvas-share\//, "");
  if (!url.pathname.startsWith("/canvas-share/") || token.length === 0 || token.includes("/")) {
    return null;
  }
  return shareUrl;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>\"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

async function sendEmail({
  apiKey,
  from,
  to,
  subject,
  text,
  html,
  idempotencyKey,
}: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        html,
      }),
      cache: "no-store",
    });
  } catch {
    return { ok: false, message: "The email service could not be reached." };
  }

  let result: ResendResponse;
  try {
    result = (await response.json()) as ResendResponse;
  } catch {
    return { ok: false, message: "The email service returned an invalid response." };
  }

  if (!response.ok || !result.id) {
    return {
      ok: false,
      message: result.message ?? result.name ?? "The email could not be accepted.",
    };
  }

  return { ok: true };
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const inbox = process.env.KIN_ORDERS_EMAIL?.trim();
  const from =
    process.env.KIN_FROM_EMAIL?.trim() || "re.KIN <hello@r3kin.info>";

  if (!apiKey || !inbox) {
    return NextResponse.json(
      { error: "Canvas share email is not configured. Please try again later." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The share link was not valid." }, { status: 400 });
  }

  const shareUrl = parseShareUrl(body);
  if (!shareUrl) {
    return NextResponse.json({ error: "The share link was not valid." }, { status: 400 });
  }

  const sent = await sendEmail({
    apiKey,
    from,
    to: inbox,
    subject: "New re.KIN canvas share",
    text: `New re.KIN canvas share\n\n${shareUrl}`,
    html: `<h1>New re.KIN canvas share</h1><p><a href="${escapeHtml(shareUrl)}">${escapeHtml(shareUrl)}</a></p>`,
    idempotencyKey: crypto.randomUUID(),
  });
  if (!sent.ok) {
    return NextResponse.json(
      { error: `We could not send your canvas: ${sent.message}` },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
