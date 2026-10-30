"use client";

import { useState, type FormEvent } from "react";
import styles from "./identity-questionnaire.module.css";

export default function IdentityQuestionnaire() {
  const [submitted, setSubmitted] = useState(false);

  function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className={styles.confirmation} role="status">
        <h2>Thank you for sharing.</h2>
        <p>
          This form is a prototype. Your details have not been sent; email
          follow-up will be connected later.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submitProject}>
      <label className={styles.field}>
        <span>Who is it for?</span>
        <input autoComplete="name" name="recipient" required />
      </label>

      <label className={styles.field}>
        <span>What is the occasion?</span>
        <input name="occasion" required />
      </label>

      <label className={styles.field}>
        <span>What is something special about them?</span>
        <textarea name="something-special" required rows={3} />
      </label>

      <div className={styles.fieldGroup}>
        <label className={styles.field}>
          <span>Budget</span>
          <input name="budget" required />
        </label>
        <label className={styles.field}>
          <span>Timeline</span>
          <input name="timeline" required />
        </label>
      </div>

      <label className={styles.field}>
        <span>Your contact email</span>
        <input autoComplete="email" name="email" required type="email" />
      </label>

      <button className={styles.submit} type="submit">
        share your project <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
