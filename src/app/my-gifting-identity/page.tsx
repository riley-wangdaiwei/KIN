import type { Metadata } from "next";
import PlaygroundChrome from "@/components/site/PlaygroundChrome";
import IdentityQuestionnaire from "./identity-questionnaire";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "What kind of gift is your person? | re.KIN",
  description: "Answer a few quick questions to find out. Takes 2 minutes.",
};

export default function MyGiftingIdentityPage() {
  return (
    <>
      <PlaygroundChrome />
      <main className={styles.page} data-homepage>
        <section
          aria-labelledby="quiz-title"
          className={styles.quiz}
          id="start-a-project"
        >
          <h1 id="quiz-title">What kind of gift is your person?</h1>
          <p className={styles.intro}>
            Answer a few quick questions to find out. Takes 2 minutes.
          </p>
          <IdentityQuestionnaire />
        </section>
      </main>
    </>
  );
}
