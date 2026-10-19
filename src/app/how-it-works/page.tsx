import Link from "next/link";
import EditorialPage from "@/components/site/EditorialPage";
import styles from "@/components/site/site.module.css";

const loop = [
  {
    title: "Collect",
    copy: "Gather the phrases, places, habits, links, images, and small details that make a person or relationship particular.",
    example: "A pocket archive: the late train, the museum room, the line they always say.",
  },
  {
    title: "Curate",
    copy: "Arrange details into themes and notice what connects. A Gift Brief helps turn the board into a direction without making it a questionnaire.",
    example: "A shared map of small rituals, old tickets, and places you return to.",
  },
  {
    title: "Create",
    copy: "Choose a KIN Meal or artist-made idea. A maker shapes the material into an intentional object, image, or story.",
    example: "A private digital publication with a dedication and an artist's process note.",
  },
  {
    title: "Give",
    copy: "Send a considered gift, then let the recipient keep, revisit, or share it on their terms.",
    example: "A private link and keepsake PDF, ready to open together or later.",
  },
];

const tools = [
  ["01", "Me / Them / Us", "Separate what belongs to you, them, and the world you share.", true],
  ["02", "Comparison", "Set two collections beside each other to notice what differs and what meets.", true],
  ["03", "Timeline", "Place memories in the past, present, and future.", true],
  ["04", "Bridge", "Connect themes that seem unrelated until a detail brings them together.", true],
  ["05", "Echo", "Notice words, habits, or memories that return across the board.", true],
  ["06", "Parallel", "Follow two experiences side by side without forcing them into one story.", false],
  ["07", "Mirror", "Reflect a detail back from another angle.", false],
  ["08", "Contrast", "Make room for differences as part of the relationship.", false],
  ["09", "Overlap", "Map the interests, places, and rituals that are shared.", false],
  ["10", "Influence", "Trace the things you have introduced to each other.", false],
  ["11", "Orbit", "Gather related details around a person, place, or central idea.", false],
] as const;

export default function HowItWorksPage() {
  return (
    <EditorialPage
      eyebrow="THE KIN LOOP / 01—04"
      title="A gift begins with noticing."
      intro="KIN turns the small things you remember into a thoughtful, maker-shaped gift. The board is the beginning; the loop keeps it moving."
      heroImage="/how-it-works.jpg"
      backgroundBehavior="scroll"
    >
      {loop.map((step, index) => (
        <section className={styles.section} key={step.title}>
          <h2 className={styles.sectionHeading}>
            <span className={styles.sectionLabel}>STEP / 0{index + 1}</span>
            {step.title}
          </h2>
          <div className={styles.sectionBody}>
            <p>{step.copy}</p>
            <p><em>FOR EXAMPLE / {step.example}</em></p>
          </div>
        </section>
      ))}
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Curation tools</h2>
        <div className={styles.sectionBody}>
          <span className={styles.sectionLabel}>STATIC GALLERY / 11 WAYS TO MAKE CONNECTIONS</span>
          <div className={styles.cardGrid}>
            {tools.map(([number, title, copy, isInteractive]) => (
              <article className={styles.card} key={title}>
                <span className={styles.cardNumber}>{number} / {isInteractive ? "ON THE BOARD" : "IN DEVELOPMENT"}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
          <p className={styles.notice}>
            This gallery is a static explanation. Five tools—Me / Them / Us,
            Comparison, Timeline, Bridge, and Echo—are the interactive curation
            components on the board. The remaining examples are concepts, not
            working controls here.
          </p>
          <Link className={styles.cta} href="/">Start collecting →</Link>
        </div>
      </section>
    </EditorialPage>
  );
}
