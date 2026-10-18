import type { HTMLAttributes, ReactNode } from "react";

interface MetadataLabelProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
  accent?: boolean;
}

export function MetadataLabel({
  accent = false,
  children,
  className,
  ...props
}: MetadataLabelProps) {
  const classes = [
    "metadata-label",
    "kin-metadata",
    accent && "metadata-label--accent",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <p className={classes} {...props}>
      {children}
    </p>
  );
}
