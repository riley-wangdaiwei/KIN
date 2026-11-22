export type QuizResultId = "poem" | "places" | "album" | "game";

export interface QuizQuestion {
  id: string;
  title: string;
  options: string[];
  hasOther: boolean;
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: "person",
    title: "Who's your person?",
    options: ["My best friend", "My partner", "Family", "Someone special"],
    hasOther: true,
  },
  {
    id: "occasion",
    title: "What are we celebrating?",
    options: ["Their birthday", "A big milestone", "Nothing, just because"],
    hasOther: true,
  },
  {
    id: "sunday",
    title: "Their perfect Sunday looks like…",
    options: [
      "Curled up with a book",
      "Out exploring somewhere new",
      "Making something with their hands",
      "A long dinner with friends",
    ],
    hasOther: false,
  },
  {
    id: "kind",
    title: "They're the kind of person who…",
    options: [
      "Notices the tiny things",
      "Has a very niche obsession",
      "Shares a story only you two know",
      "Is hard to describe, you just *know*",
    ],
    hasOther: false,
  },
  {
    id: "weather",
    title: "If they were a weather, they'd be…",
    options: ["Golden hour", "First snow", "A summer storm", "Soft rain on a window"],
    hasOther: false,
  },
  {
    id: "gesture",
    title: "How big a gesture?",
    options: [
      "A thoughtful surprise ($50–100)",
      "A real wow ($100–250)",
      "Go all out ($250+)",
    ],
    hasOther: false,
  },
  {
    id: "timing",
    title: "How's the clock looking?",
    options: [
      "It's very soon (help!)",
      "Sometime this month",
      "I'm planning ahead (1–3 months)",
      "No rush",
    ],
    hasOther: false,
  },
];

export const resultTexts: Record<QuizResultId, string> = {
  poem: "They look like someone who should receive an interactive poem.",
  places:
    "They look like someone who should receive a game of the places only you two have shared.",
  album: "They look like someone who should receive an interactive photo album.",
  game: "They look like someone who should receive a small game made just for them.",
};

// Q03 (their perfect Sunday) and Q04 (the kind of person they are) each point
// at the same four results. When they disagree, Q04 decides.
const sundayResults: Record<string, QuizResultId> = {
  "Curled up with a book": "poem",
  "Out exploring somewhere new": "places",
  "Making something with their hands": "game",
  "A long dinner with friends": "album",
};

const kindResults: Record<string, QuizResultId> = {
  "Notices the tiny things": "poem",
  "Has a very niche obsession": "game",
  "Shares a story only you two know": "places",
  "Is hard to describe, you just *know*": "album",
};

const energyLines: Record<string, string> = {
  "Golden hour": "Golden hour energy.",
  "First snow": "First snow energy.",
  "A summer storm": "Summer storm energy.",
  "Soft rain on a window": "Soft rain energy.",
};

export function computeResult(answers: Record<string, string>): {
  result: QuizResultId;
  energy: string | null;
} {
  const result = kindResults[answers.kind] ?? sundayResults[answers.sunday] ?? "poem";
  return { result, energy: energyLines[answers.weather] ?? null };
}
