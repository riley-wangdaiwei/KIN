import { NextResponse } from "next/server";

interface ResendResponse {
  id?: string;
  message?: string;
  name?: string;
}

const labels: Record<string, string> = {
  recipient: "Who is it for?",
  occasion: "What is the occasion?",
  "something-special": "What is something special about them?",
  budget: "What budget feels right?",
  timeline: "When do you need the gift?",
  email: "Your contact email",
};

const expected = ["recipient", "occasion", "something-special", "budget", "timeline", "email"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
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
      { error: "The gifting identity email is not configured. Please try again later." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The answers were not valid." }, { status: 400 });
  }

  if (!isRecord(body) || !isRecord(body.answers)) {
    return NextResponse.json({ error: "The answers were not valid." }, { status: 400 });
  }

  const answers = body.answers;
  const missing = expected.filter(
    (key) => typeof answers[key] !== "string" || (answers[key] as string).trim().length === 0,
  );
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Please answer every question first." },
      { status: 400 },
    );
  }

  const lines = expected.map(
    (key) => `${labels[key]}\n${(answers[key] as string).trim()}`,
  );
  const sent = await sendEmail({
    apiKey,
    from,
    to: inbox,
    subject: "New re.KIN gifting identity",
    text: `New re.KIN gifting identity\n\n${lines.join("\n\n")}`,
    html: `<h1>New re.KIN gifting identity</h1>${expected
      .map(
        (key) =>
          `<p><strong>${escapeHtml(labels[key])}</strong><br />${escapeHtml((answers[key] as string).trim())}</p>`,
      )
      .join("")}`,
    idempotencyKey: crypto.randomUUID(),
  });
  if (!sent.ok) {
    return NextResponse.json(
      { error: `We could not send your answers: ${sent.message}` },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
