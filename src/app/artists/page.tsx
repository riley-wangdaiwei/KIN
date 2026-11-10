import type { Metadata } from "next";
import PlaygroundChrome from "@/components/site/PlaygroundChrome";
import ArtistContactForm from "./artist-contact-form";
import styles from "./page.module.css";

const sections = [
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
      "re.KIN brings the meaning; physical gifts add use. We encourage artists to weave connected gifts—like flowers or perfume—into curation.",
      "Florists, bookstores, and other shops can explore mutual storefront promotion and API integration with us.",
    ],
  },
];

export const metadata: Metadata = {
  title: "Artists and partners | re.KIN",
  description: "Make thoughtful, artist-made gifts with re.KIN.",
};

export default function ArtistsPage() {
  return (
    <>
      <PlaygroundChrome />
      <main className={styles.page} data-homepage>
        <div className={styles.content}>
          {sections.map((section, sectionIndex) => (
            <section
              aria-labelledby={`artists-section-${sectionIndex + 1}`}
              className={styles.section}
              key={section.title}
            >
              {sectionIndex === 0 ? (
                <h1
                  className={styles.sectionTitle}
                  id={`artists-section-${sectionIndex + 1}`}
                >
                  {section.title}
                </h1>
              ) : (
                <h2
                  className={styles.sectionTitle}
                  id={`artists-section-${sectionIndex + 1}`}
                >
                  {section.title}
                </h2>
              )}
              <ul className={styles.points}>
                {section.points.map((point, pointIndex) => (
                  <li className={styles.point} key={point}>
                    <span aria-hidden="true" className={styles.pointNumber}>
                      {String(pointIndex + 1).padStart(2, "0")}
                    </span>
                    <span className={styles.pointText}>{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section aria-labelledby="contact-title" className={styles.contact}>
            <h2 className={styles.contactTitle} id="contact-title">
              Let’s work together.
            </h2>
            <ArtistContactForm />
            <p className={styles.portfolioNote}>
              If you join, your portfolio can be featured on re.KIN.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
