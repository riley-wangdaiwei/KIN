import styles from "./site-arrow.module.css";

export default function SiteArrow({
  className = "",
  direction = "forward",
}: {
  className?: string;
  direction?: "forward" | "back";
}) {
  return (
    <svg
      aria-hidden="true"
      className={`${styles.arrow} ${direction === "back" ? styles.back : ""} ${className}`.trim()}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={13}
      viewBox="0 0 100 100"
    >
      <path d="M12 88 L88 12" />
      <path d="M52 12 H88 V48" />
    </svg>
  );
}
