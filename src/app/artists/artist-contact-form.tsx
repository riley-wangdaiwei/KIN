"use client";

import { useState, type FormEvent } from "react";
import styles from "./page.module.css";

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

export default function ArtistContactForm() {
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setSending(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const inquiry = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/artist-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inquiry),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus(result.error ?? "We could not send your message. Please try again.");
        return;
      }

      form.reset();
      setStatus("We'll be in touch soon.");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "We could not send your message. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <form className={styles.contactForm} onSubmit={handleSubmit}>
      <label className={styles.textField}>
        Your name
        <input autoComplete="name" maxLength={120} name="name" />
      </label>

      <fieldset className={styles.choiceField}>
        <legend>I am a…</legend>
        {roles.map((role) => (
          <label className={styles.choice} key={role}>
            <input name="role" required type="radio" value={role} />
            <span>{role}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className={styles.choiceField}>
        <legend>I am interested in…</legend>
        {interests.map((interest) => (
          <label className={styles.choice} key={interest}>
            <input name="interest" required type="radio" value={interest} />
            <span>{interest}</span>
          </label>
        ))}
      </fieldset>

      <label className={styles.textField}>
        Your website or portfolio <span>(optional)</span>
        <input
          autoComplete="url"
          maxLength={2048}
          name="website"
          placeholder="https://"
          type="url"
        />
      </label>

      <label className={styles.textField}>
        Your email
        <input
          autoComplete="email"
          maxLength={254}
          name="email"
          required
          type="email"
        />
      </label>

      <label className={styles.textField}>
        A little more <span>(optional)</span>
        <textarea maxLength={2000} name="message" rows={3} />
      </label>

      <button
        className={`${styles.submitButton} kin-glass-hover`}
        disabled={sending}
        type="submit"
      >
        {sending ? "Sending…" : "Send"}
      </button>
      <p aria-live="polite" className={styles.confirmation} role="status">
        {status}
      </p>
    </form>
  );
}
