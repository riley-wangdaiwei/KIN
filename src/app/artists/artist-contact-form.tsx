"use client";

import { useState, type FormEvent } from "react";
import styles from "./page.module.css";

export default function ArtistContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <form className={styles.contactForm} onSubmit={handleSubmit}>
      <label className={styles.visuallyHidden} htmlFor="artist-contact-email">
        Your email
      </label>
      <input
        autoComplete="email"
        className={styles.emailInput}
        id="artist-contact-email"
        name="email"
        placeholder="Your email"
        required
        type="email"
      />
      <button className={styles.submitButton} type="submit">
        Contact us
      </button>
      <span aria-live="polite" className={styles.confirmation}>
        {submitted ? "Thanks. We’ll be in touch." : ""}
      </span>
    </form>
  );
}
