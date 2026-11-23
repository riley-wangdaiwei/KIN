import type { Metadata } from "next";
import Link from "next/link";
import EditorialPage from "@/components/site/EditorialPage";
import ArtistShowcase from "@/components/site/ArtistShowcase";
import SiteArrow from "@/components/site/SiteArrow";
import { ARTISTS } from "@/features/artists/artists";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Artists and partners | re.KIN",
  description: "Make thoughtful, artist-made gifts with re.KIN.",
};

// Artists as a cover-style wheel: a small jar turning beside a
// vertical column of artists' and partners' names — the name at the
// column's center is front-most and shows its photos on the right.
// The list lives in src/features/artists/artists.ts: Rhema Tan plus
// the homepage's artist/partner hover-list names.
export default function ArtistsPage() {
  return (
    <EditorialPage
      eyebrow="ARTISTS OF re.KIN"
      title="Artists"
      intro="The artists behind re.KIN gifts."
      homepageChrome
    >
      <ArtistShowcase items={ARTISTS} />
      <section className={styles.more}>
        <p>More artists joining soon.</p>
        <Link className={styles.textLink} href="/partner-with-kin">
          Are you an artist? Partner with re.KIN <SiteArrow />
        </Link>
      </section>
    </EditorialPage>
  );
}
