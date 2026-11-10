import PlaygroundExperience from "./playground-experience";
import styles from "./page.module.css";
import PlaygroundChrome from "@/components/site/PlaygroundChrome";

export default function PlaygroundPage() {
  return (
    <main className={styles.page}>
      <PlaygroundChrome />
      <PlaygroundExperience />
    </main>
  );
}
