import type { TasteTag } from "@/features/taste/types";
import type { WorldFrame } from "@/features/world/types";

export const exampleLabels: TasteTag[] = [
  {
    id: "example-tickets",
    label: "collects old tickets",
    x: 68,
    y: 160,
    groupIds: [],
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "example-train",
    label: "our midnight train",
    x: 270,
    y: 355,
    groupIds: [],
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "example-museums",
    label: "loves obscure museums",
    x: 470,
    y: 230,
    groupIds: [],
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

export const exampleFrames: WorldFrame[] = [
  { id: "example-quirks", title: "Their little quirks", x: 30, y: 80, width: 255, height: 200 },
  { id: "example-places", title: "Places we've been", x: 335, y: 275, width: 265, height: 205 },
  {
    id: "example-understand",
    title: "Things only we understand",
    x: 520,
    y: 80,
    width: 260,
    height: 210,
  },
];

export const presetFrames = [
  "Their little quirks",
  "Places we've been",
  "Things only we understand",
  "Things I admire",
  "Things that remind me of them",
  "Our shared memories",
] as const;
