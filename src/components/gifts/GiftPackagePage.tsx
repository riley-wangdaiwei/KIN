"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { GiftPackage } from "@/features/gifts/types";
import { supportingGifts } from "@/data/gifts";
import { storage } from "@/lib/storage";
import styles from "./gift-package.module.css";

interface GiftPackagePageProps {
  gift: GiftPackage;
}

export default function GiftPackagePage({ gift }: GiftPackagePageProps) {
  const [interestSaved, setInterestSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function registerInterest() {
    try {
      storage.saveGiftIntent({
        slug: gift.slug,
        createdAt: new Date().toISOString(),
      });
      setInterestSaved(true);
      setError(null);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Your preorder interest could not be saved.",
      );
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.wordmark} href="/" aria-label="KIN home">KIN</Link>
        <Link href="/gifts">GIFTS / CATALOG</Link>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroArt} aria-hidden="true">
          <span>{gift.heroMark}</span>
          <i />
          <small>{gift.category.replace("-", " / ")}</small>
        </div>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>{gift.eyebrow}</span>
          <h1>{gift.title}</h1>
          <p className={styles.summary}>{gift.summary}</p>
          <div className={styles.heroActions}>
            {gift.slug === "conversation-recap" ? (
              <>
                <Link
                  className={styles.primary}
                  href="/order?package=conversation-recap&source=gift-page"
                >
                  Start a Gift Brief →
                </Link>
                <Link
                  className={styles.secondary}
                  href="/order?package=conversation-recap&source=gift-page"
                >
                  Start order →
                </Link>
              </>
            ) : gift.action === "start-brief" ? (
              <Link
                className={styles.primary}
                href={`/order?package=conversation-recap&source=gift-page&filling=${gift.category === "supporting-gift" ? "digital" : ""}`}
              >
                {gift.actionLabel} →
              </Link>
            ) : gift.action === "artist-inquiry" ? (
              <Link className={styles.primary} href="/artists">
                {gift.actionLabel} →
              </Link>
            ) : gift.action === "preorder-intent" ? (
              <a className={styles.primary} href="#preorder">
                Preorder / register interest →
              </a>
            ) : (
              <button className={styles.primary} type="button" onClick={registerInterest}>
                {interestSaved ? "Interest noted ✓" : gift.actionLabel}
              </button>
            )}
            <Link
              className={styles.secondary}
              href={`/order?package=${gift.category === "supporting-gift" ? "conversation-recap" : gift.slug}&source=gift-page`}
            >
              Start an order
            </Link>
          </div>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <span className={styles.price}>{gift.priceAndAvailability}</span>
        </div>
      </section>

      <section className={styles.introduction}>
        <div>
          <span className={styles.kicker}>THE SCENE</span>
          <h2>A gift that begins with a point of view.</h2>
        </div>
        <p>{gift.introduction}</p>
      </section>
      <section className={styles.example}>
        <span className={styles.kicker}>A POSSIBLE STORY / 01</span>
        <p>{gift.example}</p>
      </section>

      <div className={styles.template}>
        <PackageSection number="01" title="Hero Gift">
          <p>{gift.heroGift}</p>
        </PackageSection>
        <PackageSection number="02" title="Fillings">
          <ul>{gift.fillings.map((item) => <li key={item}>{item}</li>)}</ul>
          {gift.category === "supporting-gift" && (
            <div className={styles.fillingGrid}>
              {supportingGifts.map((item) => (
                <article key={item.title}>
                  <span>{item.kind.toUpperCase()}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          )}
        </PackageSection>
        <PackageSection number="03" title="Personal Message">
          <p>{gift.personalMessage}</p>
        </PackageSection>
        <PackageSection number="04" title="README Guide">
          <ul>{gift.readmeGuide.map((item) => <li key={item}>{item}</li>)}</ul>
        </PackageSection>
        <PackageSection number="05" title="Artist's Process Note">
          <p>{gift.artistProcessNote}</p>
        </PackageSection>
      </div>

      <section className={styles.details}>
        <header>
          <span className={styles.kicker}>THE DETAILS</span>
          <h2>What to expect.</h2>
        </header>
        <div className={styles.detailColumns}>
          <DetailList title="Good for" items={gift.occasions} />
          <DetailList title="Included" items={gift.included} />
          <DetailList title="You provide" items={gift.provide} />
          <DetailList title="How it works" items={gift.process} />
          <DetailList title="Make it yours" items={gift.customization} />
          <DetailList title="Delivery timing" items={[gift.deliveryTime]} />
          <DetailList title="Usage & rights" items={[gift.usageScope]} />
        </div>
      </section>

      {gift.slug === "conversation-recap" ? (
        <section className={styles.orderPanel}>
          <div>
            <span className={styles.kicker}>READY WHEN YOU ARE</span>
            <h2>Begin with the things you know.</h2>
            <p>
              Your board curation will travel with you. Review your brief, add
              your message. This MVP submits an order request by email, without
              collecting payment; KIN will confirm price and timing before
              accepting the commission.
            </p>
          </div>
          <div className={styles.orderActions}>
            <Link
              className={styles.primary}
              href={`/order?package=${gift.slug}&source=gift-page`}
            >
              Start a Gift Brief →
            </Link>
            <Link
              className={styles.secondary}
              href="/order?package=conversation-recap&source=gift-page"
            >
              Continue order →
            </Link>
          </div>
        </section>
      ) : (
        <section className={styles.orderPanel} id="preorder">
          <div>
            <span className={styles.kicker}>PREORDER / INTENT</span>
            <h2>Help shape what comes next.</h2>
            <p>
              This is a concept preview. Registering interest is saved only in
              this browser; it does not contact KIN, reserve a package, or
              create an order.
            </p>
          </div>
          {gift.action === "preorder-intent" ? (
            <button className={styles.primary} type="button" onClick={registerInterest}>
              {interestSaved ? "Interest noted ✓" : gift.actionLabel}
            </button>
          ) : gift.action === "artist-inquiry" ? (
            <Link className={styles.primary} href="/artists">
              {gift.actionLabel} →
            </Link>
          ) : (
            <Link
              className={styles.primary}
              href={`/order?package=conversation-recap&source=gift-page&filling=digital`}
            >
              {gift.actionLabel} →
            </Link>
          )}
          {interestSaved && (
            <p className={styles.notice} role="status">
              Interest is noted in this browser only; it is not a reservation.
            </p>
          )}
        </section>
      )}

      <footer className={styles.footer}>
        <Link href="/gifts">← Back to all gifts</Link>
        <Link href="/">Return to your board</Link>
      </footer>
    </main>
  );
}

function PackageSection({
  children,
  number,
  title,
}: {
  children: ReactNode;
  number: string;
  title: string;
}) {
  return (
    <section className={styles.packageSection}>
      <span className={styles.packageNumber}>{number} / 05</span>
      <h2>{title}</h2>
      <div className={styles.packageContent}>{children}</div>
    </section>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className={styles.detailList}>
      <h3>{title}</h3>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </section>
  );
}
