import { NextResponse, type NextRequest } from "next/server";
import { getGiftPackage, supportingGifts } from "@/data/gifts";
import type { GiftOrderRequest, OrderSource } from "@/features/orders/types";

interface ResendResponse {
  id?: string;
  message?: string;
  name?: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sources: OrderSource[] = ["board", "gift-page", "partner"];
const digitalOptions = supportingGifts
  .filter((item) => item.kind === "digital" || item.kind === "licensed")
  .map((item) => item.title);
const physicalOptions = supportingGifts
  .filter((item) => item.kind === "physical")
  .map((item) => item.title);

function isText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length <= maxLength;
}

function isTextList(value: unknown, allowedValues: string[]): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= allowedValues.length &&
    value.every(
      (item): item is string =>
        typeof item === "string" && allowedValues.includes(item),
    )
  );
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

function renderOrder(order: GiftOrderRequest, packageTitle: string): string {
  const entries: [string, string][] = [
    ["Reference", order.orderId],
    ["Source", order.source],
    ["Package", packageTitle],
    ["Digital fillings", order.digitalFillings.join(", ") || "None selected"],
    ["Physical fillings", order.physicalFillings.join(", ") || "None selected"],
    ["Gift Brief — Me", order.brief.me],
    ["Gift Brief — Them", order.brief.them],
    ["Gift Brief — The Gift", order.brief.gift],
    ["Selected materials", order.supplementalMaterials || "None selected"],
    ["Personal message", order.personalMessage || "None provided"],
    ["Purchaser email", order.purchaserEmail],
    ["Recipient name", order.recipientName || "Not provided"],
    ["Delivery notes", order.deliveryNotes || "None provided"],
  ];

  return `<table style="border-collapse:collapse;width:100%;max-width:720px">${entries
    .map(
      ([label, value]) =>
        `<tr><th style="border-bottom:1px solid #ccc;padding:8px;text-align:left;vertical-align:top">${escapeHtml(label)}</th><td style="border-bottom:1px solid #ccc;padding:8px;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`,
    )
    .join("")}</table>`;
}

async function sendEmail({
  apiKey,
  from,
  to,
  replyTo,
  subject,
  html,
  text,
  idempotencyKey,
}: {
  apiKey: string;
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
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
        html,
        text,
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
      message:
        result.message ??
        result.name ??
        "The email service could not accept the message.",
    };
  }
  return { ok: true };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.KIN_FROM_EMAIL;
  const ordersEmail = process.env.KIN_ORDERS_EMAIL;

  const requestId = request.headers.get("Idempotency-Key");
  if (!requestId || !/^[0-9a-f-]{36}$/i.test(requestId)) {
    return NextResponse.json(
      { error: "A valid order request ID is required." },
      { status: 400 },
    );
  }

  let body: GiftOrderRequest;
  try {
    body = (await request.json()) as GiftOrderRequest;
  } catch {
    return NextResponse.json({ error: "The order details were invalid." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "The order details were invalid." }, { status: 400 });
  }

  const gift = typeof body.packageSlug === "string"
    ? getGiftPackage(body.packageSlug)
    : undefined;
  if (
    body.orderId !== requestId ||
    !gift ||
    !sources.includes(body.source) ||
    !isText(body.brief?.me, 500) ||
    !isText(body.brief?.them, 500) ||
    !isText(body.brief?.gift, 500) ||
    !isText(body.supplementalMaterials, 4000) ||
    !isText(body.personalMessage, 1000) ||
    typeof body.purchaserEmail !== "string" ||
    body.purchaserEmail.length > 254 ||
    !emailPattern.test(body.purchaserEmail) ||
    !isText(body.recipientName, 120) ||
    !isText(body.deliveryNotes, 1000) ||
    !isTextList(body.digitalFillings, digitalOptions) ||
    !isTextList(body.physicalFillings, physicalOptions) ||
    body.rightsConfirmed !== true ||
    body.privacyConsent !== true
  ) {
    return NextResponse.json(
      { error: "Please review the order details, material choices, and consent." },
      { status: 400 },
    );
  }

  const packageTable = renderOrder(body, gift.title);
  const textOrder = [
    `Reference: ${body.orderId}`,
    `Source: ${body.source}`,
    `Package: ${gift.title}`,
    `Digital fillings: ${body.digitalFillings.join(", ") || "None selected"}`,
    `Physical fillings: ${body.physicalFillings.join(", ") || "None selected"}`,
    `Gift Brief — Me: ${body.brief.me}`,
    `Gift Brief — Them: ${body.brief.them}`,
    `Gift Brief — The Gift: ${body.brief.gift}`,
    `Selected materials: ${body.supplementalMaterials || "None selected"}`,
    `Personal message: ${body.personalMessage || "None provided"}`,
    `Purchaser email: ${body.purchaserEmail}`,
    `Recipient name: ${body.recipientName || "Not provided"}`,
    `Delivery notes: ${body.deliveryNotes || "None provided"}`,
  ].join("\n\n");

  if (!apiKey || !from || !ordersEmail) {
    // Email disabled until custom domain is verified in Resend.
    console.info("KIN order received without email delivery:", {
      ...body,
      packageTitle: gift.title,
    });
    return NextResponse.json({ orderId: body.orderId });
  }

  const internalEmail = await sendEmail({
    apiKey,
    from,
    to: ordersEmail,
    replyTo: body.purchaserEmail,
    subject: `KIN order request ${body.orderId} — ${gift.title}`,
    html: `<h1>New KIN order request</h1>${packageTable}<p>Rights and privacy confirmations were accepted.</p>`,
    text: `New KIN order request\n\n${textOrder}\n\nRights and privacy confirmations were accepted.`,
    idempotencyKey: `${body.orderId}-kin`,
  });
  if (!internalEmail.ok) {
    return NextResponse.json(
      {
        error: `The order email could not be sent to KIN: ${internalEmail.message}`,
        orderId: body.orderId,
      },
      { status: 502 },
    );
  }

  const buyerEmail = await sendEmail({
    apiKey,
    from,
    to: body.purchaserEmail,
    subject: `Your KIN order request ${body.orderId}`,
    html: `<h1>Your order request is with KIN</h1><p>We received your request for ${escapeHtml(gift.title)}. No payment has been taken. KIN will follow up to confirm scope, price, and delivery details.</p>${packageTable}<p>Your submitted details are emailed to KIN and retained in our order inbox until staff delete them. They are used only to respond to and fulfill this request.</p>`,
    text: `Your order request is with KIN.\n\nWe received your request for ${gift.title}. No payment has been taken. KIN will follow up to confirm scope, price, and delivery details.\n\n${textOrder}\n\nYour submitted details are emailed to KIN and retained in our order inbox until staff delete them. They are used only to respond to and fulfill this request.`,
    idempotencyKey: `${body.orderId}-buyer`,
  });
  if (!buyerEmail.ok) {
    return NextResponse.json(
      {
        error:
          `KIN received the order request ${body.orderId}, but the buyer confirmation email could not be sent: ${buyerEmail.message}. Contact ${ordersEmail} and provide the order reference.`,
        orderId: body.orderId,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ orderId: body.orderId });
}
