import type { Metadata } from "next";
import PlaygroundChrome from "@/components/site/PlaygroundChrome";
import SharedCanvasView from "@/components/canvas/SharedCanvasView";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Shared canvas | re.KIN",
  robots: { index: false, follow: false },
};

export default async function CanvasSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <>
      <PlaygroundChrome />
      <main className={styles.page} data-homepage>
        <p className={styles.eyebrow}>SHARED WITH YOU</p>
        <h1>A personal practice of giving.</h1>
        <SharedCanvasView token={token} />
      </main>
    </>
  );
}
