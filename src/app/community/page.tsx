import EditorialPage from "@/components/site/EditorialPage";
import styles from "@/components/site/site.module.css";

const fragments = [
  "the blue cup from every apartment",
  "a map with no destination",
  "they save the last page",
  "our quiet walk home",
  "all the songs with weather in them",
  "one more museum, even on holiday",
  "the recipe without measurements",
  "every first snow, a photograph",
];

export default function CommunityPage() {
  return (
    <EditorialPage
      eyebrow="COMMUNITY / SHARED INSPIRATION"
      title="A small idea can travel."
      intro="Community is the soil around the board: a place for shared inspiration, artist knowledge, and careful ways to contribute—not another product to keep up with."
    >
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Inspiration library</h2>
        <div className={styles.sectionBody}>
          <p>
            Browse public gift ideas, artist-made inspirations, and
            relationship prompts. This preview is made from fictional,
            editorial examples; it does not contain contributions from users.
          </p>
          <span className={styles.sectionLabel}>LABELS WATERFALL / STATIC PREVIEW / FICTIONAL EXAMPLES</span>
          <div className={styles.cardGrid}>
            {fragments.map((fragment, index) => (
              <article className={styles.card} key={fragment}>
                <span className={styles.cardNumber}>FRAGMENT / 0{index + 1}</span>
                <h3>{fragment}</h3>
                <p>Shared as a standalone spark, not as a private board or relationship story.</p>
              </article>
            ))}
          </div>
          <p className={styles.notice}>
            A real Labels Waterfall will only include fragments people
            explicitly choose to share. Private boards and relationship
            stories are never public by default. Contributors can withdraw
            consent, subject to a clear removal process.
          </p>
        </div>
      </section>
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Recipient-led curation</h2>
        <div className={styles.sectionBody}>
          <p>
            A future collaborative gift could invite friends and family to
            contribute their own memories for one recipient. Each person would
            choose what to share, and the recipient&apos;s preferences would guide
            how the collection is shaped and delivered.
          </p>
          <p>This is a concept, not an active contribution or group-gift feature.</p>
        </div>
      </section>
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Handbooks & governance</h2>
        <div className={styles.sectionBody}>
          <div className={styles.cardGrid}>
            {[
              ["Artist handbook", "Credit, scope, licensing, consent, and fair compensation should be agreed before a work is listed."],
              ["Community rules", "Share only what you have permission to share. Respect boundaries, privacy, and attribution."],
              ["Governance", "As the community grows, contributors will help define moderation, removal, and decision-making processes."],
            ].map(([title, copy]) => (
              <article className={styles.card} key={title}>
                <span className={styles.cardNumber}>STATIC GUIDE</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </EditorialPage>
  );
}
