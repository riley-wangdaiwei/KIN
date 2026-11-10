import PlaygroundExperience from "./playground/playground-experience";
import styles from "./playground/page.module.css";
import PlaygroundChrome from "@/components/site/PlaygroundChrome";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <PlaygroundChrome />
      <PlaygroundExperience />
    </main>
  );
}
