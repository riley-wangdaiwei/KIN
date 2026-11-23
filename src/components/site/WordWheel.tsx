"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import styles from "./word-wheel.module.css";

// A ring of words circling a kettle: the community page's replacement for
// the flowing waterfall. Each half runs one wheel — the left one carries
// the community question titles, the right one the people's canvas names.
// The ring rotates slowly and forever; hovering (or focusing) a word
// pauses it, like the waterfall paused near the pointer. Clicking a word
// follows its link; the parent shows the hover preview (onHoverItem).
// Reduced motion: a static ring, no rotation.
export type WordWheelItem = {
  label: string;
  href: string;
};

type WordWheelProps = {
  items: WordWheelItem[];
  refreshKey?: string;
  kettleRef: RefObject<HTMLImageElement | null>;
  regionRef: RefObject<HTMLElement | null>;
  onHoverItem?: (item: { label?: string; href?: string } | null) => void;
};

// The ring turns ~7 degrees per second — one slow revolution in ~50s.
const DEGREES_PER_FRAME = 0.12;
// Arc length per word around the ring: neighbors never touch, even for
// the longest (10rem-truncated) labels. The slot count follows the
// radius — a bigger ring holds more words, a small one fewer (down to
// six, so the words still fit whole on a phone).
const SLOT_ARC_PX = 130;
const MIN_SLOTS = 6;
const MAX_SLOTS = 12;
// Clearance between the ring and the kettle's visible edge (px), and the
// margin a word needs inside the half (px, ~half a word plus a breath).
const RING_CLEARANCE_PX = 24;
const EDGE_MARGIN_PX = 28;
// The ring never shrinks below half the kettle's width, or the words
// would sit on top of the kettle.
const MIN_RADIUS_SHARE = 0.52;
// The jar's visible content spans ~93% x 77% of its box, the pitcher's
// ~55% x 84% — a radius of 0.62 x the kettle width clears both, corners
// included, with the clearance above.
const RADIUS_SHARE = 0.62;

function isReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

type Geometry = { cx: number; cy: number; radius: number };

export default function WordWheel({
  items,
  refreshKey = "",
  kettleRef,
  regionRef,
  onHoverItem,
}: WordWheelProps) {
  const [angle, setAngle] = useState(0);
  const [geometry, setGeometry] = useState<Geometry>({
    cx: 0,
    cy: 0,
    radius: 0,
  });
  const angleRef = useRef(0);
  const pausedRef = useRef(false);
  const reducedMotion = isReducedMotion();

  // The ring is measured from the kettle's own rect, so it stays centered
  // on the kettle at every width — including mobile, where the kettles
  // shift toward their outer sides. The radius clears the kettle's visible
  // content and is capped so no word is clipped by the half's edge.
  const measure = () => {
    const kettle = kettleRef.current;
    const region = regionRef.current;
    if (!kettle || !region) return;
    const k = kettle.getBoundingClientRect();
    const r = region.getBoundingClientRect();
    if (k.width === 0 || r.width === 0) return;
    const cx = k.left + k.width / 2 - r.left;
    const cy = k.top + k.height / 2 - r.top;
    const radius = Math.max(
      k.width * MIN_RADIUS_SHARE,
      Math.min(
        k.width * RADIUS_SHARE + RING_CLEARANCE_PX,
        cx - EDGE_MARGIN_PX,
        r.width - cx - EDGE_MARGIN_PX,
        cy - EDGE_MARGIN_PX,
        r.height - cy - EDGE_MARGIN_PX,
      ),
    );
    setGeometry({ cx, cy, radius });
  };

  useEffect(() => {
    measure();
    const region = regionRef.current;
    if (!region) return;
    const observer = new ResizeObserver(measure);
    observer.observe(region);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
    // Re-measure when the data loads (the halves resize around it).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // Start at a random point on the ring (set after mount, so the server
  // and the first client render agree).
  useEffect(() => {
    angleRef.current = Math.random() * 360;
    setAngle(angleRef.current);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    let frame = 0;
    const tick = () => {
      if (!pausedRef.current) {
        angleRef.current = (angleRef.current + DEGREES_PER_FRAME) % 360;
        setAngle(angleRef.current);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion]);

  // Few items? Repeat them around the ring so it stays full (like the
  // homepage ring menu, which repeats its items to fill the track). The
  // slot count follows the radius, so neighbors never touch.
  const slots = useMemo(() => {
    if (items.length === 0) return [];
    const slotCount = Math.max(
      MIN_SLOTS,
      Math.min(
        MAX_SLOTS,
        Math.floor((2 * Math.PI * geometry.radius) / SLOT_ARC_PX),
      ),
    );
    const repeats = Math.max(1, Math.ceil(slotCount / items.length));
    return Array.from({ length: repeats }, () => items)
      .flat()
      .slice(0, slotCount);
  }, [items, geometry.radius]);

  if (slots.length === 0) return null;
  const step = 360 / slots.length;

  return (
    <div className={styles.wheelLayer} data-testid="word-wheel">
      {slots.map((item, index) => {
        const radians = ((angle + index * step) * Math.PI) / 180;
        const x = geometry.cx + geometry.radius * Math.cos(radians);
        const y = geometry.cy + geometry.radius * Math.sin(radians);
        return (
          <a
            aria-label={item.label}
            className={styles.wheelWord}
            href={item.href}
            key={`${item.href}-${index}`}
            onBlur={() => {
              pausedRef.current = false;
              onHoverItem?.(null);
            }}
            onFocus={() => {
              pausedRef.current = true;
              onHoverItem?.({ label: item.label, href: item.href });
            }}
            onMouseEnter={() => {
              pausedRef.current = true;
              onHoverItem?.({ label: item.label, href: item.href });
            }}
            onMouseLeave={() => {
              pausedRef.current = false;
              onHoverItem?.(null);
            }}
            style={{ left: x, top: y }}
            tabIndex={-1}
          >
            {item.label}
          </a>
        );
      })}
    </div>
  );
}
