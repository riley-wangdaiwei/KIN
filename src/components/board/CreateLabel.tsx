"use client";

import { useState, type FormEvent } from "react";
import styles from "./board.module.css";

interface CreateLabelProps {
  onCreate: (label: string) => void;
}

export default function CreateLabel({ onCreate }: CreateLabelProps) {
  const [value, setValue] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = value.trim();
    if (!label) return;

    onCreate(label);
    setValue("");
  }

  return (
    <form className={styles.createForm} onSubmit={submit}>
      <label className={styles.srOnly} htmlFor="new-board-label">
        Add a word, memory, link, or sentence
      </label>
      <input
        id="new-board-label"
        className={styles.textInput}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="A word, memory, link…"
        maxLength={120}
      />
      <button className={styles.smallAction} type="submit">
        + Note
      </button>
    </form>
  );
}
