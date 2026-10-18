import EditorialPage from "@/components/site/EditorialPage";
import styles from "@/components/site/site.module.css";

export default function ArtistTermsPage() {
  return (
    <EditorialPage
      eyebrow="ARTIST TERMS / WORKING DRAFT"
      title="Good work deserves clear terms."
      intro="This outline is a starting point for artist conversations, not a contract. No artist work is commissioned, licensed, or listed for sale through this draft."
    >
      <div className={styles.legalCopy}>
        <p className={styles.notice}>
          Artist submissions and commissions are not open yet. A signed
          agreement tailored to each work is required before launch or sale.
        </p>
        <h2>Ownership and license</h2>
        <p>
          The artist retains ownership unless a separate written agreement
          explicitly says otherwise. Any license must identify the work,
          purpose, audience, territory, term, and whether reuse or
          modification is allowed. No unlimited or exclusive rights are
          presumed.
        </p>
        <h2>Scope and attribution</h2>
        <p>
          Each listing or commission should set the deliverables, format,
          materials, personalization, revision count, timeline, attribution,
          approval process, and responsibilities for customer support.
        </p>
        <h2>Pricing and revenue</h2>
        <p>
          Artist compensation, platform fees, payment timing, refunds,
          cancellations, taxes, and any revenue share must be agreed in
          writing before a product is offered. KIN has not established a
          standard revenue split.
        </p>
        <h2>Consent and privacy</h2>
        <p>
          Personal materials are shared with a maker only with the
          customer&apos;s separate approval. Artists should use customer
          materials only for the agreed commission and not publish or reuse
          them without permission.
        </p>
        <p>Last reviewed: October 18, 2026. Working draft; not legal advice.</p>
      </div>
    </EditorialPage>
  );
}
