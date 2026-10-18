"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { TasteTag } from "@/features/taste/types";
import type { WorldFrame } from "@/features/world/types";
import { createGiftBrief } from "@/features/brief/service";
import type {
  BriefMaterial,
  GiftBrief,
  GiftCurationAnswers,
  GiftIntent,
} from "@/features/brief/types";
import styles from "./curation.module.css";

interface GiftCurationFlowProps {
  tags: TasteTag[];
  frames: WorldFrame[];
  onCreateLabel: (label: string) => TasteTag | null;
  onExploreGiftIdeas: (brief: GiftBrief) => void;
  onMakeZine: (brief: GiftBrief) => void;
  onKeepCollecting: (brief: GiftBrief) => void;
  onClose: () => void;
}

const intents: GiftIntent[] = [
  "Something I find hard to say",
  "A memory worth keeping",
  "What makes them special",
  "A world only we share",
];

const stepCopy: { title: string; question: string }[] = [
  {
    title: "Me?",
    question: "What do you want to express about yourself?",
  },
  {
    title: "Them?",
    question: "What makes this person uniquely them?",
  },
  {
    title: "The Gift?",
    question: "What would you like this gift to express?",
  },
  {
    title: "Gift Brief",
    question: "A starting point for something made with care.",
  },
];

const emptyAnswers: GiftCurationAnswers = {
  selected: { me: [], them: [], gift: [] },
  intent: null,
  note: "",
};

