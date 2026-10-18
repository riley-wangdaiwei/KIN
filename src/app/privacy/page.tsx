import EditorialPage from "@/components/site/EditorialPage";
import styles from "@/components/site/site.module.css";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <EditorialPage
      eyebrow="PRIVACY / DRAFT FOR REVIEW"
      title="Your board is yours."
      intro="This draft describes the current KIN preview. It must be reviewed against the live hosting, email, and data-retention settings before broader launch."
    >
      <div className={styles.legalCopy}>
        <p className={styles.notice}>
          OPERATOR ACTION REQUIRED: Add the legal operator&apos;s name and contact
          details on the Impressum page, verify vendor retention settings,
          and review the rules that apply to your customers before accepting
          real orders.
        </p>
        <h2>Information handled</h2>
        <p>
          Board labels, frames, and a saved Gift Brief are stored in local
          browser storage on the device you use. They are not sent to KIN just
          by using the board. Clearing browser storage or changing browsers
          can remove that local copy.
        </p>
        <p>
          If you submit an order request, KIN receives the email address you
          provide, selected package and fillings, Gift Brief, selected board
          materials, personal message, optional recipient name, delivery
          notes, and consent confirmations. Do not include a street address
          for partner-fulfilled physical goods.
        </p>
        <p>
          The hosting provider may process technical request data, such as IP
          address, device/browser information, and server logs, to deliver and
          protect the website. Exact log fields and retention periods depend
          on the active hosting configuration and must be confirmed by the
          operator.
        </p>
        <h2>Why and with whom</h2>
        <p>
          Order details are used to review and respond to the request. The
          email provider Resend is used to send the request to KIN and a
          receipt to the buyer. Website hosting and delivery are provided
          through Vercel. No payment processor, advertising pixels, or
          analytics service is configured in this preview.
        </p>
        <p>
          Order email is retained in KIN&apos;s inbox until staff delete it.
          This MVP does not use a separate order database or automatic
          deletion schedule. Ask KIN to access, correct, or delete information
          where applicable; contact details are not yet configured, so this
          request channel must be published before launch.
        </p>
        <h2>Sharing and partner products</h2>
        <p>
          Selected materials are not published or shared with an artist or
          partner unless you separately approve that sharing. A florist or
          other merchant handles its own checkout, shipping details, product
          fulfillment, and returns under its own privacy notice.
        </p>
        <h2>Children, changes, and questions</h2>
        <p>
          KIN is not designed for children to submit personal information.
          This notice may change when products, vendors, or legal
          requirements change. The responsible operator and contact method
          are listed as launch prerequisites on the{" "}
          <Link href="/impressum">Impressum</Link>.
        </p>
        <p>Last reviewed: October 18, 2026. Draft; not legal advice.</p>
      </div>
    </EditorialPage>
  );
}
