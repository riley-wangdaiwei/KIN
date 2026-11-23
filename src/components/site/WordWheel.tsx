"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import styles from "./word-wheel.module.css";

// A ring of words circling a kettle as a tilted 3D carousel: the
// community page's replacement for the flowing waterfall. Each half runs
// one wheel — the left one carries the community question titles, the
// right one the people's canvas names. The ring is an ellipse around the
// kettle: words on the near (bottom) arc are larger and brighter and
// pass IN FRONT of the kettle; words on the far (top) arc are smaller
// and dimmer and pass BEHIND it — the kettle's own image occludes them,
// so each word disappears behind the kettle and re-emerges on the other
// side. The ring rotates slowly and forever; hovering (or focusing) a
// word pauses it, like the waterfall paused near the pointer. Clicking a
// word follows its link; the parent shows the hover preview (onHoverItem).
// The word at the rightmost point of the ring lights bright white.
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
  // Visible-content fractions of the kettle PNG (measured from the alpha
  // channel): the img box has transparent margins, so the occlusion test
  // below uses the visible rect, not the whole box.
  visibleFrac?: { x0: number; x1: number; y0: number; y1: number };
};

// The ring turns ~7 degrees per second — one slow revolution in ~50s.
// Time-based (not per-frame), so the speed holds on any frame rate.
const DEGREES_PER_MS = 0.0072;
// How flat the carousel sits: the vertical radius is this share of the
// horizontal one. Flat enough that the far arc dips inside the kettle's
// visible span (so words vanish behind it) and the near arc crosses its
// lower body (so words pass in front of it).
const TILT = 0.45;
// Arc length per word around the ring: neighbors sit closer than the old
// 130px, so the ring reads fuller — but not so close that the bottom arc
// (where the ellipse is flat and neighbors share a line) turns into one
// unreadable string. The slot count follows the ellipse perimeter, so a
// bigger ring holds more words.
const SLOT_ARC_PX = 80;
const MIN_SLOTS = 8;
const MAX_SLOTS = 18;
// Clearance between the ring and the kettle's visible edge (px), and the
// margin a word needs inside the half (px, ~half a word plus a breath).
const RING_CLEARANCE_PX = 24;
const EDGE_MARGIN_PX = 28;
// The ring never shrinks below half the kettle's width, or the words
// would sit on top of the kettle.
const MIN_RADIUS_SHARE = 0.52;
// The jar's visible content spans ~93% x 77% of its box, the pitcher's
// ~55% x 84% — a horizontal radius of 0.62 x the kettle width clears
// both, corners included, with the clearance above.
const RADIUS_SHARE = 0.62;
// Depth: how much bigger/brighter the near arc is than the far arc.
const SCALE_SPREAD = 0.15; // scale runs 0.85 (far) to 1.15 (near)
const OPACITY_FAR = 0.55; // opacity runs 0.55 (far) to 1 (near)
// The active word (rightmost point) reads a touch bigger than the rest.
const ACTIVE_SCALE_BOOST = 1.08;

function isReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Ramanujan's approximation of an ellipse's perimeter.
function ellipsePerimeter(a: number, b: number): number {
  return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
}

// Wrapped angular distance to 0° (the rightmost point), in degrees.
function angleDistToZero(deg: number): number {
  return Math.abs((((deg % 360) + 540) % 360) - 180);
}

type Geometry = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  kettle: { left: number; top: number; width: number; height: number };
};

