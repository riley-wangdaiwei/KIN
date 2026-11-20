import { NextResponse } from "next/server";

interface ResendResponse {
  id?: string;
  message?: string;
  name?: string;
}

const labels: Record<string, string> = {
  person: "Who's your person?",
  occasion: "What are we celebrating?",
  sunday: "Their perfect Sunday looks like…",
  kind: "They're the kind of person who…",
  weather: "If they were a weather, they'd be…",
  gesture: "How big a gesture?",
  timing: "How's the clock looking?",
  email: "Where should we send your result?",
};

const expected = [
  "person",
  "occasion",
  "sunday",
  "kind",
  "weather",
  "gesture",
  "timing",
  "email",
];

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
      { error: "The gift quiz email is not configured. Please try again later." },
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
  if (typeof body.result !== "string" || body.result.trim().length === 0) {
    return NextResponse.json({ error: "The result was not valid." }, { status: 400 });
  }
  const result = body.result.trim();
  const energy =
    typeof body.energy === "string" && body.energy.trim().length > 0
      ? body.energy.trim()
      : null;
  const userEmail = (answers.email as string).trim();

  // The artist reads the answers before the meeting.
  const lines = expected.map(
    (key) => `${labels[key]}\n${(answers[key] as string).trim()}`,
  );
  const teamSent = await sendEmail({
    apiKey,
    from,
    to: inbox,
    subject: "New re.KIN gift quiz result",
    text: `New re.KIN gift quiz result\n\n${lines.join("\n\n")}\n\nResult\n${result}${
      energy ? `\n${energy}` : ""
    }`,
    html: `<h1>New re.KIN gift quiz result</h1>${expected
      .map(
        (key) =>
          `<p><strong>${escapeHtml(labels[key])}</strong><br />${escapeHtml((answers[key] as string).trim())}</p>`,
      )
      .join("")}<p><strong>Result</strong><br />${escapeHtml(result)}${
      energy ? `<br />${escapeHtml(energy)}` : ""
    }</p>`,
    idempotencyKey: crypto.randomUUID(),
  });
  if (!teamSent.ok) {
    return NextResponse.json(
      { error: `We could not send your answers: ${teamSent.message}` },
      { status: 502 },
    );
  }

  // The result goes to the user too, at the address they entered.
  const userSent = await sendEmail({
    apiKey,
    from,
    to: userEmail,
    subject: "Your re.KIN gift result",
    text: `Your re.KIN gift result\n\n${result}${energy ? `\n\n${energy}` : ""}\n\nIf you ever want to go further, book a free curation meeting with our artist: https://www.r3kin.info/my-gifting-identity`,
    html: `<h1>Your re.KIN gift result</h1><p>${escapeHtml(result)}</p>${
      energy ? `<p>${escapeHtml(energy)}</p>` : ""
    }<p>If you ever want to go further, <a href="https://www.r3kin.info/my-gifting-identity">book a free curation meeting</a> with our artist.</p>`,
    idempotencyKey: crypto.randomUUID(),
  });

  return NextResponse.json({ ok: true, resultEmailed: userSent.ok });
}
