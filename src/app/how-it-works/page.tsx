import siteStyles from "@/components/site/site.module.css";
import HowItWorksContent, { HowItWorksFooter } from "./how-it-works-content";
import styles from "./how-it-works-content.module.css";

export default function HowItWorksPage() {
  return (
    <main
      className={`${siteStyles.page} ${siteStyles.scrollImagePage} ${styles.page}`}
      data-how-it-works
    >
      {/* Keep the existing scrolling image and fade effect unchanged. */}
      <div className={styles.imageStage}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden="true"
          alt=""
          className={siteStyles.tallBg}
          src="/how-it-works.jpg"
        />
        <div className={styles.pageContent}>
          <HowItWorksContent />
        </div>
      </div>
      <HowItWorksFooter />
    </main>
  );
}
