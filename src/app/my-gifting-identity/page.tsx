import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PlaygroundChrome from "@/components/site/PlaygroundChrome";
import BookingTrigger from "@/components/site/BookingTrigger";
import IdentityQuestionnaire from "./identity-questionnaire";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "A Gifting Identity | re.KIN",
  description: "Share a few details to begin a curation conversation.",
};

export default function MyGiftingIdentityPage() {
  return (
    <>
      <PlaygroundChrome />
      <main className={styles.page} data-homepage>
        <section
          aria-labelledby="project-title"
          className={styles.questionnaire}
          id="start-a-project"
        >
          <h1 id="project-title">
            <Image
              src="/rekin-tell-us-white.png"
              alt="Tell us who you have in mind."
              width={3334}
              height={345}
            />
          </h1>
          <p className={styles.intro}>
            Share a few details to begin a curation conversation. (this will
            take you max 5min!)
          </p>
          <IdentityQuestionnaire />
        </section>
        <BookingTrigger className={`${styles.meetingButton} kin-glass-hover`}>
          Book a free curation meeting
        </BookingTrigger>
        <p className={styles.canvasLink}>
          Not ready yet? Start a <Link href="/canvas">canvas</Link> for them.
        </p>
        <p className={styles.canvasNote}>
          Save the little things you notice over time. When you&rsquo;re
          ready, share it with us and we&rsquo;ll shape it into a gift.
        </p>
      </main>
    </>
  );
}
