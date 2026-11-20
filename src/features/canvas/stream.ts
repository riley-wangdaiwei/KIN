import type { CommunityQuestion } from "@/lib/storage/canvas-adapter";

// One item of the canvas stream cycle, as the drop dispatch reads it.
export type StreamCycleItem = {
  kind: "word" | "image" | "question";
  label?: string;
  imageSrc?: string;
  stickerKey?: string;
  questionId?: string;
};

const providedStickerKeys = ["humankind", "rekin", "love", "foto"] as const;

const stickerImageSources: Record<string, string> = {
  humankind: "/stickers/humankind.png",
  rekin: "/stickers/rekin.png",
  love: "/stickers/love.png",
  foto: "/stickers/foto.png",
};

// One row of the stream: the cycle expanded so the weekly question rides
// as one contiguous block of words — consecutive rows, one shared lateral
// fraction, readable top-to-bottom as a phrase. Dragging any one word
// answers the whole question (questionLabel keeps the full question for
// the row's accessible name).
export type StreamRowTemplate = {
  kind: "word" | "image" | "question";
  label?: string;
  imageSrc?: string;
  stickerKey?: string;
  questionId?: string;
  questionLabel?: string;
  // Fixed lateral fraction inside the fall; the question's words share one
  // (the fall's center, full opacity) so they stay together as a block.
  // Other rows get a fresh random fraction on each fall.
  frac?: number;
};

export function buildStreamRows(question: CommunityQuestion | null = null): StreamRowTemplate[] {
  return buildStreamCycle(question).flatMap((item) =>
    item.kind === "question"
      ? (item.label ?? "")
          .split(/\s+/)
          .filter(Boolean)
          // The stream lays out top-to-bottom in reverse sequence order
          // (new items enter above the top), so the words are stored
          // reversed — on screen they read top-to-bottom as the question.
          .reverse()
          .map((word) => ({
            kind: "question" as const,
            label: word,
            questionId: item.questionId,
            questionLabel: item.label,
            frac: 0.5,
          }))
      : [item],
  );
}

// The stream cycle: the same words, provided sticker images and (once per
// cycle) the weekly community question that the stream has always run.
export function buildStreamCycle(question: CommunityQuestion | null = null): StreamCycleItem[] {
  const stickerImages = providedStickerKeys.map((key) => ({
    kind: "image" as const,
    imageSrc: stickerImageSources[key],
    stickerKey: key,
  }));
  const cycle = [
    { kind: "word", label: "stickers" },
    { kind: "word", label: "details" },
    { kind: "word", label: "people" },
    { kind: "word", label: "stickers" },
    { kind: "word", label: "details" },
    { kind: "word", label: "people" },
    { kind: "word", label: "images" },
    { kind: "word", label: "jars" },
    ...stickerImages,
    // The weekly community question rides the stream once per cycle, so
    // it shows up in the user's own stream without taking it over.
    ...(question
      ? [{ kind: "question" as const, label: question.question, questionId: question.id }]
      : []),
  ] as const;

  return cycle.map((item) => ({ ...item }));
}
