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
      <fieldset className={styles.roleField}>
        <legend className={styles.roleLegend}>I am a…</legend>
        <div className={styles.roleOptions}>
          {[
            "Artist",
            "Florist",
            "Bookstore",
            "Corporate / business",
            "Other",
          ].map((role) => (
            <label className={styles.roleChip} key={role}>
              <input
                className={styles.roleRadio}
                name="role"
                required
                type="radio"
                value={role}
              />
              {role}
            </label>
          ))}
        </div>
      </fieldset>
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
