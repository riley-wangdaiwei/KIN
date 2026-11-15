import type { Metadata } from "next";
import PlaygroundChrome from "@/components/site/PlaygroundChrome";
import CanvasWorkspace from "@/components/canvas/CanvasWorkspace";
import IdentityQuestionnaire from "./identity-questionnaire";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "My Gifting Identity | re.KIN",
  description:
    "Collect the details you notice about the people in your life, ready for the next thoughtful gift.",
};

export default function MyGiftingIdentityPage() {
  return (
    <>
      <PlaygroundChrome />
      <main className={styles.page} data-homepage>
        <header className={styles.heading}>
          <p className={styles.eyebrow}>A PERSONAL PRACTICE OF GIVING</p>
          <h1>My Gifting Identity</h1>
          <p className={styles.intro}>
            Keep the details you notice—their style, interests, and small
            things—so when it is time to give, you already have somewhere to
            begin.
          </p>
        </header>
        <section
          aria-labelledby="project-title"
          className={styles.questionnaire}
          id="start-a-project"
        >
          <span className={styles.metadata}>START A PROJECT / 01</span>
          <h1 id="project-title">Tell us who you have in mind.</h1>
          <p className={styles.intro}>
            Share a few details to begin a curation conversation.
          </p>
          <IdentityQuestionnaire />
        </section>

        <section aria-labelledby="identity-title" className={styles.identity}>
          <span className={styles.metadata}>A STYLE THAT BECOMES YOURS / 02</span>
          <h2 id="identity-title">Your way of giving, made personal.</h2>
          <p>
            After partnering with us and curating many gifts, you develop your own
            gifting style: a way of noticing what matters and turning it into
            something thoughtful. Once that style takes shape, you can use it to
            gift new people directly.
          </p>
        </section>
        <CanvasWorkspace />
      </main>
    </>
  );
}
