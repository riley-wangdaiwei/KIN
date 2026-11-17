import EditorialPage from "@/components/site/EditorialPage";
import styles from "@/components/site/site.module.css";

export default function AboutPage() {
  return (
    <EditorialPage
      eyebrow="ABOUT / re.KIN"
      title="A place for the things you notice."
      intro="re.KIN helps people gather the small details that make a relationship particular, then turn that curation into a thoughtful gift."
      homepageChrome
    >
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>The idea</h2>
        <div className={styles.sectionBody}>
          <p>
            A saved phrase, a familiar route, a ticket kept for no reason:
            these details are often what make a gift feel like it could only
            belong to one person. re.KIN gives them a place to collect, connect,
            and become a creative keepsake.
          </p>
          <p>The loop is simple: Collect → Curate → Create → Give.</p>
        </div>
      </section>
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Where we are</h2>
        <div className={styles.sectionBody}>
          <p>
            re.KIN is an early product preview. The board, catalog, and order
            request flow are being developed; availability, artist terms,
            business contact details, and complete legal terms must be
            finalized before the service accepts paid orders.
          </p>
        </div>
      </section>
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>What you receive</h2>
        <div className={styles.sectionBody}>
          <p>
            A private link to a small web page made just for you. The page holds your gift and everything that comes with it. We also give you a QR code for the page, so you can share it however you like: print it on a card, tuck it into a bouquet, or send the link directly.
          </p>
          <p>
            <strong>Hero gift</strong> — The main gift. You work with the artist to create a one-of-a-kind piece for the person you&apos;re giving it to, such as a poem, an interactive photo album, or a small game.
          </p>
          <p>
            <strong>Fillings</strong> — Optional extras you can add to the main gift: Other digital works by the artist; A license to use one of the artist&apos;s existing pieces, such as a poem or photograph; Physical gifts, such as flowers from our partner florists (coming soon).
          </p>
          <p>
            <strong>README guide</strong> — A guide that explains: How to open and use the page; What&apos;s included in your gift; What you&apos;re allowed to do with it (license); Proof of ownership, if the work is minted as a token; Where the page is stored, plus a copy you can download; How long it stays online and who looks after it.
          </p>
          <p>
            <strong>Artist&apos;s process note</strong> — How your gift was made. The artist starts by learning about the person receiving it: their story, shared memories, and what matters to them. The artist then turns that into the final piece. This note walks the recipient through those steps.
          </p>
        </div>
      </section>
    </EditorialPage>
  );
}
