import siteStyles from "@/components/site/site.module.css";
import HowItWorksContent from "./how-it-works-content";

export default function HowItWorksPage() {
  return (
    <main
      className={`${siteStyles.page} ${siteStyles.scrollImagePage}`}
      data-how-it-works
    >
      {/* Keep the existing scrolling image and fade effect unchanged. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden="true"
        alt=""
        className={siteStyles.tallBg}
        src="/how-it-works.jpg"
      />
      <HowItWorksContent />
    </main>
  );
}
