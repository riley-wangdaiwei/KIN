/*
 * TextFlow: dense text that fills a section edge to edge, wraps tightly
 * around objects (following their real shape), and falls into place.
 * No dependencies. Works for any section on the site.
 *
 * Add to any page: <script src="textflow.js"></script>
 *
 * Markup:
 *   <section data-flow>
 *     <div data-flow-source>Your text. <a href="/canvas/1">riley's</a> more text…</div>
 *     <img data-flow-obstacle data-flow-drag src="jug.png" style="left:40%;top:30%;width:180px">
 *   </section>
 *
 * Options (data attributes on the section, or JS options):
 *   data-flow-gap="10"          space between text and objects, px
 *   data-flow-line-height="1.15" line height as a multiple of font size
 *   data-flow-fill="true"       repeat the text until the whole section is full
 *   data-flow-justify="true"    stretch each line so it touches both edges
 *   data-flow-fall="true"       words fall into place when the section comes into view
 *   data-flow-order="top"       fall order: top | bottom | random
 *   data-flow-separator=""      text inserted between repeats, e.g. "·"
 *   data-flow-max-stretch="3"   biggest word gap when stretching, in spaces
 *   data-flow-min-segment="36"  skip gaps beside objects narrower than this, px
 *
 * Waterfall shape (narrow at the top, wide at the bottom):
 *   data-flow-shape="waterfall"
 *   data-flow-top="0.1"        width at the top, share of the section width
 *   data-flow-bottom="0.6"       width at the bottom
 *   data-flow-curve="2.6"       higher = stays narrow longer, then spreads out
 *   data-flow-center="0.5"      horizontal centre of the fall
 *   data-flow-ragged="10"       how uneven the edges are, px
 *   data-flow-fade-edges="true" words near the edges are fainter
 *
 * Objects: any element with data-flow-obstacle inside the section. Images with a
 * transparent background are wrapped by their real outline (the image must be on
 * your own domain, or served with CORS); other elements are wrapped by their box.
 * Add data-flow-drag to let visitors drag an object. Style words with .tf-w.
 */

