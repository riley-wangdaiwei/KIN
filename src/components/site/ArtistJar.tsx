"use client";

import { useCallback, useEffect, useRef } from "react";

const FRAME_COUNT = 19;
const FRAME_WIDTH = 900;
const FRAME_HEIGHT = 900;

// The homepage vase (public/jar/frames/vase_01..19.webp), driven by a
// wheel angle instead of scroll progress — the same frames JarScroll uses,
// the same crossfade between adjacent frames. One full wheel turn maps to
// one full turn of the jar: frame = (angle / 360) * 19. The frame value
// wraps through 19 back to 0, so the last frame crossfades into the first
// (vase_19 -> vase_01) instead of cutting — the loop has no visible seam.
type ArtistJarProps = {
  angle: number; // wheel angle in degrees; grows as the wheel turns
  reducedMotion: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export default function ArtistJar({
  angle,
  reducedMotion,
  className,
  style,
}: ArtistJarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<(HTMLImageElement | null)[]>(
    Array(FRAME_COUNT).fill(null),
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const frames = framesRef.current;
    const normalized = (((angle % 360) + 360) % 360) / 360;
    const frame = reducedMotion ? 0 : normalized * FRAME_COUNT;
    const lowerIndex = Math.floor(frame) % FRAME_COUNT;
    const fraction = frame - Math.floor(frame);
    const lower = frames[lowerIndex];
    const upper = frames[(lowerIndex + 1) % FRAME_COUNT];
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
  }, [angle, reducedMotion]);

  // The mount effect loads frames and resizes; it calls the latest draw
  // through this ref so it never has to re-run when the angle moves.
  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const frames = framesRef.current;
    let cancelled = false;

    const loadFrame = (index: number) => {
      if (cancelled || frames[index]) return;
      const image = new window.Image();
      frames[index] = image;
      image.decoding = "async";
      image.onload = () => {
        if (!cancelled) drawRef.current();
      };
      image.src = `/jar/frames/vase_${String(index + 1).padStart(2, "0")}.webp`;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(FRAME_WIDTH * dpr);
      canvas.height = Math.round(FRAME_HEIGHT * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawRef.current();
    };

    for (let index = 0; index < FRAME_COUNT; index += 1) loadFrame(index);
    resize();
    window.addEventListener("resize", resize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={FRAME_WIDTH}
      height={FRAME_HEIGHT}
      aria-hidden="true"
      className={className}
      style={style}
    />
  );
}
