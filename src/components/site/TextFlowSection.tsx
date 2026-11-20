"use client";

import { useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode, type Ref } from "react";

// React wrapper for the vendored TextFlow engine (public/textflow.js).
// Renders a <section data-flow> and creates one TextFlow instance for it
// once the script is loaded; destroys the instance on unmount or when
// refreshKey changes (new source content). The section's own children — the
// [data-flow-source] text and the [data-flow-obstacle] elements — are
// plain React markup; TextFlow only appends its word layer to the section.

export type TextFlowPlacement = {
  k: number;
  x: number;
  y: number;
  row: number;
  w: number;
};

export type TextFlowInstance = {
  layout: () => void;
  destroy: () => void;
  fall: () => void;
  // Where TextFlow put each word, index-aligned with nodes.
  placements: TextFlowPlacement[];
  nodes: HTMLElement[];
};

type TextFlowConstructor = new (root: HTMLElement) => TextFlowInstance;

type TextFlowElement = HTMLElement & { _textFlow?: TextFlowInstance };

declare global {
  interface Window {
    TextFlow?: TextFlowConstructor;
    initTextFlow?: (scope?: Document | HTMLElement) => TextFlowInstance[];
  }
}

let textFlowScriptPromise: Promise<void> | null = null;

function loadTextFlow(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("TextFlow needs the browser."));
  if (window.TextFlow) return Promise.resolve();
  if (!textFlowScriptPromise) {
    textFlowScriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/textflow.js";
      script.async = true;
      script.onload = () => {
        if (window.TextFlow) resolve();
        else reject(new Error("TextFlow did not load."));
      };
      script.onerror = () => reject(new Error("Could not load /textflow.js."));
      document.head.appendChild(script);
    });
  }
  return textFlowScriptPromise;
}

type TextFlowSectionProps = {
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
  // Turn off TextFlow's one-shot fall-in (callers that drive the motion
  // themselves, like the looping canvas stream). Default true.
  fall?: boolean;
  // Called with the instance when it is created, and with null when it is
  // destroyed, so callers can drive layout/placements themselves.
  onInstance?: (instance: TextFlowInstance | null) => void;
  onPointerDown?: (event: ReactPointerEvent<HTMLElement>) => void;
  ref?: Ref<HTMLElement>;
  // Re-create the TextFlow instance when the source content changes.
  refreshKey?: string;
  separator?: string;
  shape?: "fill" | "waterfall";
  style?: CSSProperties;
};

export default function TextFlowSection({
  ariaLabel,
  children,
  className,
  fall = true,
  onInstance,
  onPointerDown,
  ref,
  refreshKey,
  separator,
  shape = "fill",
  style,
}: TextFlowSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current as TextFlowElement | null;
    let instance: TextFlowInstance | null = null;
    let cancelled = false;
    void loadTextFlow()
      .then(() => {
        if (cancelled) return;
        if (!section) return;
        // The script auto-initialises [data-flow] sections when it loads;
        // reuse that instance when it exists instead of creating a second
        // one on the same section.
        window.initTextFlow?.();
        instance =
          section._textFlow ??
          (window.TextFlow ? new window.TextFlow(section) : null);
        if (instance) {
          section._textFlow = instance;
          onInstance?.(instance);
        }
      })
      .catch(() => {
        // Without the engine the section still shows its source text and
        // obstacles as plain content; nothing else breaks.
      });
    return () => {
      cancelled = true;
      if (instance) {
        onInstance?.(null);
        instance.destroy();
        if (section) delete section._textFlow;
      }
    };
  }, [onInstance, refreshKey]);

  return (
    <section
      aria-label={ariaLabel}
      className={className}
      data-flow
      data-flow-fall={fall ? undefined : "false"}
      data-flow-separator={separator}
      data-flow-shape={shape}
      onPointerDown={onPointerDown}
      ref={(element) => {
        sectionRef.current = element;
        if (typeof ref === "function") ref(element);
        else if (ref) ref.current = element;
      }}
      style={style}
    >
      {children}
    </section>
  );
}
