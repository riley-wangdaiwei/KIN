"use client";

import { useEffect, useState } from "react";
import { getCanvasUser, subscribeToCanvasAuth } from "@/lib/storage/canvas-adapter";
import styles from "./identity-questionnaire.module.css";
import SiteArrow from "@/components/site/SiteArrow";

type Question = {
  name: string;
  question: string;
  options: string[];
};

const questions: Question[] = [
  { name: "recipient", question: "Who is it for?", options: ["A friend", "A partner", "A family member", "Someone else"] },
  { name: "occasion", question: "What is the occasion?", options: ["A birthday", "A milestone", "Just because", "Another occasion"] },
  { name: "something-special", question: "What is something special about them?", options: ["The little things they notice", "Their unusual interests", "A memory we share", "Something hard to put into words"] },
  { name: "budget", question: "What budget feels right?", options: ["Under $50", "$50–100", "$100–250", "$250+"] },
  { name: "timeline", question: "When do you need the gift?", options: ["As soon as possible", "Within a month", "In 1–3 months", "I’m flexible"] },
];

export default function IdentityQuestionnaire() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [otherOpen, setOtherOpen] = useState<Record<string, boolean>>({});
  const [otherText, setOtherText] = useState<Record<string, string>>({});
  const [loginEmail, setLoginEmail] = useState<string | null>(null);
  const [emailChoice, setEmailChoice] = useState<"login" | "other" | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendState, setSendState] = useState<"idle" | "sent" | "error">("idle");
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeToCanvasAuth((user) => {
      if (active) setLoginEmail(user?.email ?? null);
    });
    void getCanvasUser()
      .then((user) => {
        if (active) setLoginEmail(user?.email ?? null);
      })
      .catch(() => {});
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const emailAnswer = loginEmail
    ? emailChoice === "login"
      ? loginEmail
      : emailChoice === "other"
        ? emailInput.trim()
        : ""
    : emailInput.trim();
  const complete =
    questions.every(({ name }) => Boolean(answers[name]?.trim())) &&
    Boolean(emailAnswer);

  function selectOption(name: string, option: string) {
    setOtherOpen((current) => ({ ...current, [name]: false }));
    setAnswers((current) => ({ ...current, [name]: option }));
  }

  function selectOther(name: string) {
    setOtherOpen((current) => ({ ...current, [name]: true }));
    setAnswers((current) => ({ ...current, [name]: otherText[name] ?? "" }));
  }

  function changeOther(name: string, value: string) {
    setOtherText((current) => ({ ...current, [name]: value }));
    setAnswers((current) => ({ ...current, [name]: value }));
  }

  async function sendAnswers() {
    if (!complete || sending) return;
    setSending(true);
    setSendError("");
    setSendState("idle");
    try {
      const response = await fetch("/api/gifting-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: { ...answers, email: emailAnswer } }),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(result?.error ?? "We could not send your answers. Please try again.");
      }
      setSendState("sent");
    } catch (error) {
      setSendError(
        error instanceof Error
          ? error.message
          : "We could not send your answers. Please try again.",
      );
      setSendState("error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={styles.form}>
      {questions.map(({ name, question, options }, index) => (
        <fieldset className={styles.question} key={name}>
          <legend><span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>{question}</legend>
          <div className={styles.options}>
            {options.map((option) => (
              <button
                aria-pressed={answers[name] === option && !otherOpen[name]}
                className={`${styles.option} ${answers[name] === option && !otherOpen[name] ? styles.selected : ""}`}
                key={option}
                onClick={() => selectOption(name, option)}
                type="button"
              >
                {option}
              </button>
            ))}
            <button
              aria-pressed={Boolean(otherOpen[name])}
              className={`${styles.option} ${otherOpen[name] ? styles.selected : ""}`}
              onClick={() => selectOther(name)}
              type="button"
            >
              Other
            </button>
          </div>
          {otherOpen[name] && (
            <input
              aria-label={`${question} — other`}
              className={styles.otherInput}
              maxLength={200}
              onChange={(event) => changeOther(name, event.target.value)}
              placeholder="Tell us in your own words"
              value={otherText[name] ?? ""}
            />
          )}
        </fieldset>
      ))}
      <fieldset className={styles.question}>
        <legend><span className={styles.number}>06</span>Your contact email</legend>
        {loginEmail && (
          <div className={styles.options}>
            <button
              aria-pressed={emailChoice === "login"}
              className={`${styles.option} ${emailChoice === "login" ? styles.selected : ""}`}
              onClick={() => setEmailChoice("login")}
              type="button"
            >
              Same as my login email
            </button>
            <button
              aria-pressed={emailChoice === "other"}
              className={`${styles.option} ${emailChoice === "other" ? styles.selected : ""}`}
              onClick={() => setEmailChoice("other")}
              type="button"
            >
              Use a different email
            </button>
          </div>
        )}
        {(emailChoice === "other" || !loginEmail) && (
          <input
            aria-label="Your contact email"
            className={styles.otherInput}
            maxLength={254}
            onChange={(event) => setEmailInput(event.target.value)}
            placeholder="Your email"
            type="email"
            value={emailInput}
          />
        )}
        {loginEmail && emailChoice === "login" && (
          <p className={styles.emailNote}>{loginEmail}</p>
        )}
      </fieldset>
      {complete && (
        <div className={styles.share} aria-live="polite">
          <h2>share your idea</h2>
          {sendState === "sent" ? (
            <p className={styles.sent}>Sent — we&rsquo;ll be in touch soon.</p>
          ) : (
            <>
              <button className={styles.submit} disabled={sending} onClick={() => void sendAnswers()} type="button">
                {sending ? "Sending…" : <>Send us an email <SiteArrow /></>}
              </button>
              {sendState === "error" && sendError && (
                <p className={styles.error} role="alert">{sendError}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
