"use client";

import { useEffect, useRef } from "react";

const FRAME_COUNT = 181;
const FRAME_WIDTH = 630;
const FRAME_HEIGHT = 656;
const SMOOTHING = 0.12;

type JarScrollProps = {
  progress: number;
  reducedMotion: boolean;
};

export default function JarScroll({ progress, reducedMotion }: JarScrollProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const frames: (HTMLImageElement | null)[] = Array(FRAME_COUNT).fill(null);
    let currentFrame = 0;
    let lastDrawnFrame = -1;
    let animationFrame = 0;
    let deferredLoadTimeout = 0;
    let remainingLoadTimeout = 0;
    let cancelled = false;

    const draw = (frame: number, force = false) => {
      if (!force && Math.abs(frame - lastDrawnFrame) < 0.002) return;

      const lowerIndex = Math.floor(frame);
      const fraction = frame - lowerIndex;
      const lower = frames[lowerIndex];
      const upper = frames[Math.min(lowerIndex + 1, FRAME_COUNT - 1)];

      context.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
      if (lower?.complete && lower.naturalWidth > 0) {
        context.globalAlpha = 1;
        context.drawImage(lower, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);
      }
      if (fraction > 0 && upper?.complete && upper.naturalWidth > 0) {
        context.globalAlpha = fraction;
        context.drawImage(upper, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);
      }
      context.globalAlpha = 1;
      lastDrawnFrame = frame;
    };

    const loadFrame = (index: number) => {
      if (cancelled || frames[index]) return;
      const frame = new window.Image();
      frames[index] = frame;
      frame.decoding = "async";
      frame.onload = () => {
        if (!cancelled) draw(reducedMotion ? 0 : currentFrame, true);
      };
      frame.src = `/jar/frames/jar_${String(index).padStart(3, "0")}.webp`;
    };

    const loadRange = (start: number, end: number) => {
      for (let index = start; index <= end; index += 1) loadFrame(index);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(FRAME_WIDTH * dpr);
      canvas.height = Math.round(FRAME_HEIGHT * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(reducedMotion ? 0 : currentFrame, true);
    };

    loadRange(0, 5);
    resize();
    deferredLoadTimeout = window.setTimeout(() => loadRange(96, 180), 180);

    const loadRemainingFrames = () => loadRange(6, 95);
    remainingLoadTimeout = window.setTimeout(loadRemainingFrames, 700);

    window.addEventListener("resize", resize);

    if (reducedMotion) {
      draw(0, true);
    } else {
      const tick = () => {
        const normalized = Math.min(
          1,
          Math.max(0, (progressRef.current - 0.1) / 0.8),
        );
        const targetFrame = normalized * (FRAME_COUNT - 1);
        currentFrame += (targetFrame - currentFrame) * SMOOTHING;
        if (Math.abs(targetFrame - currentFrame) < 0.001) currentFrame = targetFrame;
        draw(currentFrame);
        animationFrame = window.requestAnimationFrame(tick);
      };
      animationFrame = window.requestAnimationFrame(tick);
    }

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(deferredLoadTimeout);
      window.clearTimeout(remainingLoadTimeout);
      window.removeEventListener("resize", resize);
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      width={FRAME_WIDTH}
      height={FRAME_HEIGHT}
      aria-hidden="true"
    />
  );
}