export default function GiftCurationFlow({
  frames,
  onClose,
  onCreateLabel,
  onExploreGiftIdeas,
  onKeepCollecting,
  onMakeZine,
  tags,
}: GiftCurationFlowProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<GiftCurationAnswers>(emptyAnswers);
  const [brief, setBrief] = useState<GiftBrief | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const materials = useMemo<BriefMaterial[]>(
    () => [
      ...tags.map((tag) => ({
        key: `label:${tag.id}`,
        text: tag.label,
      })),
      ...frames.map((frame) => ({
        key: `frame:${frame.id}`,
        text: frame.title,
      })),
    ],
    [frames, tags],
  );
  const section = (["me", "them", "gift"] as const)[step];

  function toggleMaterial(key: string) {
    if (!section) return;
    setAnswers((current) => {
      const selected = current.selected[section];
      return {
        ...current,
        selected: {
          ...current.selected,
          [section]: selected.includes(key)
            ? selected.filter((item) => item !== key)
            : [...selected, key],
        },
      };
    });
  }

  function createLabel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = newLabel.trim();
    if (!label) return;

    const created = onCreateLabel(label);
    if (!created || !section) return;

    const key = `label:${created.id}`;
    setAnswers((current) => ({
      ...current,
      selected: {
        ...current.selected,
        [section]: current.selected[section].includes(key)
          ? current.selected[section]
          : [...current.selected[section], key],
      },
    }));
    setNewLabel("");
  }

  function continueFlow() {
    if (step === 2) {
      setBrief(createGiftBrief(answers, materials));
    }
    setStep((current) => Math.min(current + 1, 3));
  }

  function updateBrief(field: keyof GiftBrief, value: string) {
    setBrief((current) => (current ? { ...current, [field]: value } : current));
  }

  const currentBrief =
    brief ?? createGiftBrief(answers, materials);

  return (
    <div className={styles.overlay} onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="curation-title"
        aria-describedby="curation-question"
      >
        <header className={styles.header}>
          <span className={styles.kicker}>KIN / GIFT CURATION</span>
          <button
            className={styles.close}
            type="button"
            onClick={onClose}
            aria-label="Close gift curation"
          >
            ×
          </button>
        </header>
        <div className={styles.progress} aria-label={`Step ${step + 1} of 4`}>
          {stepCopy.map((item, index) => (
            <span
              key={item.title}
              className={index <= step ? styles.progressActive : undefined}
              aria-current={index === step ? "step" : undefined}
            >
              0{index + 1} / {item.title}
            </span>
          ))}
        </div>

        <div className={styles.content}>
          <span className={styles.stepLabel}>STEP 0{step + 1} / 04</span>
          <h2 id="curation-title">{stepCopy[step].title}</h2>
          <p id="curation-question" className={styles.question}>
            {stepCopy[step].question}
          </p>

          {step < 3 ? (
            <>
              {step === 2 && (
                <fieldset className={styles.intentChoices}>
                  <legend>Choose an intention</legend>
                  {intents.map((intent) => (
                    <button
                      key={intent}
                      className={
                        answers.intent === intent
                          ? styles.intentSelected
                          : styles.intent
                      }
                      type="button"
                      aria-pressed={answers.intent === intent}
                      onClick={() =>
                        setAnswers((current) => ({ ...current, intent }))
                      }
                    >
                      {intent}
                    </button>
                  ))}
                </fieldset>
              )}
              <fieldset className={styles.materials}>
                <legend>
                  {step === 0
                    ? "Choose what tells your side of the story"
                    : step === 1
                      ? "Choose what feels distinctly them or yours together"
                      : "Choose the most important material"}
                </legend>
                {materials.length ? (
                  <div className={styles.materialList}>
                    {materials.map((material) => {
                      const selected = answers.selected[section!].includes(
                        material.key,
                      );
                      return (
                        <button
                          key={material.key}
                          className={
                            selected
                              ? styles.materialSelected
                              : styles.material
                          }
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleMaterial(material.key)}
                        >
                          <span aria-hidden="true">{selected ? "✓" : "+"}</span>
                          {material.text}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className={styles.emptyMaterials}>
                    Your board is ready for its first thought. Add one here to
                    bring it into this brief.
                  </p>
                )}
              </fieldset>
              <form className={styles.addForm} onSubmit={createLabel}>
                <label htmlFor="curation-new-label">Add a thought to your board</label>
                <div>
                  <input
                    id="curation-new-label"
                    value={newLabel}
                    maxLength={120}
                    onChange={(event) => setNewLabel(event.target.value)}
                    placeholder="A detail worth keeping"
                  />
                  <button type="submit">+ Add</button>
                </div>
              </form>
              {step === 2 && (
                <label className={styles.noteField}>
                  Add a sentence in your own words
                  <textarea
                    value={answers.note}
                    onChange={(event) =>
                      setAnswers((current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                    rows={2}
                    maxLength={500}
                    placeholder="What do you hope they feel?"
                  />
                </label>
              )}
            </>
          ) : (
            <div className={styles.briefFields}>
              <label>
                Me
                <textarea
                  value={currentBrief.me}
                  onChange={(event) => updateBrief("me", event.target.value)}
                  rows={3}
                />
              </label>
              <label>
                Them
                <textarea
                  value={currentBrief.them}
                  onChange={(event) => updateBrief("them", event.target.value)}
                  rows={3}
                />
              </label>
              <label>
                The Gift
                <textarea
                  value={currentBrief.gift}
                  onChange={(event) => updateBrief("gift", event.target.value)}
                  rows={4}
                />
              </label>
            </div>
          )}
        </div>

        <footer className={styles.actions}>
          {step > 0 ? (
            <button
              className={styles.back}
              type="button"
              onClick={() => setStep((current) => current - 1)}
            >
              ← Back
            </button>
          ) : (
            <button className={styles.back} type="button" onClick={onClose}>
              Cancel
            </button>
          )}
          {step < 3 ? (
            <button
              className={styles.next}
              type="button"
              disabled={step === 2 && !answers.intent}
              onClick={continueFlow}
            >
              {step === 2 ? "Create my brief →" : "Continue →"}
            </button>
          ) : (
            <div className={styles.exitActions}>
              <button
                className={styles.primary}
                type="button"
                onClick={() => onExploreGiftIdeas(currentBrief)}
              >
                Explore Gift Ideas →
              </button>
              <button
                className={styles.secondary}
                type="button"
                onClick={() => onMakeZine(currentBrief)}
              >
                Make a Zine / Publication
              </button>
              <button
                className={styles.back}
                type="button"
                onClick={() => onKeepCollecting(currentBrief)}
              >
                Keep Collecting
              </button>
            </div>
          )}
        </footer>
      </section>
    </div>
  );
}
