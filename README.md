# Marina Fragoso — Homepage Concept

Static, dependency-free concept for client sign-off. Maps 1:1 to future Shopify OS 2.0 sections
(each `<section>` carries `data-section="…"`).

## Run it
Open `index.html` directly, **or** serve the folder (recommended, avoids `file://` quirks):
`python3 -m http.server 8000` → http://localhost:8000

## Display font — flag for review
Headlines use **Didot** (macOS system Didone) with fallbacks (Bodoni 72 / Playfair Display / Georgia).
Chosen for a genuine fashion-masthead feel and to avoid the generic cream-serif look — but it is a
macOS-only system face. **Production must license a web Didone** (e.g. Canela, GT Super, Reckless, or
a Didot webfont) and self-host it. Body/UI uses the system sans stack.

## Logo
`assets/logo.png` is Marina's current signature wordmark, pulled from the live site — used in the sticky
header and footer. The cover image (`cover.jpg`) already has the white signature baked in, so the masthead
is intentionally NOT rendered over the cover.

## Image swap points (all in `assets/`, sourced from the delivered campaign set)
- `cover.jpg` — Section 1 cover (has baked-in signature)
- `collection.jpg` — Section 2 flagship collection spread
- `story-rio.jpg` — Section 3 narrative (Ipanema / Dois Irmãos = the Rio origin story)
- `bespoke.jpg` — Section 5 bespoke teaser
- `appointment.jpg` — reused as a Section 4 product thumbnail
- Section 4 product plate currently uses CROPS of campaign images as stand-ins. **Replace with isolated
  product-on-white photography** for production (one thumbnail still shows the baked-in wordmark).

## Notes for the Shopify build
- Palette tokens in `:root` are sampled from the photography (`--sky` Rio blue is the accent, not emerald).
- Motion is intentionally slow (700–900ms settle) to read as "thick paper" — do not speed it up.
  All motion is gated behind `prefers-reduced-motion`.
- Scroll-snap is `proximity` (never `mandatory`) so it never fights the user.
- Copyright year auto-updates via JS; never hardcode it. Footer backlinks to tcstudio.io.
