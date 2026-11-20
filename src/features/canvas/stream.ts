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

// One row of the stream: the weekly question rides as a single row
// labelled "prompt" — dragging it answers the whole question
// (questionLabel keeps the full question for the row's accessible name).
export type StreamRowTemplate = {
  kind: "word" | "image" | "question";
  label?: string;
  imageSrc?: string;
  stickerKey?: string;
  questionId?: string;
  questionLabel?: string;
  // Fixed lateral fraction inside the fall (0 = left edge, 1 = right
  // edge). Rows without one get a fresh random fraction on each fall.
  frac?: number;
};

export function buildStreamRows(question: CommunityQuestion | null = null): StreamRowTemplate[] {
  return buildStreamCycle(question).map((item) =>
    item.kind === "question"
      ? {
          kind: "question" as const,
          label: "prompt",
          questionId: item.questionId,
          questionLabel: item.label,
        }
      : item,
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
    // "title" adds a person: dragging it opens the add-a-person prompt
    // (the prompt wording stays "Their name").
    { kind: "word", label: "title" },
    { kind: "word", label: "stickers" },
    { kind: "word", label: "details" },
    { kind: "word", label: "title" },
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
