/* =========================================================================
   Marina Fragoso — the issue.
   One object per PAGE (a page = one half of a desktop spread / one mobile page).
   Order is the reading order. `html` is real, semantic markup.

   HEADLINE COPY CONSTRAINT: the display face (graphite-nocturne) is currently
   missing a lowercase "s" glyph — every .display headline here is written to
   avoid a lowercase "s" entirely. Sans-serif copy (captions, body, specs) is
   unrestricted.
   ========================================================================= */

window.MF_PAGES = [
  /* 0 — COVER (shown alone, like a closed magazine) ------------------- */
  {
    slug: 'cover', section: 'Cover', kind: 'cover',
    html: `
      <img class="bleed" src="assets/cover.jpg" alt="A woman in profile against Rio's bright sky wearing a pavé diamond hoop, with the Marina Fragoso signature." />
      <div class="cover-copy">
        <p class="issue">Issue 01 — Summer 2026</p>
        <p class="cover-line">Fine jewelry, made in New York.</p>
      </div>`
  },

  /* 1 — INSIDE COVER (verso, paper) ----------------------------------- */
  {
    slug: 'welcome', section: 'Latest', kind: 'paper',
    html: `
      <div class="page-pad">
        <p class="kicker">Issue 01 · Summer 2026</p>
        <h2 class="display display-xl">Welcome</h2>
        <p class="lede">A small studio in New York. Stones chosen by hand, set to be
        worn every day and kept for a lifetime. Turn the page.</p>
        <p class="folio-print">1</p>
      </div>`
  },

  /* 2 — LATEST I (recto, full photo) ---------------------------------- */
  {
    slug: 'latest', section: 'Latest', kind: 'photo',
    html: `
      <img class="bleed" src="assets/collection.jpg" alt="A hand rests at the face, stacked with gold and diamond rings, the sea behind." />
      <figcaption class="caption caption-br">The everyday stack · 18kt gold</figcaption>`
  },

  /* 3 — LATEST II editorial (verso, paper) ---------------------------- */
  {
    slug: 'latest-editorial', section: 'Latest', kind: 'editorial',
    html: `
      <div class="page-pad">
        <p class="kicker kicker-accent">New this season</p>
        <h2 class="display display-lg editorial-head">Brilliant<br/>&amp; Bright</h2>
        <ol class="picks">
          <li><span class="num">1</span><span class="pick-name">Inside-Out Hoops</span>
            <span class="pick-spec">4.91ct diamond · 18kt white gold</span>
            <a class="pick-link" href="#">View</a></li>
          <li><span class="num">2</span><span class="pick-name">Signet Solitaire</span>
            <span class="pick-spec">Round brilliant · 18kt yellow gold</span>
            <a class="pick-link" href="#">View</a></li>
          <li><span class="num">3</span><span class="pick-name">Riviera Bracelet</span>
            <span class="pick-spec">Cushion-cut diamonds · 18kt gold</span>
            <a class="pick-link" href="#">View</a></li>
        </ol>
        <p class="folio-print">4</p>
      </div>`
  },

  /* 4 — LATEST II photo (recto, full photo) --------------------------- */
  {
    slug: 'latest-photo', section: 'Latest', kind: 'photo',
    html: `
      <img class="bleed" src="assets/bespoke.jpg" alt="A raised arm wearing a diamond tennis bracelet, gaze cast over the shoulder to the sea." />
      <figcaption class="caption caption-br">Riviera bracelet · cushion-cut diamonds</figcaption>`
  },

  /* 5 — BESPOKE photo (verso, full photo) ----------------------------- */
  {
    slug: 'bespoke', section: 'Bespoke', kind: 'photo',
    html: `
      <img class="bleed" src="assets/appointment.jpg" alt="A woman smiling, hand over her brow, wearing a diamond bracelet and ring." />`
  },

  /* 6 — BESPOKE process (recto, paper) -------------------------------- */
  {
    slug: 'bespoke-process', section: 'Bespoke', kind: 'paper',
    html: `
      <div class="page-pad">
        <p class="kicker kicker-accent">Bespoke</p>
        <h2 class="display display-lg">Only for You</h2>
        <p class="lede">A stone you inherited. An occasion worth marking. We design it
        together and cut it here in New York.</p>
        <ol class="steps">
          <li><span class="num">1</span> Conversation</li>
          <li><span class="num">2</span> Design</li>
          <li><span class="num">3</span> Craft</li>
          <li><span class="num">4</span> Delivery</li>
        </ol>
        <a class="btn-link" href="#">Commission a piece →</a>
        <p class="folio-print">7</p>
      </div>`
  },

  /* 7 — ABOUT photo (verso, full photo) ------------------------------- */
  {
    slug: 'about', section: 'About', kind: 'photo',
    html: `
      <img class="bleed" src="assets/story-rio.jpg" alt="Marina in profile with Ipanema beach and the Dois Irmãos mountains of Rio de Janeiro behind her." />
      <figcaption class="caption caption-bl light">Rio de Janeiro</figcaption>`
  },

  /* 8 — ABOUT story (recto, paper) ------------------------------------ */
  {
    slug: 'about-story', section: 'About', kind: 'paper',
    html: `
      <div class="page-pad">
        <p class="kicker kicker-accent">The atelier</p>
        <h2 class="display display-lg">Where It Began</h2>
        <p class="body drop"><span class="drop-cap display">I</span> grew up between two
        cities and one long Rio summer. My grandfather was a mining engineer; he came home
        with stones wrapped in paper, and my grandmother would sit with a goldsmith and turn
        them into something you could wear.</p>
        <p class="body">I make my jewelry in New York now — but that afternoon light, and the
        idea that each jewel holds a moment, is still the whole of it.</p>
        <p class="sign display">Marina</p>
        <p class="folio-print">9</p>
      </div>`
  },

  /* 9 — SHOP plate (verso, paper — the "Stoned Love" catalog) --------- */
  {
    slug: 'shop', section: 'Shop', kind: 'shop',
    html: `
      <div class="page-pad">
        <p class="kicker kicker-accent">The shop</p>
        <h2 class="display display-lg">The Collection</h2>
        <p class="lede">Every piece, one place. Tap any to see it.</p>
        <p class="folio-print">10</p>
      </div>`
  },

  /* 10 — SHOP plate (recto, shoppable grid) --------------------------- */
  {
    slug: 'shop-plate', section: 'Shop', kind: 'shop',
    html: `
      <div class="plate-grid">
        <a class="plate-item" href="#"><img src="assets/collection.jpg" alt="Ring stack" style="object-position:60% 40%"><span class="plate-num">1</span></a>
        <a class="plate-item" href="#"><img src="assets/story-rio.jpg" alt="Diamond hoop earring" style="object-position:40% 42%"><span class="plate-num">2</span></a>
        <a class="plate-item" href="#"><img src="assets/appointment.jpg" alt="Tennis bracelet" style="object-position:30% 20%"><span class="plate-num">3</span></a>
        <a class="plate-item" href="#"><img src="assets/bespoke.jpg" alt="Bracelet and studs" style="object-position:20% 26%"><span class="plate-num">4</span></a>
      </div>`
  },

  /* 11 — APPOINTMENT (verso, ink) ------------------------------------- */
  {
    slug: 'contact', section: 'Contact', kind: 'ink',
    html: `
      <div class="page-pad center">
        <p class="kicker light">Made in New York · Insured worldwide</p>
        <h2 class="display display-lg light">By Appointment</h2>
        <p class="lede light">Come find them in person. Write to me — I answer every note myself.</p>
        <a class="btn-link light" href="#">Request an appointment →</a>
        <p class="folio-print light">11</p>
      </div>`
  },

  /* 12 — BACK COVER (recto) ------------------------------------------- */
  {
    slug: 'back', section: 'Contact', kind: 'paper',
    html: `
      <div class="page-pad center back">
        <img class="back-logo" src="assets/logo.png" alt="Marina Fragoso" width="160" height="70" />
        <nav class="back-index" aria-label="Index">
          <a href="#/latest">Latest</a><a href="#/bespoke">Bespoke</a>
          <a href="#/about">About</a><a href="#/shop">Shop</a><a href="#/contact">Contact</a>
        </nav>
        <form class="signup" onsubmit="return false">
          <input type="email" placeholder="Email — be first to the next issue" aria-label="Email" />
          <button type="submit" aria-label="Subscribe">→</button>
        </form>
        <p class="colophon">© <span class="year">2026</span> Marina Fragoso.
          Site by <a href="https://tcstudio.io" target="_blank" rel="noopener">Tree Crown Studio</a>.</p>
      </div>`
  }
];

/* Section → the page slug the menu riffles to */
window.MF_SECTIONS = [
  { label: 'Latest',  slug: 'latest' },
  { label: 'Bespoke', slug: 'bespoke' },
  { label: 'About',   slug: 'about' },
  { label: 'Shop',    slug: 'shop' },
  { label: 'Contact', slug: 'contact' }
];
