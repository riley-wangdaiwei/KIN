import EditorialPage from "@/components/site/EditorialPage";
import styles from "@/components/site/site.module.css";

export default function AboutPage() {
  return (
    <EditorialPage
      eyebrow="ABOUT / KIN"
      title="A place for the things you notice."
      intro="KIN helps people gather the small details that make a relationship particular, then turn that curation into a thoughtful gift."
    >
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>The idea</h2>
        <div className={styles.sectionBody}>
          <p>
            A saved phrase, a familiar route, a ticket kept for no reason:
            these details are often what make a gift feel like it could only
            belong to one person. KIN gives them a place to collect, connect,
            and become a creative keepsake.
          </p>
          <p>The loop is simple: Collect → Curate → Create → Give.</p>
        </div>
      </section>
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Where we are</h2>
        <div className={styles.sectionBody}>
          <p>
            KIN is an early product preview. The board, catalog, and order
            request flow are being developed; availability, artist terms,
            business contact details, and complete legal terms must be
            finalized before the service accepts paid orders.
          </p>
        </div>
      </section>
    </EditorialPage>
  );
}
