import type { Metadata } from "next";
import PlaygroundChrome from "@/components/site/PlaygroundChrome";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Artists and partners | re.KIN",
  description: "Make thoughtful, artist-made gifts with re.KIN.",
};

export default function ArtistsPage() {
  return (
    <>
      <PlaygroundChrome />
      <main aria-label="Artists and partners" className={styles.page} data-homepage />
    </>
  );
}
