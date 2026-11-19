import styles from "./alphabet-name.module.css";

export default function AlphabetName({ name, size }: { name: string; size?: number | null }) {
  return (
    <h3 aria-label={name} className={styles.alphabetRow} style={size == null ? undefined : { fontSize: `${size}px` }}>
      <span className={styles.visuallyHidden}>{name}</span>
      {Array.from(name).map((character, index) => {
        if (character === " ") {
          return <span aria-hidden="true" className={styles.letterSpace} key={`${index}-space`} />;
        }

        const asset = character.toLowerCase() === "," ? "comma" : character.toLowerCase();
        if (/^[a-z]$/.test(asset) || asset === "comma") {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              aria-hidden="true"
              className={styles.alphabetLetter}
              draggable={false}
              key={`${index}-${character}`}
              src={`/alphabet/${asset}.png`}
            />
          );
        }

        return <span aria-hidden="true" className={styles.fallbackLetter} key={`${index}-${character}`}>{character}</span>;
      })}
    </h3>
  );
}
