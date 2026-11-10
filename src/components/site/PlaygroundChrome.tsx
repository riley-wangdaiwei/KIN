"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import styles from "./playground-chrome.module.css";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
  { href: "/artist-terms", label: "Artist Terms" },
  { href: "/contact", label: "Contact" },
  { href: "/partner-with-kin", label: "Partner with KIN" },
];

export default function PlaygroundChrome() {
  const loginButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      setStatus("Email sign-in is not configured yet. Please try again later.");
      return;
    }

    setSending(true);
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
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

  return (
    <>
      <header className={styles.header}>
        <Link className={styles.logo} href="/" aria-label="re.KIN home">
          <Image
            src="/rekin-hero/rekin-logo.png"
            alt=""
            fill
            priority
            sizes="140px"
          />
        </Link>
        <Link
          className={styles.meeting}
          href="/my-gifting-identity#start-a-project"
        >
          book a free curation meeting
        </Link>
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
      </header>

      <nav aria-label="Footer navigation" className={styles.footer}>
        {footerLinks.map((link) => (
          <Link href={link.href} key={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>

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
