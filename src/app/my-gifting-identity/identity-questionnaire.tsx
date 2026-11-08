"use client";

import { useState } from "react";
import styles from "./identity-questionnaire.module.css";

const questions = [
  { name: "recipient", question: "Who is it for?", options: ["A friend", "A partner", "A family member", "Someone else"] },
  { name: "occasion", question: "What is the occasion?", options: ["A birthday", "A milestone", "Just because", "Another occasion"] },
  { name: "something-special", question: "What is something special about them?", options: ["The little things they notice", "Their unusual interests", "A memory we share", "Something hard to put into words"] },
  { name: "budget", question: "What budget feels right?", options: ["Under $50", "$50–100", "$100–250", "$250+"] },
  { name: "timeline", question: "When do you need the gift?", options: ["As soon as possible", "Within a month", "In 1–3 months", "I’m flexible"] },
  { name: "email", question: "Your contact email", options: ["I’ll share it in our meeting", "Use the email I contacted you from", "I’ll send it later", "Prefer not to say"] },
];

export default function IdentityQuestionnaire() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const complete = questions.every(({ name }) => Boolean(answers[name]));

  return (
    <div className={styles.form}>
      {questions.map(({ name, question, options }, index) => (
        <fieldset className={styles.question} key={name}>
          <legend><span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>{question}</legend>
          <div className={styles.options}>
            {options.map((option) => (
              <button
                aria-pressed={answers[name] === option}
                className={`${styles.option} ${answers[name] === option ? styles.selected : ""}`}
                key={option}
                onClick={() => setAnswers((current) => ({ ...current, [name]: option }))}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      {complete && (
        <div className={styles.share} aria-live="polite">
          <h2>share your idea</h2>
          <button className={styles.submit} disabled type="button">Send us an email <span aria-hidden="true">→</span></button>
        </div>
      )}
    </div>
  );
}
