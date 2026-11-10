import { NextResponse } from "next/server";

const roles = [
  "Artist",
  "Florist",
  "Bookstore",
  "Record shop",
  "Gift shop",
  "Corporate / business",
  "Other",
];

const interests = [
  "Join as an artist",
  "Corporate gifting",
  "Physical gifts or shop partnership",
  "Another collaboration",
];

interface ArtistInquiry {
  name: string;
  role: string;
  interest: string;
  website: string;
  email: string;
  message: string;
}

interface ResendResponse {
  id?: string;
  message?: string;
  name?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length <= maxLength;
}

function parseInquiry(value: unknown): ArtistInquiry | null {
  if (
    !isRecord(value) ||
    !isString(value.name, 120) ||
    !isString(value.role, 50) ||
    !roles.includes(value.role) ||
    !isString(value.interest, 80) ||
    !interests.includes(value.interest) ||
    !isString(value.website, 2048) ||
    !isString(value.email, 254) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) ||
    !isString(value.message, 2000)
  ) {
    return null;
  }

  if (value.website) {
    try {
      const website = new URL(value.website);
      if (website.protocol !== "http:" && website.protocol !== "https:") {
        return null;
      }
    } catch {
      return null;
    }
  }

  return {
    name: value.name.trim(),
    role: value.role,
    interest: value.interest,
    website: value.website.trim(),
    email: value.email.trim(),
    message: value.message.trim(),
  };
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
  replyTo,
  subject,
  text,
  html,
  idempotencyKey,
}: {
  apiKey: string;
  from: string;
  to: string;
  replyTo?: string;
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
        ...(replyTo ? { reply_to: replyTo } : {}),
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
  const inbox = process.env.KIN_INBOX_EMAIL?.trim();
  const from =
    process.env.KIN_FROM_EMAIL?.trim() || "re.KIN <hello@r3kin.info>";

  if (!apiKey || !inbox) {
    return NextResponse.json(
      { error: "Artist inquiry email is not configured. Please try again later." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The inquiry was not valid." }, { status: 400 });
  }

  const inquiry = parseInquiry(body);
  if (!inquiry) {
    return NextResponse.json(
      { error: "Please review your answers and try again." },
      { status: 400 },
    );
  }

  const details = [
    `Name: ${inquiry.name || "Not provided"}`,
    `Role: ${inquiry.role}`,
    `Interested in: ${inquiry.interest}`,
    `Website or portfolio: ${inquiry.website || "Not provided"}`,
    `Email: ${inquiry.email}`,
    `Message: ${inquiry.message || "Not provided"}`,
  ];
  const html = `<h1>New re.KIN artist and partner inquiry</h1><table>${details
    .map(
      (line) =>
        `<tr><td style="padding:6px 12px 6px 0;vertical-align:top">${escapeHtml(line.split(":")[0])}</td><td style="padding:6px 0;white-space:pre-wrap">${escapeHtml(line.slice(line.indexOf(":") + 1).trim())}</td></tr>`,
    )
    .join("")}</table>`;
  const requestId = crypto.randomUUID();

  const internalEmail = await sendEmail({
    apiKey,
    from,
    to: inbox,
    replyTo: inquiry.email,
    subject: `New re.KIN inquiry — ${inquiry.role}`,
    text: `New re.KIN artist and partner inquiry\n\n${details.join("\n")}`,
    html,
    idempotencyKey: `${requestId}-team`,
  });
  if (!internalEmail.ok) {
    return NextResponse.json(
      { error: `We could not send your inquiry: ${internalEmail.message}` },
      { status: 502 },
    );
  }

  const confirmation = await sendEmail({
    apiKey,
    from,
    to: inquiry.email,
    subject: "We received your re.KIN inquiry",
    text: "Thanks for getting in touch. We received your message and will be in touch soon.",
    html: "<p>Thanks for getting in touch. We received your message and will be in touch soon.</p>",
    idempotencyKey: `${requestId}-sender`,
  });
  if (!confirmation.ok) {
    return NextResponse.json(
      {
        error: `Your inquiry reached the re.KIN team, but we could not send the confirmation email: ${confirmation.message}`,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
