import { Fragment } from "react";
import styles from "./alphabet-name.module.css";

type AlphabetNameProps = {
  name: string;
  size?: number | null;
  // Heading level: person names stay h3; the question canvas page uses h1
  // for its big title. Defaults to h3 so existing uses are unchanged.
  as?: "h1" | "h3";
  className?: string;
};

function renderLetter(character: string, key: string) {
  const asset = character.toLowerCase() === "," ? "comma" : character.toLowerCase();
  if (/^[a-z]$/.test(asset) || asset === "comma") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt=""
        aria-hidden="true"
        className={styles.alphabetLetter}
        draggable={false}
        key={key}
        src={`/alphabet/${asset}.png`}
      />
    );
  }

  // Anything outside the letter set (digits, punctuation, symbols) falls
  // back to plain text in the same row.
  return (
    <span aria-hidden="true" className={styles.fallbackLetter} key={key}>
      {character}
    </span>
  );
}

export default function AlphabetName({ name, size, as = "h3", className }: AlphabetNameProps) {
  const Heading = as;
  // Letters are grouped by word so a long title wraps between words, never
  // mid-word. Spaces stay as their own flex items, so the gap between words
  // is exactly what it was before grouping.
  const words = name.split(" ");
  return (
    <Heading
      aria-label={name}
      className={className ? `${styles.alphabetRow} ${className}` : styles.alphabetRow}
      style={size == null ? undefined : { fontSize: `${size}px` }}
    >
      <span className={styles.visuallyHidden}>{name}</span>
      {words.map((word, wordIndex) => (
        <Fragment key={wordIndex}>
          {wordIndex > 0 && (
            <span aria-hidden="true" className={styles.letterSpace} />
          )}
          <span aria-hidden="true" className={styles.word}>
            {Array.from(word).map((character, index) =>
              renderLetter(character, `${wordIndex}-${index}`),
            )}
          </span>
        </Fragment>
      ))}
    </Heading>
  );
}
