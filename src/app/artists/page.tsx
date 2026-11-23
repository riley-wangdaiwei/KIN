import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import AlphabetName from "@/components/canvas/AlphabetName";
import EditorialPage from "@/components/site/EditorialPage";
import SiteArrow from "@/components/site/SiteArrow";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Artists and partners | re.KIN",
  description: "Make thoughtful, artist-made gifts with re.KIN.",
};

// One artist, featured large — the "Featured artist" label reads as if
// there are other artists who simply aren't shown, not as if she is the
// only one. No grid: a single item in a grid would look empty.
// Copy here is draft — Riles can correct the wording.
export default function ArtistsPage() {
  return (
    <EditorialPage
      eyebrow="ARTISTS OF re.KIN"
      title="Artists"
      intro="The artists behind re.KIN gifts."
      homepageChrome
    >
      <section aria-label="Featured artist" className={styles.feature}>
        <p className={styles.featureLabel}>Featured artist</p>
        <AlphabetName name="Rhema" />
        <Link
          aria-label="See Conversation Recap, the gift Rhema made"
          className={styles.featureImage}
          href="/gifts/conversation-recap"
        >
          <Image
            alt="Conversation Recap, a poster designed by Rhema from a real chat history"
            fill
            sizes="(max-width: 56rem) 100vw, 56rem"
            src="/gift_conversation.jpg"
          />
        </Link>
        <p className={styles.featureCopy}>
          Rhema designed the Conversation Recap poster for re.KIN&rsquo;s first
          loop — a poster made from a real chat history, turned into a gift.
        </p>
        <Link className={styles.textLink} href="/gifts/conversation-recap">
          See the gift she made <SiteArrow />
        </Link>
      </section>
      <section className={styles.more}>
        <p>More artists joining soon.</p>
        <Link className={styles.textLink} href="/partner-with-kin">
          Are you an artist? Partner with re.KIN <SiteArrow />
        </Link>
      </section>
    </EditorialPage>
  );
}
