import PlaygroundExperience from "./playground-experience";
import styles from "./page.module.css";

export default function PlaygroundPage() {
  return (
    <main className={styles.page}>
      <PlaygroundExperience />
    </main>
  );
}
