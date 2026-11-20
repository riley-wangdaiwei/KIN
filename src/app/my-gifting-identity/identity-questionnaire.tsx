"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BookingTrigger from "@/components/site/BookingTrigger";
import SiteArrow from "@/components/site/SiteArrow";
import { computeResult, quizQuestions, resultTexts } from "@/features/quiz/quiz";
import styles from "./identity-questionnaire.module.css";

const totalSteps = quizQuestions.length + 1; // 7 questions + the email step
const emailPattern = /^\S+@\S+\.\S+$/;

export default function IdentityQuestionnaire() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [otherOpen, setOtherOpen] = useState<Record<string, boolean>>({});
  const [otherText, setOtherText] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phase, setPhase] = useState<"quiz" | "result">("quiz");
  const [resultId, setResultId] = useState<keyof typeof resultTexts | null>(null);
  const [energy, setEnergy] = useState<string | null>(null);
  const [sendState, setSendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [sendError, setSendError] = useState("");
  const [resultEmailed, setResultEmailed] = useState<boolean | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  function advanceAfterSelect() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    advanceTimer.current = setTimeout(
      () => setStep((current) => Math.min(current + 1, totalSteps - 1)),
      reducedMotion ? 0 : 350,
    );
  }

  function selectOption(questionId: string, option: string) {
    setOtherOpen((current) => ({ ...current, [questionId]: false }));
    setAnswers((current) => ({ ...current, [questionId]: option }));
    advanceAfterSelect();
  }

  function selectOther(questionId: string) {
    setOtherOpen((current) => ({ ...current, [questionId]: true }));
    setAnswers((current) => ({ ...current, [questionId]: otherText[questionId] ?? "" }));
  }

  function changeOther(questionId: string, value: string) {
    setOtherText((current) => ({ ...current, [questionId]: value }));
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  function continueFromOther(questionId: string) {
    if (!otherText[questionId]?.trim()) return;
    advanceAfterSelect();
  }

  function goBack() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setStep((current) => Math.max(current - 1, 0));
  }

  function startOver() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setAnswers({});
    setOtherOpen({});
    setOtherText({});
    setEmail("");
    setEmailError("");
    setResultId(null);
    setEnergy(null);
    setSendState("idle");
    setSendError("");
    setResultEmailed(null);
    setStep(0);
    setPhase("quiz");
  }

  async function submitQuiz(computed: { result: keyof typeof resultTexts; energy: string | null }) {
    setSendState("sending");
    setSendError("");
    try {
      const response = await fetch("/api/gifting-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: { ...answers, email: email.trim() },
          result: resultTexts[computed.result],
          energy: computed.energy,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        resultEmailed?: boolean;
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(data?.error ?? "We could not send your answers. Please try again.");
      }
      setResultEmailed(data?.resultEmailed ?? false);
      setSendState("sent");
    } catch (error) {
      setSendError(
        error instanceof Error
          ? error.message
          : "We could not send your answers. Please try again.",
      );
      setSendState("error");
    }
  }

  function seeResult() {
    if (!emailPattern.test(email.trim())) {
      setEmailError("That email doesn't look right — mind checking it?");
      return;
    }
    setEmailError("");
    const computed = computeResult(answers);
    setResultId(computed.result);
    setEnergy(computed.energy);
    setPhase("result");
    void submitQuiz(computed);
  }

  if (phase === "result" && resultId) {
    return (
      <div className={styles.result}>
        <div className={styles.resultCard}>
          <p className={styles.resultEyebrow}>your person&rsquo;s gift</p>
          <p className={styles.resultText}>{resultTexts[resultId]}</p>
          {energy && <p className={styles.resultEnergy}>{energy}</p>}
          <p className={styles.resultMark}>re.KIN</p>
        </div>
        {sendState === "error" && sendError && (
          <p className={styles.error} role="alert">
            {sendError}{" "}
            <button
              className={styles.retry}
              onClick={() => void submitQuiz({ result: resultId, energy })}
              type="button"
            >
              Try sending again
            </button>
          </p>
        )}
        {sendState === "sent" && resultEmailed === false && (
          <p className={styles.hint}>
            We couldn&rsquo;t email your result — this card is yours to keep.
          </p>
        )}
        <p className={styles.cta}>
          If you ever want to go further,{" "}
          <BookingTrigger className={`${styles.ctaButton} kin-glass-hover`}>
            Book a free curation meeting
          </BookingTrigger>{" "}
          with our artist to see how this could develop.
        </p>
        <p className={styles.ctaNote}>
          Our artist will have read your answers before you meet.
        </p>
        <p className={styles.canvasLink}>
          Not ready yet? Start a <Link href="/canvas">canvas</Link> for them.
        </p>
        <p className={styles.canvasNote}>
          Save the little things you notice over time. When you&rsquo;re
          ready, share it with us and we&rsquo;ll shape it into a gift.
        </p>
        <button className={styles.retake} onClick={startOver} type="button">
          take it again
        </button>
      </div>
    );
  }

  const question = quizQuestions[step];
  const isEmailStep = step === quizQuestions.length;

  return (
    <div className={styles.quiz}>
      <div
        aria-label={`Question ${step + 1} of ${totalSteps}`}
        aria-valuemax={totalSteps}
        aria-valuemin={1}
        aria-valuenow={step + 1}
        className={styles.progress}
        role="progressbar"
      >
        <span style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
      </div>
      <p className={styles.counter}>
        {String(step + 1).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
      </p>
      {step > 0 && (
        <button className={styles.back} onClick={goBack} type="button">
          <span className={styles.backArrow} aria-hidden="true">
            <SiteArrow />
          </span>
          back
        </button>
      )}
      {isEmailStep ? (
        <fieldset className={styles.question}>
          <legend>
            <span className={styles.number}>08</span>Where should we send your result?
          </legend>
          <input
            aria-label="Your email"
            className={styles.emailInput}
            maxLength={254}
            onChange={(event) => {
              setEmail(event.target.value);
              setEmailError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") seeResult();
            }}
            placeholder="Your email"
            type="email"
            value={email}
          />
          <button
            className={styles.submit}
            disabled={sendState === "sending"}
            onClick={seeResult}
            type="button"
          >
            See my result <SiteArrow />
          </button>
          {emailError && (
            <p className={styles.error} role="alert">
              {emailError}
            </p>
          )}
        </fieldset>
      ) : (
        <fieldset className={styles.question} key={question.id}>
          <legend>
            <span className={styles.number}>{String(step + 1).padStart(2, "0")}</span>
            {question.title}
          </legend>
          <div className={styles.options}>
            {question.options.map((option) => (
              <button
                aria-pressed={answers[question.id] === option && !otherOpen[question.id]}
                className={`${styles.option} ${
                  answers[question.id] === option && !otherOpen[question.id]
                    ? styles.selected
                    : ""
                }`}
                key={option}
                onClick={() => selectOption(question.id, option)}
                type="button"
              >
                {option}
              </button>
            ))}
            {question.hasOther && (
              <button
                aria-pressed={Boolean(otherOpen[question.id])}
                className={`${styles.option} ${otherOpen[question.id] ? styles.selected : ""}`}
                onClick={() => selectOther(question.id)}
                type="button"
              >
                Other
              </button>
            )}
          </div>
          {otherOpen[question.id] && (
            <div className={styles.otherRow}>
              <input
                aria-label={`${question.title} — other`}
                autoFocus
                className={styles.otherInput}
                maxLength={200}
                onChange={(event) => changeOther(question.id, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") continueFromOther(question.id);
                }}
                placeholder="Tell us in your own words"
                value={otherText[question.id] ?? ""}
              />
              <button
                className={styles.continue}
                disabled={!otherText[question.id]?.trim()}
                onClick={() => continueFromOther(question.id)}
                type="button"
              >
                continue <SiteArrow />
              </button>
            </div>
          )}
        </fieldset>
      )}
    </div>
  );
}
