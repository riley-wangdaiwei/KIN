import styles from "./red-arrow.module.css";

export default function RedArrow({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`${styles.arrow} ${className}`.trim()}>
      →
    </span>
  );
}
