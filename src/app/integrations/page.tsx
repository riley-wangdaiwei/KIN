import Link from "next/link";
import EditorialPage from "@/components/site/EditorialPage";
import styles from "@/components/site/site.module.css";

const partners = [
  {
    title: "Florists",
    value: "Pair a thoughtful digital keepsake with the immediacy of flowers, while each business owns its own product and fulfillment.",
    example: "A florist offers KIN after a bouquet purchase; a KIN customer can add flowers through a partner florist.",
  },
  {
    title: "Bookstores",
    value: "Bring a personal story together with a book that gives it another place to live.",
    example: "A custom publication paired with a poetry collection selected by an independent bookseller.",
  },
  {
    title: "Record stores",
    value: "Connect a relationship's soundtrack with artist-led digital storytelling.",
    example: "A KIN gift brief links to a record chosen for a shared road-trip memory.",
  },
  {
    title: "Photo printing",
    value: "Give selected memories a physical form without losing the context behind each image.",
    example: "A Conversation Recap with a small print set or a partner-made photo book.",
  },
  {
    title: "Travel & hotels",
    value: "Turn a stay, itinerary, or shared destination into a gift that can be revisited.",
    example: "A boutique hotel shares KIN as an optional keepsake after an anniversary stay.",
  },
  {
    title: "Museums & galleries",
    value: "Pair cultural discovery with a personal interpretation made for one recipient.",
    example: "An exhibition shop recommends a KIN keepsake beside a licensed exhibition print.",
  },
  {
    title: "Gift retailers",
    value: "Add a relationship-led creative layer to a well-chosen physical present.",
    example: "A retailer links from a gift guide to a KIN digital dedication and publication.",
  },
  {
    title: "Corporate gifting",
    value: "Replace one-size-fits-all recognition with a considered, human-scale story.",
    example: "A team commissions opt-in appreciation zines for a milestone or farewell.",
  },
];

export default function IntegrationsPage() {
  return (
    <EditorialPage
      eyebrow="INTEGRATIONS / PARTNER NETWORK"
      title="Good gifts travel together."
      intro="KIN can begin as a referral link and grow into a widget or API when it serves the partner. A connection should add meaning, not complexity."
      heroImage="/integrations.jpg"
      backgroundBehavior="scroll"
    >
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>A shared loop</h2>
        <div className={styles.sectionBody}>
          <p>
            Every partnership keeps responsibilities clear: KIN provides
            curation and creative gifting; the partner controls its own
            inventory, payment, shipping, and returns unless a written
            integration says otherwise.
          </p>
          <p>Start with a referral link. Add a widget or API only when both sides need it.</p>
        </div>
      </section>
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Ways to connect</h2>
        <div className={styles.sectionBody}>
          <div className={styles.cardGrid}>
            {partners.map((partner, index) => (
              <article className={styles.card} key={partner.title}>
                <span className={styles.cardNumber}>PARTNER / 0{index + 1}</span>
                <h3>{partner.title}</h3>
                <p>{partner.value}</p>
                <em>EXAMPLE / {partner.example}</em>
                <Link className={styles.cta} href="/partner-with-kin">
                  Partner with KIN →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </EditorialPage>
  );
}
