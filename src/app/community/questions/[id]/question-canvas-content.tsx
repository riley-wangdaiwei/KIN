"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AlphabetName from "@/components/canvas/AlphabetName";
import styles from "./page.module.css";

type Answer = {
  id: string;
  content: string;
  createdAt: string;
};

export default function QuestionCanvasContent({ id }: { id: string }) {
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void fetch(`/api/community/questions/${encodeURIComponent(id)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const result = (await response.json()) as {
          question?: { question: string };
          answers?: Answer[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(
            result.error ?? "This community canvas could not be opened.",
          );
        }
        if (active) {
          setQuestion(result.question?.question ?? "");
          setAnswers(result.answers ?? []);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "This community canvas could not be opened.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <p className={styles.status}>Loading this canvas…</p>;
  if (error) return <p className={styles.status} role="alert">{error}</p>;

  return (
    <>
      <Link className={styles.backLink} href="/community">
        back to the community
      </Link>
      <p className={styles.eyebrow}>Community canvas</p>
      <AlphabetName as="h1" className={styles.question} name={question} />
      {answers.length === 0 ? (
        <p className={styles.status}>No answers yet — be the first, from your canvas.</p>
      ) : (
        <ol className={styles.answers}>
          {answers.map((answer, index) => (
            <li key={answer.id}>
              <span className={styles.answerIndex}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className={styles.answer}>{answer.content}</p>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
