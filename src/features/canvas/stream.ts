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