export default function WordWheel({
  items,
  refreshKey = "",
  kettleRef,
  regionRef,
  onHoverItem,
  visibleFrac = { x0: 0, x1: 1, y0: 0, y1: 1 },
}: WordWheelProps) {
  const [angle, setAngle] = useState(0);
  const [geometry, setGeometry] = useState<Geometry>({
    cx: 0,
    cy: 0,
    rx: 0,
    ry: 0,
    kettle: { left: 0, top: 0, width: 0, height: 0 },
  });
  const angleRef = useRef(0);
  const pausedRef = useRef(false);
  const reducedMotion = isReducedMotion();

  // The ring is measured from the kettle's own rect, so it stays centered
  // on the kettle at every width — including mobile, where the kettles
  // shift toward their outer sides. The horizontal radius clears the
  // kettle's visible content and is capped so no word is clipped by the
  // half's edge; the vertical radius is the tilt share of it, capped by
  // the half's top and bottom edges.
  const measure = () => {
    const kettle = kettleRef.current;
    const region = regionRef.current;
    if (!kettle || !region) return;
    const k = kettle.getBoundingClientRect();
    const r = region.getBoundingClientRect();
    if (k.width === 0 || r.width === 0) return;
    const cx = k.left + k.width / 2 - r.left;
    const cy = k.top + k.height / 2 - r.top;
    const rx = Math.max(
      k.width * MIN_RADIUS_SHARE,
      Math.min(
        k.width * RADIUS_SHARE + RING_CLEARANCE_PX,
        cx - EDGE_MARGIN_PX,
        r.width - cx - EDGE_MARGIN_PX,
      ),
    );
    const ry = Math.max(
      48,
      Math.min(
        rx * TILT,
        cy - EDGE_MARGIN_PX,
        r.height - cy - EDGE_MARGIN_PX,
      ),
    );
    setGeometry({
      cx,
      cy,
      rx,
      ry,
      kettle: {
        left: k.left - r.left,
        top: k.top - r.top,
        width: k.width,
        height: k.height,
      },
    });
  };

  useEffect(() => {
    measure();
    const region = regionRef.current;
    const kettle = kettleRef.current;
    if (!region) return;
    const observer = new ResizeObserver(measure);
    observer.observe(region);
    // The kettle is absolutely positioned, so its own size change (the
    // image loading in) does not resize the region — observe it too, or
    // the stored kettle box (used by the occlusion test) goes stale.
    if (kettle) observer.observe(kettle);
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
    let last: number | null = null;
    const tick = (t: number) => {
      if (last === null) last = t;
      const dt = t - last;
      last = t;
      if (!pausedRef.current) {
        angleRef.current = (angleRef.current + dt * DEGREES_PER_MS) % 360;
        setAngle(angleRef.current);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion]);

  // Few items? Repeat them around the ring so it stays full (like the
  // homepage ring menu, which repeats its items to fill the track). The
  // slot count follows the ellipse perimeter, so neighbors sit closer
  // than they did on the old circle.
  const slots = useMemo(() => {
    if (items.length === 0 || geometry.rx === 0) return [];
    const slotCount = Math.max(
      MIN_SLOTS,
      Math.min(
        MAX_SLOTS,
        Math.floor(
          ellipsePerimeter(geometry.rx, geometry.ry) / SLOT_ARC_PX,
        ),
      ),
    );
    const repeats = Math.max(1, Math.ceil(slotCount / items.length));
    return Array.from({ length: repeats }, () => items)
      .flat()
      .slice(0, slotCount);
  }, [items, geometry.rx, geometry.ry]);

  // The word at the rightmost point of the ring lights bright white.
  const step = slots.length === 0 ? 360 : 360 / slots.length;
  let activeIndex = 0;
  for (let i = 1; i < slots.length; i++) {
    if (
      angleDistToZero(angle + i * step) <
      angleDistToZero(angle + activeIndex * step)
    ) {
      activeIndex = i;
    }
  }

  // The kettle's visible content as an ellipse (its PNG's alpha, not its
  // box): a far-arc word whose center falls inside it is behind opaque
  // pixels — hidden — so it must not be hoverable either.
  const k = geometry.kettle;
  const vx0 = k.left + visibleFrac.x0 * k.width;
  const vx1 = k.left + visibleFrac.x1 * k.width;
  const vy0 = k.top + visibleFrac.y0 * k.height;
  const vy1 = k.top + visibleFrac.y1 * k.height;
  const ex = (vx0 + vx1) / 2;
  const ey = (vy0 + vy1) / 2;
  const ea = (vx1 - vx0) / 2;
  const eb = (vy1 - vy0) / 2;
  const behindKettle = (x: number, y: number): boolean =>
    ea > 0 &&
    eb > 0 &&
    ((x - ex) / ea) ** 2 + ((y - ey) / eb) ** 2 < 1;

  if (slots.length === 0) return null;

  const words = slots.map((item, index) => {
    const radians = ((angle + index * step) * Math.PI) / 180;
    // Depth: -1 at the far (top) arc, +1 at the near (bottom) arc.
    const depth = Math.sin(radians);
    const x = geometry.cx + geometry.rx * Math.cos(radians);
    const y = geometry.cy + geometry.ry * Math.sin(radians);
    const front = depth >= 0;
    const isActive = index === activeIndex;
    const scale =
      (1 + SCALE_SPREAD * depth) * (isActive ? ACTIVE_SCALE_BOOST : 1);
    const opacity = isActive
      ? 1
      : OPACITY_FAR + (1 - OPACITY_FAR) * ((depth + 1) / 2);
    // A far word inside the kettle's visible ellipse is occluded by the
    // kettle itself: no pointer, so an invisible word never pauses the
    // ring or opens a preview.
    const occluded = !front && behindKettle(x, y);
    const style: CSSProperties = {
      left: x,
      top: y,
      transform: `translate(-50%, -50%) scale(${scale})`,
      opacity,
      // Nearer words stack above farther ones inside their layer.
      zIndex: Math.round(depth * 10),
      pointerEvents: occluded ? "none" : "auto",
    };
    return {
      front,
      node: (
        <a
          aria-label={item.label}
          className={`${styles.wheelWord} ${isActive ? styles.wheelWordActive : ""}`.trim()}
          data-active={isActive || undefined}
          data-slot={index}
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
          style={style}
          tabIndex={-1}
        >
          {item.label}
        </a>
      ),
    };
  });

  return (
    <div className={styles.wheelLayer} data-testid="word-wheel">
      <div className={styles.wheelLayerBack}>
        {words.filter((w) => !w.front).map((w) => w.node)}
      </div>
      <div className={styles.wheelLayerFront}>
        {words.filter((w) => w.front).map((w) => w.node)}
      </div>
    </div>
  );
}