(function () {
const DEFAULTS = {
  gap: 10,
  lineHeight: 1.15,
  fill: true,
  justify: true,
  fall: true,
  order: 'top',
  separator: '',
  minSegment: 36,
  maxStretch: 3,
  shape: 'fill',      // fill | waterfall
  top: 0.1,          // waterfall: width at the top, share of section width
  bottom: 0.6,         // waterfall: width at the bottom
  curve: 2.6,         // waterfall: higher = stays narrow longer, then spreads
  center: 0.5,        // waterfall: horizontal centre, share of section width
  ragged: 10,         // waterfall: how uneven the edges are, px
  fadeEdges: true,    // waterfall: words near the edges are fainter, like spray
  alphaThreshold: 24,
  fallDistance: 140,
  fallDuration: 1000,
  fallSpread: 1400,
};

const REDUCED = typeof matchMedia !== 'undefined' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches;

const CSS = `
.tf-root{position:relative;overflow:hidden}
.tf-layer{position:absolute;inset:0;pointer-events:none;z-index:0}
.tf-w{position:absolute;left:0;top:0;white-space:nowrap;will-change:transform;
  line-height:var(--tf-lh);height:var(--tf-lh);opacity:var(--tf-o,1);
  transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .3s}
.tf-layer a{pointer-events:auto}
.tf-instant .tf-w{transition:none}
.tf-dragging .tf-w{transition:transform .18s cubic-bezier(.2,.8,.2,1)}
.tf-waiting .tf-w{opacity:0}
.tf-root [data-flow-source]{position:absolute!important;width:1px;height:1px;overflow:hidden;
  clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}
.tf-root [data-flow-obstacle]{position:absolute;z-index:1;user-select:none;-webkit-user-drag:none}
.tf-root [data-flow-drag]{cursor:grab;touch-action:none}
.tf-root [data-flow-drag]:active{cursor:grabbing}
.tf-measure{position:absolute;visibility:hidden;white-space:nowrap;left:-9999px;top:0}
`;

function injectCSS() {
  if (document.getElementById('tf-css')) return;
  const s = document.createElement('style');
  s.id = 'tf-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}

function readData(el) {
  const out = {};
  for (const key of Object.keys(DEFAULTS)) {
    const attr = 'flow' + key[0].toUpperCase() + key.slice(1);
    const v = el.dataset[attr];
    if (v === undefined) continue;
    if (typeof DEFAULTS[key] === 'number') out[key] = parseFloat(v);
    else if (typeof DEFAULTS[key] === 'boolean') out[key] = v !== 'false';
    else out[key] = v;
  }
  return out;
}

// Turn the source into tokens: plain words, or whole inline elements (links, names).
function parseTokens(source) {
  const tokens = [];
  const walk = (node) => {
    for (const child of node.childNodes) {
      if (child.nodeType === 3) {
        for (const w of child.textContent.split(/\s+/)) if (w) tokens.push({ text: w });
      } else if (child.nodeType === 1) {
        if (child.matches('a, [data-flow-token]') || !child.children.length) {
          tokens.push({ el: child });
        } else {
          walk(child);
        }
      }
    }
  };
  walk(source);
  return tokens;
}

class TextFlow {
  constructor(root, options = {}) {
    injectCSS();
    this.root = root;
    this.o = { ...DEFAULTS, ...readData(root), ...options };
    if (REDUCED) this.o.fall = false;
    this.source = root.querySelector('[data-flow-source]');
    this.obstacles = [...root.querySelectorAll('[data-flow-obstacle]')];
    root.classList.add('tf-root');

    this.layer = document.createElement('div');
    this.layer.className = 'tf-layer tf-instant';
    this.layer.setAttribute('aria-hidden', 'true');
    root.appendChild(this.layer);

    this.tokens = parseTokens(this.source);
    if (this.o.separator) this.tokens.push({ text: this.o.separator, sep: true });
    this.nodes = [];
    this.masks = new Map();
    this.placements = [];
    this.fallen = !this.o.fall;
    this.ready = this._init();
  }

  async _init() {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    await Promise.all(this.obstacles.map((o) => this._loadMask(o)));
    this._measure();
    if (!this.fallen) this.layer.classList.add('tf-waiting');
    this.layout();
    requestAnimationFrame(() => this.layer.classList.remove('tf-instant'));

    let resizeQueued = false;
    this._ro = new ResizeObserver(() => {
      if (resizeQueued) return;
      resizeQueued = true;
      requestAnimationFrame(async () => {
        resizeQueued = false;
        await Promise.all(this.obstacles.map((o) => this._loadMask(o)));
        this._measure();
        this.layout();
      });
    });
    this._ro.observe(this.root);
    this.obstacles.forEach((o) => this._ro.observe(o));

    if (!this.fallen) {
      this._io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          this._io.disconnect();
          this.fall();
        }
      }, { threshold: 0.25 });
      this._io.observe(this.root);
    }

    this.obstacles.filter((o) => o.hasAttribute('data-flow-drag')).forEach((o) => this._makeDraggable(o));
  }

  // ---------- measuring ----------

  _measure() {
    const probe = document.createElement('span');
    probe.className = 'tf-w tf-measure';
    probe.textContent = 'x';
    this.layer.appendChild(probe);
    const cs = getComputedStyle(probe);
    const fontSize = parseFloat(cs.fontSize);
    this.lh0 = fontSize * this.o.lineHeight;

    const box = document.createElement('div');
    box.className = 'tf-measure';
    const items = this.tokens.map((t) => {
      const n = this._makeNode(t);
      n.classList.add('tf-measure');
      n.style.position = 'static';
      box.appendChild(n);
      return n;
    });
    const space = document.createElement('span');
    space.className = 'tf-w';
    space.style.position = 'static';
    space.innerHTML = 'x&nbsp;x';
    const xx = document.createElement('span');
    xx.className = 'tf-w';
    xx.style.position = 'static';
    xx.textContent = 'xx';
    box.append(space, xx);
    this.layer.appendChild(box);
    this.widths = items.map((n) => n.getBoundingClientRect().width);
    this.space = space.getBoundingClientRect().width - xx.getBoundingClientRect().width;
    box.remove();
    probe.remove();
  }

  _makeNode(token) {
    let n;
    if (token.el) {
      n = token.el.cloneNode(true);
      n.removeAttribute('id');
      n.setAttribute('tabindex', '-1');
    } else {
      n = document.createElement('span');
      n.textContent = token.text;
      if (token.sep) n.classList.add('tf-sep');
    }
    n.classList.add('tf-w');
    return n;
  }

  // ---------- obstacle shapes ----------

  async _loadMask(o) {
    const w = Math.round(o.offsetWidth);
    const h = Math.round(o.offsetHeight);
    const prev = this.masks.get(o);
    if (prev && prev.w === w && prev.h === h) return;
    const mask = { w, h, minX: null, maxX: null };
    this.masks.set(o, mask);
    if (o.tagName !== 'IMG' || !w || !h) return;
    if (!o.complete) await new Promise((r) => { o.onload = o.onerror = r; });
    try {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(o, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      const minX = new Int16Array(h).fill(-1);
      const maxX = new Int16Array(h).fill(-1);
      const t = this.o.alphaThreshold;
      for (let y = 0; y < h; y++) {
        const row = y * w * 4;
        for (let x = 0; x < w; x++) {
          if (data[row + x * 4 + 3] > t) { minX[y] = x; break; }
        }
        if (minX[y] < 0) continue;
        for (let x = w - 1; x >= 0; x--) {
          if (data[row + x * 4 + 3] > t) { maxX[y] = x; break; }
        }
      }
      mask.minX = minX;
      mask.maxX = maxX;
    } catch (e) {
      // Image from another domain without CORS: fall back to its box.
    }
  }

  // Horizontal range an obstacle covers within a line band, or null.
  _blocked(o, y0, y1) {
    const g = this.o.gap;
    const left = o.offsetLeft;
    const top = o.offsetTop;
    const m = this.masks.get(o);
    if (!m || !m.w) return null;
    const a = Math.max(0, Math.floor(y0 - g - top));
    const b = Math.min(m.h - 1, Math.ceil(y1 + g - top));
    if (a > b) return null;
    if (!m.minX) return [left - g, left + m.w + g];
    let lo = Infinity;
    let hi = -Infinity;
    for (let y = a; y <= b; y++) {
      if (m.minX[y] < 0) continue;
      if (m.minX[y] < lo) lo = m.minX[y];
      if (m.maxX[y] > hi) hi = m.maxX[y];
    }
    if (lo === Infinity) return null;
    return [left + lo - g, left + hi + g];
  }

  // Left and right edge of the text area at height y.
  _bounds(y, W, H, row) {
    if (this.o.shape !== 'waterfall' || !H) return [0, W];
    const t = Math.min(1, Math.max(0, y / H));
    const share = this.o.top + (this.o.bottom - this.o.top) * Math.pow(t, this.o.curve);
    const half = (share * W) / 2;
    const c = this.o.center * W;
    const j = this.o.ragged;
    const nl = j * (Math.sin(row * 12.9898) * 0.5 + Math.sin(row * 4.1414) * 0.5);
    const nr = j * (Math.sin(row * 7.2331) * 0.5 + Math.sin(row * 2.7183) * 0.5);
    return [Math.max(0, c - half + nl), Math.min(W, c + half + nr)];
  }

  _segments(y0, y1, W, H, row) {
    const [L, R] = this._bounds(y0, W, H, row);
    this._L = L;
    this._R = R;
    let segs = [[L, R]];
    for (const o of this.obstacles) {
      const r = this._blocked(o, y0, y1);
      if (!r) continue;
      const next = [];
      for (const [s, e] of segs) {
        if (r[1] <= s || r[0] >= e) { next.push([s, e]); continue; }
        if (r[0] > s) next.push([s, r[0]]);
        if (r[1] < e) next.push([r[1], e]);
      }
      segs = next;
    }
    return segs.filter(([s, e]) => e - s >= this.o.minSegment);
  }

  // ---------- layout ----------

  layout() {
    const W = this.root.clientWidth;
    const H = this.root.clientHeight;
    const n = this.tokens.length;
    if (!n || !W) return;
    const fill = this.o.fill && H > 0;
    const rows = fill ? Math.max(1, Math.floor(H / this.lh0)) : Infinity;
    const lh = fill ? H / rows : this.lh0;
    this.root.style.setProperty('--tf-lh', lh + 'px');

    const out = [];
    let k = 0;
    for (let r = 0; r < rows && r < 4000; r++) {
      if (!fill && k >= n) break;
      const y = r * lh;
      for (const [s, e] of this._segments(y, y + lh, W, H, r)) {
        if (!fill && k >= n) break;
        const segW = e - s;
        const line = [];
        let used = 0;
        while (fill || k + line.length < n) {
          const w = this.widths[(k + line.length) % n];
          const need = used + (line.length ? this.space : 0) + w;
          if (need > segW && line.length) break;
          if (need > segW && segW < this._R - this._L - 0.5) break;
          line.push(w);
          used = need;
          if (need > segW) break;
        }
        if (!line.length) continue;
        const lastLine = !fill && k + line.length >= n;
        // Stretch the line to fill its space, but never leave huge holes:
        // whatever can't be stretched goes on the side facing the object.
        let gapW = this.space;
        if (this.o.justify && line.length > 1 && !lastLine) {
          gapW = Math.min(this.space + (segW - used) / (line.length - 1), this.space * this.o.maxStretch);
        }
        const total = used + (gapW - this.space) * (line.length - 1);
        let x = s;
        if (this.o.justify && !lastLine) {
          const L = this._L, R = this._R;
          if (e >= R - 0.5 && s > L + 0.5) x = e - total;           // hug the right edge
          else if (s > L + 0.5 && e < R - 0.5) x = s + (segW - total) / 2; // between two objects
        }
        for (const w of line) {
          out.push({ k, x, y, row: r, w });
          x += w + gapW;
          k++;
        }
      }
    }
    if (!fill) this.root.style.height = Math.ceil(out.length ? out[out.length - 1].y + lh : 0) + 'px';
    this.H = fill ? H : out.length ? out[out.length - 1].y + lh : 0;
    this.W = W;
    this.placements = out;
    this._render();
  }

  _render() {
    const n = this.tokens.length;
    const p = this.placements;
    for (let i = 0; i < p.length; i++) {
      let node = this.nodes[i];
      if (!node) {
        node = this._makeNode(this.tokens[p[i].k % n]);
        node.style.transform = `translate(${p[i].x}px,${p[i].y}px)`;
        this.layer.appendChild(node);
        this.nodes[i] = node;
      }
      node.style.display = '';
      if (this.o.shape === 'waterfall' && this.o.fadeEdges) {
        const [L, R] = this._bounds(p[i].y, this.W, this.H, p[i].row);
        const mid = p[i].x + p[i].w / 2;
        const edge = Math.min(mid - L, R - mid) / Math.max(1, (R - L) / 2);
        node.style.setProperty('--tf-o', (0.35 + 0.65 * Math.min(1, edge * 2.2)).toFixed(2));
      }
      node.style.transform = `translate(${p[i].x}px,${p[i].y}px)`;
    }
    for (let i = p.length; i < this.nodes.length; i++) this.nodes[i].style.display = 'none';
  }

  // ---------- falling ----------

  fall() {
    if (this.fallen) return;
    this.fallen = true;
    const { fallDistance: d, fallDuration: dur, fallSpread: spread, order } = this.o;
    const H = this.H || 1;
    const W = this.W || 1;
    this.placements.forEach((p, i) => {
      const node = this.nodes[i];
      let t;
      if (order === 'bottom') t = 1 - p.y / H;
      else if (order === 'random') t = Math.random();
      else t = p.y / H;
      const delay = t * spread + (p.x / W) * 160 + Math.random() * 220;
      const drop = d * (0.6 + Math.random() * 0.8);
      const tilt = (Math.random() - 0.5) * 14;
      const op = parseFloat(node.style.getPropertyValue('--tf-o')) || 1;
      const at = (dy, rot) => `translate(${p.x}px,${p.y + dy}px) rotate(${rot}deg)`;
      // In a waterfall, words start from the narrow stream above and spread out as they fall.
      let start = at(-drop, tilt);
      if (this.o.shape === 'waterfall') {
        const c = this.o.center * W;
        const sx = c + (p.x + p.w / 2 - c) * 0.25 - p.w / 2;
        start = `translate(${sx}px,${p.y - drop * 1.6}px) rotate(${tilt}deg)`;
      }
      node.animate(
        [
          { transform: start, opacity: 0, easing: 'cubic-bezier(.5,0,.9,.5)' },
          { transform: at(3, tilt * 0.15), opacity: op, offset: 0.62, easing: 'cubic-bezier(.2,.6,.4,1)' },
          { transform: at(-1.5, -tilt * 0.05), offset: 0.8, easing: 'ease-in-out' },
          { transform: at(0, 0), opacity: op },
        ],
        { duration: dur * (0.85 + Math.random() * 0.3), delay, fill: 'backwards' }
      );
    });
    this.layer.classList.remove('tf-waiting');
  }

  // ---------- dragging ----------

  _makeDraggable(o) {
    let sx, sy, ox, oy, queued = false;
    const move = (e) => {
      const maxX = this.root.clientWidth - o.offsetWidth;
      const maxY = this.root.clientHeight - o.offsetHeight;
      o.style.left = Math.min(maxX, Math.max(0, ox + e.clientX - sx)) + 'px';
      o.style.top = Math.min(maxY, Math.max(0, oy + e.clientY - sy)) + 'px';
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; this.layout(); });
    };
    const up = () => {
      this.layer.classList.remove('tf-dragging');
      o.removeEventListener('pointermove', move);
      o.removeEventListener('pointerup', up);
      o.removeEventListener('pointercancel', up);
    };
    o.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      o.setPointerCapture(e.pointerId);
      sx = e.clientX; sy = e.clientY; ox = o.offsetLeft; oy = o.offsetTop;
      this.layer.classList.add('tf-dragging');
      o.addEventListener('pointermove', move);
      o.addEventListener('pointerup', up);
      o.addEventListener('pointercancel', up);
    });
  }

  destroy() {
    this._ro && this._ro.disconnect();
    this._io && this._io.disconnect();
    this.layer.remove();
    this.root.classList.remove('tf-root');
  }
}

function initTextFlow(scope = document) {
  return [...scope.querySelectorAll('[data-flow]')].map((el) => el._textFlow || (el._textFlow = new TextFlow(el)));
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initTextFlow());
  else initTextFlow();
}

window.TextFlow = TextFlow;
window.initTextFlow = initTextFlow;
})();
