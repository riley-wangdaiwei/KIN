import type { Metadata } from "next";
import Link from "next/link";
import PlaygroundChrome from "@/components/site/PlaygroundChrome";
import ArtistShowcase from "@/components/site/ArtistShowcase";
import SiteArrow from "@/components/site/SiteArrow";
import { ARTISTS } from "@/features/artists/artists";
import siteStyles from "@/components/site/site.module.css";
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
//
// No EditorialPage header on this page (Riles 2026-11-24: the eyebrow
// + title + intro are removed) — the page opens straight onto the
// wheel + photos, with the same top clearance the hero used to give,
// so the fixed chrome never overlaps the content. EditorialPage itself
// is untouched; only this page bypasses it.
export default function ArtistsPage() {
  return (
    <>
      <PlaygroundChrome />
      <main
        className={`${siteStyles.page} ${siteStyles.playgroundPage}`}
        data-homepage="true"
      >
        <div className={`${siteStyles.content} ${styles.top}`}>
          <ArtistShowcase items={ARTISTS} />
          <section className={styles.more}>
            <p>More artists joining soon.</p>
            <Link className={styles.textLink} href="/partner-with-kin">
              Are you an artist? Partner with re.KIN <SiteArrow />
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}
