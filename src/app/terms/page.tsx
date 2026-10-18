import EditorialPage from "@/components/site/EditorialPage";
import styles from "@/components/site/site.module.css";

export default function TermsPage() {
  return (
    <EditorialPage
      eyebrow="TERMS / PRE-LAUNCH DRAFT"
      title="Clear terms before a real order."
      intro="These notes explain the current order-request preview. They are not complete Terms of Sale and are not a substitute for launch-ready legal review."
    >
      <div className={styles.legalCopy}>
        <p className={styles.notice}>
          The order form sends an inquiry by email. It does not take payment
          and is not acceptance of a commission or purchase. Full terms,
          seller identity, final pricing, delivery, cancellation, and
          applicable consumer rights must be published before KIN accepts
          real orders.
        </p>
        <h2>Order requests</h2>
        <p>
          A request records the package and options you are interested in.
          KIN will need to confirm creative scope, availability, price,
          delivery estimate, and any artist or partner terms separately.
          Nothing is made or reserved until the parties agree on those details
          in writing.
        </p>
        <h2>Materials and permissions</h2>
        <p>
          Submit only material you created or have permission to share. KIN
          will not publish or pass selected material to an artist without
          separate approval. Third-party works remain subject to their
          applicable license.
        </p>
        <h2>Partner products</h2>
        <p>
          Physical goods are sold and fulfilled by the partner merchant.
          That merchant&apos;s price, delivery, cancellation, return, and privacy
          terms apply to its transaction.
        </p>
        <h2>Before launch</h2>
        <p>
          The responsible seller, governing law, taxes, payment methods,
          cancellation rights, warranties, dispute process, support contact,
          and any product-specific conditions have not been finalized.
          KIN will publish complete terms before accepting paid orders.
        </p>
        <p>Last reviewed: October 18, 2026. Draft; not legal advice.</p>
      </div>
    </EditorialPage>
  );
}
