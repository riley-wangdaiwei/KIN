import type { Metadata } from "next";
import PlaygroundChrome from "@/components/site/PlaygroundChrome";
import QuestionCanvasContent from "./question-canvas-content";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Community canvas | re.KIN",
  description: "Everyone's answers to one weekly question, gathered on one canvas.",
};

export default async function CommunityQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PlaygroundChrome />
      <main className={styles.page} data-homepage>
        <QuestionCanvasContent id={id} />
      </main>
    </>
  );
}
