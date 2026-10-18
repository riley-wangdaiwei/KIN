"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import type { GiftBrief } from "@/features/brief/types";
import { isGiftBriefThin } from "@/features/orders/service";
import type {
  BoardOrderMaterial,
  GiftOrderRequest,
  GiftOrderResponse,
  OrderSource,
} from "@/features/orders/types";
import type { GiftPackage } from "@/features/gifts/types";
import { supportingGifts } from "@/data/gifts";
import { normalizeTasteTags, normalizeWorld } from "@/features/world/service";
import { storage } from "@/lib/storage";
import styles from "./order-flow.module.css";

interface OrderFlowProps {
  packages: GiftPackage[];
  initialPackage?: string;
  source?: string;
  initialFilling?: string;
  flowerPartnerUrl?: string;
}

const steps = [
  "Gift Brief",
  "Choose Package",
  "Personal Message",
  "Materials + Consent",
  "Contact + Delivery",
  "Confirmation",
] as const;

const digitalOptions = supportingGifts
  .filter((item) => item.kind === "digital" || item.kind === "licensed")
  .map((item) => item.title);

const physicalOptions = supportingGifts
  .filter((item) => item.kind === "physical")
  .map((item) => item.title);

function createOrderId(): string {
  return crypto.randomUUID();
}

function normalizeSource(source: string | undefined): OrderSource {
  if (source === "partner") return "partner";
  if (source === "gift-page") return "gift-page";
  return "board";
}

