import EditorialPage from "@/components/site/EditorialPage";
import ArtistContactForm from "@/app/artists/artist-contact-form";
import styles from "@/components/site/site.module.css";

const artistSections = [
  {
    title: "For artists",
    points: [
      "Join an anthropology-like story and art project through gift curation. Participating artists earn commissions.",
      "License the work you contribute for agreed uses.",
      "Our incentive mechanism encourages clients to interact with artists—and opens a future chance to buy their work.",
    ],
  },
  {
    title: "Corporate gifting",
    points: [
      "Partner with re.KIN to gift employees and clients art-based gifts.",
    ],
  },
  {
    title: "Physical gifts, integrated",
    points: [
      "re.KIN brings the meaning; physical gifts add use. We partner with florists and other shops so a real gift can carry the digital one.",
      "How it works: we recommend your shop, the customer orders on your own site, and when our gift page is ready you print a QR code linking to it and include it with the delivery — the recipient scans it and opens the gift. We provide the print template.",
    ],
  },
];

export default function PartnerWithKinPage() {
  return (
    <EditorialPage
      eyebrow="PARTNER WITH re.KIN / EARLY CONVERSATIONS"
      title="Bring another kind of meaning."
      intro="re.KIN can complement a partner's existing offer with relationship-led curation. Start with a clear hand-off; build more only when it helps both sides."
      homepageChrome
    >
      {artistSections.map((section) => (
        <section className={styles.section} key={section.title}>
          <h2 className={styles.sectionHeading}>{section.title}</h2>
          <div className={styles.sectionBody}>
            {section.points.map((point) => (
              <p key={point}>{point}</p>
            ))}
          </div>
        </section>
      ))}
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Let&rsquo;s work together.</h2>
        <div className={styles.sectionBody}>
          <ArtistContactForm />
          <p className={styles.notice}>
            If you join, your portfolio can be featured on re.KIN.
          </p>
        </div>
      </section>
    </EditorialPage>
  );
}
