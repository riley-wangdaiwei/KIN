import type { Metadata } from "next";
import PlaygroundChrome from "@/components/site/PlaygroundChrome";
import ProfileContent from "@/components/profile/ProfileContent";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Profile | re.KIN",
  description:
    "Your gifting identity — your canvases, your styles, and the artists you work with.",
};

export default function ProfilePage() {
  return (
    <>
      <PlaygroundChrome />
      <main className={styles.page} data-homepage>
        <ProfileContent />
      </main>
    </>
  );
}