export default function OrderFlow({
  flowerPartnerUrl,
  initialFilling,
  initialPackage,
  packages,
  source,
}: OrderFlowProps) {
  const [step, setStep] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [brief, setBrief] = useState<GiftBrief>({
    me: "",
    them: "",
    gift: "",
  });
  const [boardMaterials, setBoardMaterials] = useState<BoardOrderMaterial[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [supplementalMaterials, setSupplementalMaterials] = useState("");
  const [packageSlug, setPackageSlug] = useState(
    packages.some((gift) => gift.slug === initialPackage)
      ? initialPackage!
      : "conversation-recap",
  );
  const [digitalFillings, setDigitalFillings] = useState<string[]>(
    initialFilling === "digital" ? ["Digital cards"] : [],
  );
  const [physicalFillings, setPhysicalFillings] = useState<string[]>(
    initialFilling === "flowers" ? ["Flowers & physical gifts"] : [],
  );
  const [personalMessage, setPersonalMessage] = useState("");
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [orderId, setOrderId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentPackage = packages.find((gift) => gift.slug === packageSlug);
  const briefIsThin = isGiftBriefThin(brief);
  const selectedBoardItems = useMemo(
    () => boardMaterials.filter((material) => selectedMaterials.includes(material.id)),
    [boardMaterials, selectedMaterials],
  );

  useEffect(() => {
    try {
      /* eslint-disable react-hooks/set-state-in-effect */
      const savedBrief = storage.getGiftBrief();
      setBrief({
        me: typeof savedBrief?.me === "string" ? savedBrief.me : "",
        them: typeof savedBrief?.them === "string" ? savedBrief.them : "",
        gift: typeof savedBrief?.gift === "string" ? savedBrief.gift : "",
      });
      const tags = normalizeTasteTags(storage.getTaste()?.tags).map((tag) => ({
        id: tag.id,
        kind: "label" as const,
        title: tag.label,
      }));
      const world = normalizeWorld(storage.getWorld());
      const frames = world.frames.map((frame) => ({
        id: frame.id,
        kind: "frame" as const,
        title: frame.title,
      }));
      setBoardMaterials([...tags, ...frames]);
      setOrderId(createOrderId());
      setIsReady(true);
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Your board materials could not be loaded.",
      );
    }
  }, []);

  function toggleString(
    value: string,
    values: string[],
    setter: (next: string[]) => void,
  ) {
    setter(
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
    );
  }

  function toggleMaterial(id: string) {
    setSelectedMaterials((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function continueFromBrief() {
    setStep(1);
  }

  function next() {
    setError(null);
    if (step === 0) {
      continueFromBrief();
      return;
    }
    if (step === 3 && (!rightsConfirmed || !privacyConsent)) {
      setError("Please confirm materials rights and review the order privacy notice.");
      return;
    }
    if (step === 4) {
      if (!purchaserEmail.trim()) {
        setError("Enter an email address for order confirmation.");
        return;
      }
      submitOrder();
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function submitOrder() {
    if (!currentPackage) {
      setError("Choose a package before submitting your order.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const selectedMaterialText = selectedBoardItems
      .map((material) => `${material.kind}: ${material.title}`)
      .join("\n");
    const fullMaterials = [selectedMaterialText, supplementalMaterials.trim()]
      .filter(Boolean)
      .join("\n");
    const body: GiftOrderRequest = {
      orderId,
      source: normalizeSource(source),
      packageSlug: currentPackage.slug,
      digitalFillings,
      physicalFillings,
      brief,
      supplementalMaterials: fullMaterials,
      personalMessage: personalMessage.trim(),
      purchaserEmail: purchaserEmail.trim(),
      recipientName: recipientName.trim(),
      deliveryNotes: deliveryNotes.trim(),
      rightsConfirmed,
      privacyConsent,
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": orderId,
        },
        body: JSON.stringify(body),
      });
      const result: GiftOrderResponse = await response.json();
      if (!response.ok || !result.orderId) {
        throw new Error(result.error ?? "Your order could not be submitted.");
      }
      setSubmitted(true);
      setOrderId(result.orderId);
      setStep(5);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Your order could not be submitted.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function renderBriefStep() {
    return (
      <>
        <p className={styles.lead}>
          We brought your board curation with us. Nothing here needs to be
          retyped.
        </p>
        <div className={styles.briefGrid}>
          {(["me", "them", "gift"] as const).map((field) => (
            <section className={styles.briefCard} key={field}>
              <h3>{field === "gift" ? "The Gift" : field[0].toUpperCase() + field.slice(1)}</h3>
              <p>{brief[field] || "Still taking shape."}</p>
            </section>
          ))}
        </div>
        {briefIsThin && (
          <section className={styles.thinBrief}>
            <span className={styles.eyebrow}>A LITTLE MORE CONTEXT CAN HELP</span>
            <p>
              Your brief is just getting started. Choose details from your
              existing board below, or add one short thought. You can continue
              without adding anything.
            </p>
            {boardMaterials.length > 0 && (
              <div className={styles.materialChoices}>
                {boardMaterials.map((material) => (
                  <CheckOption
                    key={`${material.kind}-${material.id}`}
                    checked={selectedMaterials.includes(material.id)}
                    label={`${material.kind}: ${material.title}`}
                    onChange={() => toggleMaterial(material.id)}
                  />
                ))}
              </div>
            )}
            <label className={styles.field}>
              Add a detail (optional)
              <textarea
                value={supplementalMaterials}
                onChange={(event) => setSupplementalMaterials(event.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="A memory, habit, or detail that helps the artist understand"
              />
            </label>
          </section>
        )}
      </>
    );
  }

  function renderPackageStep() {
    return (
      <>
        <p className={styles.lead}>Choose a hero gift, then add the details that belong with it.</p>
        <label className={styles.field}>
          Hero Gift
          <select
            value={packageSlug}
            onChange={(event) => setPackageSlug(event.target.value)}
          >
            {packages
              .filter((gift) => gift.category !== "supporting-gift")
              .map((gift) => (
                <option value={gift.slug} key={gift.slug}>
                  {gift.title}
                </option>
              ))}
          </select>
        </label>
        {currentPackage && (
          <section className={styles.packageSummary}>
            <h3>{currentPackage.title}</h3>
            <p>{currentPackage.heroGift}</p>
            <ul>
              {currentPackage.included.slice(0, 4).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <span>{currentPackage.priceAndAvailability}</span>
          </section>
        )}
        <fieldset className={styles.choiceFieldset}>
          <legend>Digital Fillings / optional</legend>
          {digitalOptions.map((item) => (
            <CheckOption
              key={item}
              checked={digitalFillings.includes(item)}
              label={item}
              onChange={() =>
                toggleString(item, digitalFillings, setDigitalFillings)
              }
            />
          ))}
        </fieldset>
        <fieldset className={styles.choiceFieldset}>
          <legend>Physical Fillings / optional</legend>
          {physicalOptions.map((item) => (
            <CheckOption
              key={item}
              checked={physicalFillings.includes(item)}
              label={`${item} — partner fulfillment`}
              onChange={() =>
                toggleString(item, physicalFillings, setPhysicalFillings)
              }
            />
          ))}
          {physicalFillings.length > 0 && (
            <p className={styles.partnerNote}>
              Physical fillings are arranged and fulfilled by the partner, not
              KIN. Their checkout, shipping, and returns terms apply.
            </p>
          )}
          {flowerPartnerUrl ? (
            <a
              className={styles.partnerLink}
              href={flowerPartnerUrl}
              target="_blank"
              rel="noreferrer"
            >
              Explore flowers with our partner ↗
            </a>
          ) : (
            <p className={styles.partnerNote}>
              Flower partner link is not configured yet. Select flowers here
              to include the request; KIN will confirm partner availability
              separately.
            </p>
          )}
        </fieldset>
      </>
    );
  }

  function renderMessageStep() {
    return (
      <>
        <p className={styles.lead}>
          This message goes with the gift. Write in your own voice; it can be
          refined with the maker before production.
        </p>
        <label className={styles.field}>
          Personal Message
          <textarea
            value={personalMessage}
            onChange={(event) => setPersonalMessage(event.target.value)}
            maxLength={1000}
            rows={6}
            placeholder="I wanted to gather these little things because…"
          />
          <span>{personalMessage.length} / 1000 characters</span>
        </label>
      </>
    );
  }

  function renderConsentStep() {
    return (
      <>
        <p className={styles.lead}>
          Your board stays private. Only the order details and materials you
          select here are sent to KIN for this request.
        </p>
        <div className={styles.privacyNotice}>
          <h3>Materials, email & privacy</h3>
          <ul>
            <li>
              Your order, contact email, selected brief, message, and chosen
              materials are emailed to KIN and copied to you for order
              confirmation.
            </li>
            <li>
              The email provider processes those messages. KIN&apos;s order
              inbox retains them until staff delete them; this MVP has no
              automatic deletion or separate order database.
            </li>
            <li>
              Materials are used to assess and fulfill this order. They are not
              published or shared with an artist or partner unless you approve
              that sharing separately.
            </li>
            <li>
              Submit only material you created or have permission to share.
              Get permission from people pictured or quoted when appropriate.
            </li>
            <li>
              Physical products are ordered from the partner separately.
              KIN does not receive or process the partner&apos;s payment,
              shipping address, or return request.
            </li>
          </ul>
        </div>
        {boardMaterials.length > 0 && (
          <fieldset className={styles.choiceFieldset}>
            <legend>Select board materials for the maker</legend>
            {boardMaterials.map((material) => (
              <CheckOption
                key={`consent-${material.kind}-${material.id}`}
                checked={selectedMaterials.includes(material.id)}
                label={`${material.kind}: ${material.title}`}
                onChange={() => toggleMaterial(material.id)}
              />
            ))}
          </fieldset>
        )}
        <CheckOption
          checked={rightsConfirmed}
          label="I have the rights and permissions needed for the materials I selected."
          onChange={() => setRightsConfirmed((current) => !current)}
        />
        <CheckOption
          checked={privacyConsent}
          label="I understand my order details and selected materials will be emailed to KIN and to me, as described above."
          onChange={() => setPrivacyConsent((current) => !current)}
        />
      </>
    );
  }

  function renderContactStep() {
    return (
      <>
        <p className={styles.lead}>
          We&apos;ll email your order summary and confirm next steps. No payment
          is collected in this MVP; KIN will confirm price, scope, and timing
          before accepting the commission.
        </p>
        <label className={styles.field}>
          Your email
          <input
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={purchaserEmail}
            onChange={(event) => setPurchaserEmail(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          Recipient name (optional)
          <input
            type="text"
            autoComplete="off"
            maxLength={120}
            value={recipientName}
            onChange={(event) => setRecipientName(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          Delivery notes (optional)
          <textarea
            value={deliveryNotes}
            onChange={(event) => setDeliveryNotes(event.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Digital delivery preferences or timing notes"
          />
          <span>
            Do not enter a street address for partner physical items. The
            partner collects shipping details on its own site.
          </span>
        </label>
      </>
    );
  }

  function renderConfirmation() {
    return (
      <section className={styles.confirmation} role="status">
        <span className={styles.eyebrow}>ORDER REQUEST / SENT</span>
        <h3>Thank you. Your order is with KIN.</h3>
        <p>
          We sent the order details to KIN and a confirmation to{" "}
          <strong>{purchaserEmail}</strong>. No payment has been taken. KIN
          will follow up to confirm price, creative scope, and delivery timing.
        </p>
        <p className={styles.orderNumber}>REFERENCE / {orderId}</p>
        <Link className={styles.secondaryAction} href="/gifts">
          Return to Gifts
        </Link>
        <Link className={styles.textLink} href="/">
          Keep Collecting
        </Link>
      </section>
    );
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    next();
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.wordmark} href="/" aria-label="KIN home">KIN</Link>
        <span>ORDER / {normalizeSource(source).toUpperCase()}</span>
      </header>
      <section className={styles.layout}>
        <aside className={styles.sidebar}>
          <span className={styles.eyebrow}>GIFT / ORDER</span>
          <h1>Make it particular.</h1>
          <p>
            One order flow for your board, a gift page, or a partner invitation.
          </p>
          <ol className={styles.stepList}>
            {steps.map((label, index) => (
              <li
                key={label}
                className={index === step ? styles.activeStep : undefined}
                aria-current={index === step ? "step" : undefined}
              >
                <span>0{index + 1}</span>
                {label}
              </li>
            ))}
          </ol>
          {step > 0 && step < 5 && currentPackage && (
            <div className={styles.orderAside}>
              <span className={styles.eyebrow}>CURRENT PACKAGE</span>
              <strong>{currentPackage.title}</strong>
            </div>
          )}
        </aside>
        <section className={styles.formPanel}>
          {!isReady ? (
            <p className={styles.lead}>Bringing your board together…</p>
          ) : (
            <>
              <div className={styles.stepMeta}>
                <span>STEP 0{step + 1} / 06</span>
                <span>{steps[step]}</span>
              </div>
              {error && <p className={styles.error} role="alert">{error}</p>}
              {step === 5 ? (
                submitted ? (
                  renderConfirmation()
                ) : (
                  <p className={styles.error} role="alert">
                    Your confirmation is unavailable because the order was not submitted.
                  </p>
                )
              ) : (
                <form onSubmit={submitForm}>
                  <h2>{steps[step]}</h2>
                  {step === 0 && renderBriefStep()}
                  {step === 1 && renderPackageStep()}
                  {step === 2 && renderMessageStep()}
                  {step === 3 && renderConsentStep()}
                  {step === 4 && renderContactStep()}
                  <div className={styles.formActions}>
                    {step > 0 ? (
                      <button
                        className={styles.back}
                        type="button"
                        onClick={() => {
                          setError(null);
                          setStep((current) => current - 1);
                        }}
                      >
                        ← Back
                      </button>
                    ) : (
                      <Link className={styles.backLink} href="/">
                        ← Return to board
                      </Link>
                    )}
                    <button
                      className={styles.next}
                      type="submit"
                      disabled={submitting || (step === 3 && (!rightsConfirmed || !privacyConsent))}
                    >
                      {submitting
                        ? "Sending order…"
                        : step === 4
                          ? "Send order request →"
                          : "Continue →"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </section>
      </section>
      <footer className={styles.footer}>
        <Link href="/gifts">← Back to Gifts</Link>
        <span>NO PAYMENT IS COLLECTED IN THIS MVP</span>
      </footer>
    </main>
  );
}

function CheckOption({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className={styles.checkOption}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}
