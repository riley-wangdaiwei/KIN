"use client";

import { useState, type FormEvent } from "react";
import styles from "./board.module.css";

interface CreateGroupProps {
  onCreate: (title: string) => void;
}

export default function CreateGroup({ onCreate }: CreateGroupProps) {
  const [value, setValue] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = value.trim();
    if (!title) return;

    onCreate(title);
    setValue("");
  }

  return (
    <form className={styles.createForm} onSubmit={submit}>
      <label className={styles.srOnly} htmlFor="new-frame-title">
        New frame title
      </label>
      <input
        id="new-frame-title"
        className={styles.textInput}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Name a frame"
        maxLength={64}
      />
      <button className={styles.smallAction} type="submit">
        + Frame
      </button>
    </form>
  );
}
