import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "text";

interface EditorialButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function EditorialButton({
  children,
  className,
  variant = "secondary",
  ...props
}: EditorialButtonProps) {
  const classes = [
    "editorial-button",
    `editorial-button--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
