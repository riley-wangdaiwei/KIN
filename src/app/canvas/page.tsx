import type { Metadata } from "next";
import PlaygroundChrome from "@/components/site/PlaygroundChrome";
import CanvasWorkspace from "@/components/canvas/CanvasWorkspace";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Canvas | re.KIN",
  description:
    "Keep the details you notice about the people in your life, ready for the next thoughtful gift.",
};

export default function CanvasPage() {
  return (
    <>
      <PlaygroundChrome />
      <main className={styles.page} data-homepage>
        <CanvasWorkspace />
      </main>
    </>
  );
}
