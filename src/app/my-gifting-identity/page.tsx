import Link from "next/link";
import IdentityQuestionnaire from "./identity-questionnaire";
import styles from "./page.module.css";

export default function MyGiftingIdentityPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.wordmark} href="/" aria-label="re.KIN home">
          re.KIN
        </Link>
        <span className={styles.metadata}>A PERSONAL PRACTICE OF GIVING</span>
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
    </main>
  );
}
