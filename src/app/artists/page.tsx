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

// Artists as a wheel: a small jar turning on the left with the artists'
// and partners' names circling it, the active artist's photos on the
// right. The list lives in src/features/artists/artists.ts — today it is
// only Rhema Tan, because she is the only artist name the site stores.
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
