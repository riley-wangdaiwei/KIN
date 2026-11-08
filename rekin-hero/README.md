# re.KIN hero animation

A looping animation of the clay vase turning between the two glass hands, built from the 4 product renders.

## Files

| File | What it is |
|---|---|
| `assets/hero.mp4` | 11.4 s seamless loop, 1542×688, H.264, ~4.5 MB, web-optimised (faststart) |
| `assets/hero-poster.jpg` | First frame — shown while the video loads and for reduced-motion users |
| `assets/rekin-logo.png` | re.KIN logo, off-white on transparent |
| `index.html` | Working demo with two variants (open it in a browser) |

Sequence: side → tilted (rim) → top-down → tilted → side → bottom → back to side. The hands stay fixed; only the vase moves.

## Instructions for a coding agent / CLI

Copy `assets/` into the site's public/static folder, then add the hero:

**Variant A — autoplay loop (recommended)**

```html
<section class="rk-hero">
  <video src="/assets/hero.mp4" poster="/assets/hero-poster.jpg"
         autoplay muted loop playsinline preload="auto"
         style="width:min(100%,1542px);height:auto;display:block"></video>
</section>
```

- `muted` + `playsinline` are required for autoplay on iOS/Safari and Chrome.
- Page background should be near-black (`#050608`) so the video edges disappear.

**Variant B — scroll-driven (vase turns as the visitor scrolls)**
See the `.rk-scrub` section and the small script in `index.html`: a tall section (400vh) with a sticky video whose `currentTime` follows scroll progress.

**React / Next.js**

```jsx
export default function Hero() {
  return (
    <section className="min-h-screen grid place-items-center bg-[#050608]">
      <video src="/assets/hero.mp4" poster="/assets/hero-poster.jpg"
             autoPlay muted loop playsInline preload="auto"
             className="w-full max-w-[1542px] h-auto" />
    </section>
  );
}
```

## Notes

- The in-between frames are interpolated from 4 still images, so transitions are a smooth morph/dissolve rather than a true 3D rotation. For a real rotation, replace `hero.mp4` with a video rendered from the 3D source (same filename — no code changes needed).
- Respect `prefers-reduced-motion` (the demo falls back to the poster image).
