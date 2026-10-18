import Link from "next/link";
import EditorialPage from "@/components/site/EditorialPage";
import styles from "@/components/site/site.module.css";

export default function ContactPage() {
  return (
    <EditorialPage
      eyebrow="CONTACT / KIN"
      title="A note is a good beginning."
      intro="For order questions, artist introductions, press, or partnership ideas, KIN will provide a monitored contact channel before opening submissions or accepting real orders."
    >
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Reach the right place</h2>
        <div className={styles.sectionBody}>
          <p>
            Business email: [monitored contact email to be configured]. This
            preview does not yet send contact-form messages. Please do not
            include personal stories, images, or sensitive information until
            the verified contact channel is published.
          </p>
          <div className={styles.cardGrid}>
            <article className={styles.card}>
              <span className={styles.cardNumber}>FOR ARTISTS</span>
              <h3>Make with KIN</h3>
              <p>Artist submissions are not open yet; see the current program notes.</p>
              <Link className={styles.cta} href="/artists">Artist information →</Link>
            </article>
            <article className={styles.card}>
              <span className={styles.cardNumber}>FOR BUSINESSES</span>
              <h3>Partner with KIN</h3>
              <p>Learn how referral links, widgets, or deeper integrations may work.</p>
              <Link className={styles.cta} href="/partner-with-kin">Partner information →</Link>
            </article>
            <article className={styles.card}>
              <span className={styles.cardNumber}>FOR CUSTOMERS</span>
              <h3>Order questions</h3>
              <p>Order requests are not accepted as purchases; price and scope need confirmation.</p>
              <Link className={styles.cta} href="/terms">Read order terms draft →</Link>
            </article>
          </div>
        </div>
      </section>
    </EditorialPage>
  );
}
