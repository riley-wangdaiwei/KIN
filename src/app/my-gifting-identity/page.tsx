import type { Metadata } from "next";
import PlaygroundChrome from "@/components/site/PlaygroundChrome";
import CanvasWorkspace from "@/components/canvas/CanvasWorkspace";
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
        <CanvasWorkspace />
      </main>
    </>
  );
}
