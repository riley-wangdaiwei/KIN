import { MetadataLabel } from "./MetadataLabel";

interface SectionRuleProps {
  label?: string;
}

export function SectionRule({ label }: SectionRuleProps) {
  return (
    <div className="section-rule" aria-hidden={!label}>
      <hr className="section-rule__line" />
      {label && (
        <MetadataLabel className="section-rule__label">{label}</MetadataLabel>
      )}
      <hr className="section-rule__line" />
    </div>
  );
}
