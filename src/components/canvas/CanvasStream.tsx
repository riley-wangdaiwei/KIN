"use client";

import { useMemo } from "react";
import Waterfall, {
  type WaterfallDragState,
  type WaterfallDropItem,
  type WaterfallDropTarget,
} from "@/components/site/Waterfall";
import { buildStreamRows } from "@/features/canvas/stream";
import type { CommunityQuestion } from "@/lib/storage/canvas-adapter";

// The canvas stream: the shared flowing waterfall, fed with the canvas
// cycle — words, provided images, jars, and the weekly question as the
// single word "prompt". The drag-to-add dispatch lives in CanvasWorkspace.
export type StreamDropItem = WaterfallDropItem;
export type StreamDropTarget = WaterfallDropTarget;
export type StreamDragState = WaterfallDragState;

type CanvasStreamProps = {
  question: CommunityQuestion | null;
  onDragState: (state: StreamDragState) => void;
  onDropItem: (item: StreamDropItem, target: StreamDropTarget) => void;
};

export default function CanvasStream({ question, onDragState, onDropItem }: CanvasStreamProps) {
  const templates = useMemo(() => buildStreamRows(question), [question]);
  return (
    <Waterfall
      onDragState={onDragState}
      onDropItem={onDropItem}
      refreshKey={question?.id ?? ""}
      templates={templates}
    />
  );
}
