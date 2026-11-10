"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import styles from "./playground-chrome.module.css";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
  { href: "/artist-terms", label: "Artist Terms" },
  { href: "/contact", label: "Contact" },
  { href: "/partner-with-kin", label: "Partner with re.KIN" },
];

export default function PlaygroundChrome({
  overlaysOnly = false,
}: {
  overlaysOnly?: boolean;
}) {
  const loginButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const bookingButtonRef = useRef<HTMLButtonElement>(null);
  const bookingDialogRef = useRef<HTMLElement>(null);
  const bookingReturnFocusRef = useRef<HTMLElement | null>(null);
  const bookingWasOpen = useRef(false);
  const wasOpen = useRef(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    function openLogin() {
      setStatus("");
      setLoginOpen(true);
    }

    function openBooking() {
      const activeElement = document.activeElement;
      bookingReturnFocusRef.current =
        activeElement instanceof HTMLElement ? activeElement : null;
      setBookingOpen(true);
    }

    window.addEventListener("rekin:open-login", openLogin);
    window.addEventListener("rekin:open-booking", openBooking);
    return () => {
      window.removeEventListener("rekin:open-login", openLogin);
      window.removeEventListener("rekin:open-booking", openBooking);
    };
  }, []);

  useEffect(() => {
    if (!loginOpen) {
      if (wasOpen.current) loginButtonRef.current?.focus();
      wasOpen.current = false;
      return;
    }

    wasOpen.current = true;
    const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled])',
    );
    dialogRef.current
      ?.querySelector<HTMLInputElement>("input:not([disabled])")
      ?.focus();

    function handleDialogKeys(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLoginOpen(false);
        return;
      }

      if (event.key !== "Tab" || !focusableElements?.length) return;
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleDialogKeys);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleDialogKeys);
      document.body.style.overflow = previousOverflow;
    };
  }, [loginOpen]);

  async function sendLoginLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setStatus("Email sign-in is not configured yet. Please try again later.");
      return;
    }

    setSending(true);
    try {
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
        },
      });

      if (error) {
        setStatus(error.message);
      } else {
        setStatus("Check your email for a secure sign-in link.");
      }
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "We could not send the sign-in link. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    if (!bookingOpen) {
      if (bookingWasOpen.current) {
        (bookingReturnFocusRef.current ?? bookingButtonRef.current)?.focus();
      }
      bookingReturnFocusRef.current = null;
      bookingWasOpen.current = false;
      return;
    }

    bookingWasOpen.current = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    bookingDialogRef.current?.querySelector("button")?.focus();

    const focusableElements = bookingDialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], iframe',
    );
    function handleBookingKeys(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setBookingOpen(false);
        return;
      }
      if (event.key !== "Tab" || !focusableElements?.length) return;
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleBookingKeys);
    return () => {
      window.removeEventListener("keydown", handleBookingKeys);
      document.body.style.overflow = previousOverflow;
    };
  }, [bookingOpen]);

  return (
    <>
      {!overlaysOnly && <header className={styles.header}>
        <Link className={styles.logo} href="/" aria-label="re.KIN home">
          <Image
            src="/rekin-hero/rekin-logo.png"
            alt=""
            fill
            priority
            sizes="140px"
          />
        </Link>
        <button
          className={`${styles.meeting} kin-glass-hover`}
          onClick={() => setBookingOpen(true)}
          ref={bookingButtonRef}
          type="button"
        >
          book a free curation meeting
        </button>
        <button
          className={styles.login}
          ref={loginButtonRef}
          onClick={() => {
            setStatus("");
            setLoginOpen(true);
          }}
          type="button"
        >
          login
        </button>
      </header>}

      {!overlaysOnly && <nav aria-label="Footer navigation" className={styles.footer}>
        {footerLinks.map((link) => (
          <Link href={link.href} key={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>}

      {bookingOpen && (
        <div
          className={styles.overlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setBookingOpen(false);
          }}
        >
          <section
            aria-label="Book a free curation meeting"
            aria-modal="true"
            className={`${styles.dialog} ${styles.bookingDialog}`}
            ref={bookingDialogRef}
            role="dialog"
          >
            <button
              aria-label="Close booking"
              className={styles.close}
              onClick={() => setBookingOpen(false)}
              type="button"
            >
              ×
            </button>
            <iframe
              className={styles.calFrame}
              src="https://cal.com/team.r3kin/30min?embed=true&theme=dark&layout=month_view"
              title="Book a free curation meeting with re.KIN"
            />
            <Link
              className={styles.canvasLink}
              href="/my-gifting-identity"
              onClick={() => setBookingOpen(false)}
            >
              Too shy to talk? Use your canvas instead.
            </Link>
          </section>
        </div>
      )}

      {loginOpen && (
        <div
          className={styles.overlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setLoginOpen(false);
          }}
        >
          <section
            aria-labelledby="login-title"
            aria-modal="true"
            className={styles.dialog}
            ref={dialogRef}
            role="dialog"
          >
            <button
              aria-label="Close login"
              className={styles.close}
              onClick={() => setLoginOpen(false)}
              type="button"
            >
              ×
            </button>
            <div className={styles.pot}>
              <Image
                src="/pot.jpg"
                alt=""
                fill
                sizes="(max-width: 700px) 94vw, 56rem"
              />
              <form className={styles.form} onSubmit={sendLoginLink}>
                <h2 id="login-title">Welcome back</h2>
                <label>
                  Name
                  <input
                    autoComplete="name"
                    autoFocus
                    onChange={(event) => setName(event.target.value)}
                    required
                    value={name}
                  />
                </label>
                <label>
                  Email
                  <input
                    autoComplete="email"
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    type="email"
                    value={email}
                  />
                </label>
                <button disabled={sending} type="submit">
                  {sending ? "sending…" : "email me a sign-in link"}
                </button>
                <p aria-live="polite" className={styles.status}>
                  {status}
                </p>
              </form>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
