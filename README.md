# Marina Fragoso — The Magazine (concept)

The site **is** a magazine. No scroll anywhere — the only navigation is turning a page.
Desktop = an open two-page spread with a center seam. Phone/tablet = one page, swiped.
The cover is the homepage; the menu fades in 3 seconds after arrival; choosing a section
**riffles** through the intervening pages.

## Run it
Serve the folder (needed — the font + images are fetched):
`python3 -m http.server 8000` → http://localhost:8000
(Opening `index.html` off `file://` may block the font.)

## Files
- `index.html` — shell: stage, book (two page slots + turning leaf), menu, live region.
- `pages.js` — **the issue**: `window.MF_PAGES` is an ordered array, one object per page.
- `flip.js` — the flip engine (no dependencies; not turn.js). Handles turns, drag,
  riffle, hash routing, reduced-motion, resize.
- `styles.css` — design system + page templates.
- `assets/` — campaign images, `logo.png` (signature wordmark), `graphite-nocturne.ttf`.

## The page API (how to add / reorder pages)
Each entry in `MF_PAGES`:
```js
{ slug: 'bespoke', section: 'Bespoke', kind: 'photo', html: `…` }
```
- `slug` — unique; becomes the deep-link hash (`#/bespoke`) and is used by the menu.
- `section` — groups pages under a menu label; drives the active-state highlight.
- `kind` — `cover | photo | paper | editorial | shop | ink`. Controls page background
  and the CSS template; `photo`/`ink`/`cover` are full-bleed, the rest are paper.
- `html` — real semantic markup (headings, `alt`, links). It renders identically as a
  resting page and as a turning leaf face.

Reading order = array order. On desktop, pages pair as spreads `[1,2] [3,4] …`; the cover
(index 0) sits alone like a closed magazine. Keep an **even** number of content pages after
the cover so no spread is half-empty.

`window.MF_SECTIONS` maps the menu labels to the slug each one riffles to.

### → Shopify mapping (next phase)
Each `MF_PAGES` entry is one OS 2.0 section / metaobject: `kind` = the section template,
`html` fields = the section's schema settings. Marina reorders the issue by reordering
sections; a new "issue" is a new ordered set. Products on editorial/shop pages become
real product links.

## Typography — headline constraint (read before editing copy)
Headlines use **Graphite Nocturne** (`assets/graphite-nocturne.ttf`), Marina's signature
script — self-hosted via `@font-face`. **This font is currently missing a lowercase `s`
glyph.** Every `.display` headline in `pages.js` is deliberately written without a lowercase
`s` (e.g. "Where It Began", "Brilliant & Bright", "By Appointment"). Until a fixed font file
is supplied, keep that rule for any new headline, or the `s` will render as tofu.
Everything else is sans-serif; no serif anywhere. The menu wordmark uses `logo.png`
(the real signature image, which has the `s`), not live text.

## Behavior notes
- Turns: 700–900ms with a heavy settle (intentional — don't speed up). Interactive
  drag on touch (page follows finger, completes past ~40%). Click page edges, arrow
  keys, and horizontal wheel also turn. Visible ‹ › controls for accessibility.
- Riffle: fast successive flips, capped ~1.2s, from any menu item to any section.
- Deep links: `#/slug` opens the magazine to that page (no riffle on first load);
  browser back/forward flip.
- `prefers-reduced-motion`: turns/riffles become instant page swaps; menu shows at once.
- `aria-live` announces "Page N of M — Section" on every change; DOM order = reading order.

## Placeholders to replace for production
- Product tiles on the shop plate + editorial picks use crops of the campaign photos —
  swap for cut-out product-on-white shots.
- Cover accepts an image today; it can take a looping muted video for the "hero changes"
  requirement (drop a `<video>` into the cover page's `html`).
- Ship a fixed font file that includes lowercase `s`, then remove the copy constraint above.
