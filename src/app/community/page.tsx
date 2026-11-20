import type { Metadata } from "next";
import PlaygroundChrome from "@/components/site/PlaygroundChrome";
import CommunityContent from "./community-content";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Community | re.KIN",
  description:
    "Published canvases from the community, and the questions we're answering together.",
};

export default function CommunityPage() {
  return (
    <>
      <PlaygroundChrome />
      <main className={styles.page} data-homepage>
        <CommunityContent />
      </main>
    </>
  );
}
