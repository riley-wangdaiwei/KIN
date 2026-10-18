import EditorialPage from "@/components/site/EditorialPage";
import styles from "@/components/site/site.module.css";
import Link from "next/link";

export default function ImpressumPage() {
  return (
    <EditorialPage
      eyebrow="IMPRINT / OPERATOR INFORMATION"
      title="Who is responsible."
      intro="An Impressum is not a universal US requirement. Where a legal disclosure is required, the operator must complete and verify the applicable details before launch."
    >
      <div className={styles.legalCopy}>
        <p className={styles.notice}>
          PLACEHOLDERS — DO NOT TREAT THIS PREVIEW AS A COMPLETE LEGAL
          DISCLOSURE. Replace these fields with verified operator information
          and jurisdiction-specific notices.
        </p>
        <h2>Responsible operator</h2>
        <p>Legal name: [operator legal name to be added]</p>
        <p>Business or mailing address: [verified address to be added]</p>
        <p>Business registration / tax details: [if applicable, to be added]</p>
        <h2>Contact</h2>
        <p>Email: [monitored business email to be added]</p>
        <p>
          The legal operator, address, and monitored contact channel must be
          completed before public launch or acceptance of real orders. Do not
          send sensitive information until a verified contact is published.
        </p>
        <p>
          For privacy information, see the{" "}
          <Link href="/privacy">Privacy Policy</Link>.
          Last reviewed: October 18, 2026.
        </p>
      </div>
    </EditorialPage>
  );
}
