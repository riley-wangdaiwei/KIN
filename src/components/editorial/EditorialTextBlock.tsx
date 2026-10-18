import type { HTMLAttributes, ReactNode } from "react";
import { MetadataLabel } from "./MetadataLabel";

interface EditorialTextBlockProps extends HTMLAttributes<HTMLElement> {
  title: string;
  label?: string;
  children: ReactNode;
}

export function EditorialTextBlock({
  children,
  className,
  label,
  title,
  ...props
}: EditorialTextBlockProps) {
  const classes = ["editorial-text-block", className].filter(Boolean).join(" ");

  return (
    <section className={classes} {...props}>
      {label && (
        <MetadataLabel className="editorial-text-block__label" accent>
          {label}
        </MetadataLabel>
      )}
      <h2 className="editorial-text-block__title">{title}</h2>
      <div className="editorial-text-block__body">{children}</div>
    </section>
  );
}
