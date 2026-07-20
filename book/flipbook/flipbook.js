/* =========================================================================
   Flipbook v4 — magazine page-turn. One StPageFlip engine, all pages.

   The whole book — covers included — lives in a single StPageFlip instance,
   so every turn is the same native curl: corner lift on hover, corner drag,
   crease + cast shadows, the next page on the back of the turning sheet.

   - ≥ breakpoint (default 1024): landscape. The cover rests ALONE at page
     width (a closed magazine, StPageFlip's showCover); opening it is the
     first turn. Interior pages face each other as spreads with a gutter
     seam; the back cover rests alone again at the end.
   - < breakpoint: portrait — one full-width page at a time.

   Known-safe StPageFlip usage (see ../../REBUILD-SPEC.md): loadFromHTML
   before .on(), never turnToPage, never an explicit startPage of 0, the
   seam node injected inside .stf__block (it's a stacking context in
   Safari), and no filter on the engine's own parent.

   Requires: <script src="../vendor/page-flip.browser.js"> loaded first.

   API:
     const book = new Flipbook(el, { pages, duration, breakpoint, onTurn });
     book.next(); book.prev(); book.goTo(i); book.riffleTo(i); book.destroy();

   A page is '<html>' | {html} | {image, alt} | {image, alt, html}, plus an
   optional slug for #/slug deep-links. Index 0 = cover, N-1 = back cover.
   Turning pushes history entries, so browser Back/Forward flip the pages.
   ========================================================================= */

(function (root) {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function clamp(n, lo, hi) { return n < lo ? lo : n > hi ? hi : n; }

  function pageInner(page) {
    if (page == null) return '';
    if (typeof page === 'string') return page;
    if (page instanceof Node) return page.outerHTML;
    var html = '';
    if (page.image) {
      html += '<img class="fb-page-img" src="' + page.image + '" alt="' +
        (page.alt || '').replace(/"/g, '&quot;') + '" draggable="false">';
      if (page.html) html += '<div class="fb-page-overlay">' + page.html + '</div>';
      return html;
    }
    return page.html || '';
  }

  function Flipbook(mount, opts) {
    if (!root.St || !root.St.PageFlip) {
      throw new Error('Flipbook: StPageFlip not found. Load vendor/page-flip.browser.js first.');
    }
    opts = opts || {};
    this.mount = typeof mount === 'string' ? document.querySelector(mount) : mount;
    this.pages = opts.pages || [];
    this.N = this.pages.length;
    this.duration = reduce ? 1 : (opts.duration || 900);
    this.breakpoint = opts.breakpoint || 1024;
    this.onTurn = opts.onTurn || function () {};

    this.wide = window.innerWidth >= this.breakpoint;
    this.pos = 0;

    this._build();
    this._bindInput();
    var h = this._hashIndex();
    this._show(h == null ? 0 : h, true);
  }

  // ---- DOM ------------------------------------------------------------------
  Flipbook.prototype._build = function () {
    var m = this.mount;
    m.classList.add('fb-root');
    m.setAttribute('role', 'application');
    m.setAttribute('aria-roledescription', 'flipbook');
    m.setAttribute('tabindex', '0');

    this.stage = el('div', 'fb-stage');
    this.book = el('div', 'fb-book');
    this.seam = el('div', 'fb-seam');
    this.stage.appendChild(this.book);
    m.appendChild(this.stage);

    this.live = el('div', 'fb-live');
    this.live.setAttribute('aria-live', 'polite');
    m.appendChild(this.live);

    this.mount.classList.toggle('fb-spread', this.wide);
    this.mount.classList.toggle('fb-single', !this.wide);
  };

  // ---- the engine -------------------------------------------------------------
  // Wide mode pads the book with a transparent blank page at each end instead
  // of using StPageFlip's showCover: the cover then rests visually alone
  // (its partner page is invisible) yet remains an ORDINARY SOFT page — it
  // curls exactly like every interior page, with real page 1 on its back.
  // Pages are viewport-sized (50vw×100dvh each in a spread, 100vw×100dvh
  // single), so the magazine IS the full viewport and the closed cover's
  // right edge is the viewport's right edge.
  Flipbook.prototype._mountEngine = function (startIdx) {
    if (this.pf) { try { this.pf.destroy(); } catch (e) {} this.pf = null; }
    this.book.innerHTML = '';

    var els = [];
    var self = this;
    function add(i, cls) {
      var pg = el('div', 'fb-page' + (cls ? ' ' + cls : ''));
      if (i != null) pg.innerHTML = pageInner(self.pages[i]);
      self.book.appendChild(pg);
      els.push(pg);
    }
    if (this.wide) add(null, 'fb-page--blank');
    for (var i = 0; i < this.N; i++) add(i);
    if (this.wide) add(null, 'fb-page--blank');

    var vw = window.innerWidth, vh = window.innerHeight;
    var cfg = {
      width: this.wide ? Math.round(vw / 2) : vw,
      height: vh,
      size: 'stretch',
      minWidth: this.wide ? 200 : vw,   // narrow: stage < 2×minWidth ⇒ portrait
      maxWidth: Math.max(4000, vw),
      minHeight: 200,
      maxHeight: Math.max(4000, vh),
      drawShadow: true,
      maxShadowOpacity: 0.5,
      flippingTime: this.duration,
      usePortrait: !this.wide,          // wide ⇒ locked landscape
      showCover: false,
      mobileScrollSupport: false,
      useMouseEvents: true,
      swipeDistance: 30
    };
    // Wide engine indexes are shifted +1 by the leading blank, so the cover
    // deep-link passes startPage 1 — the "never pass 0" rule holds naturally.
    var sp = clamp(startIdx | 0, 0, this.N - 1) + (this.wide ? 1 : 0);
    if (sp > 0) cfg.startPage = sp;

    this.pf = new root.St.PageFlip(this.book, cfg);
    this.pf.loadFromHTML(els);          // BEFORE .on()

    // The seam lives INSIDE StPageFlip's block: the block is a stacking
    // context (notably in Safari), so only from within can the seam sit above
    // resting pages (z 3) yet under the turning page (z 5).
    var blk = this.book.querySelector('.stf__block');
    if (blk) blk.appendChild(this.seam);

    this.pf.on('flip', function (e) {
      self.pos = self.wide ? clamp(e.data - 1, 0, self.N - 1) : e.data;
      self._settle();
      if (self._riffling) setTimeout(function () { self._riffleStep(); }, 40);
    });
  };

  // ---- instant state (load, goTo, breakpoint remount) ---------------------------
  Flipbook.prototype._show = function (i, initial) {
    i = clamp(i | 0, 0, this.N - 1);
    this._riffling = null;                 // a rebuild supersedes any riffle
    this._mountEngine(i);
    this.pos = i;
    this._settle(initial);
  };

  // ---- settle: history, aria, seam, callback ------------------------------------
  Flipbook.prototype._settle = function (initial) {
    var slug = this._slug(this.pos);
    var target = '#/' + slug;
    if (target !== location.hash) {
      // Pages passing by during a riffle only replace — the riffle already
      // pushed its single destination entry.
      if (initial || this._riffling) history.replaceState(null, '', target);
      else history.pushState(null, '', target);
    }
    this.live.textContent = 'Page ' + (this.pos + 1) + ' of ' + this.N;
    // The seam belongs to facing-page spreads — not to a lone cover.
    var onCover = this.pos === 0 || this.pos === this.N - 1;
    this.mount.classList.toggle('fb-seam-on', this.wide && !onCover);
    var self = this;
    setTimeout(function () {
      try { self.onTurn(self.pos, self.pages[self.pos]); } catch (e) {
        if (root.console && console.error) console.error('Flipbook onTurn callback threw:', e);
      }
    }, 0);
  };

  Flipbook.prototype._slug = function (i) {
    var p = this.pages[i];
    return (p && p.slug) ? p.slug : String(i);
  };
  Flipbook.prototype._hashIndex = function () {
    var h = location.hash.replace(/^#\/?/, '');
    if (!h) return null;
    for (var i = 0; i < this.N; i++) if (this._slug(i) === h) return i;
    if (/^\d+$/.test(h)) return clamp(parseInt(h, 10), 0, this.N - 1);
    return null;
  };

  Flipbook.prototype._busyNow = function () {
    return this.pf && this.pf.getState && this.pf.getState() !== 'read';
  };

  // ---- navigation -----------------------------------------------------------------
  Flipbook.prototype.next = function () { this.pf.flipNext(); };
  Flipbook.prototype.prev = function () { this.pf.flipPrev(); };
  Flipbook.prototype.goTo = function (i) { this._show(i); };

  // Riffle: jumping far flips through every page in between, just quicker —
  // it reads as thumbing to the article, never as a jump-cut. The whole jump
  // costs ONE history entry (pushed up front; the pages passing by only
  // replaceState), so Back returns to where you riffled from.
  Flipbook.prototype.riffleTo = function (i, _retry) {
    i = clamp(i | 0, 0, this.N - 1);
    if (i === this.pos) return;
    // Mid-flip, StPageFlip silently ignores commands — wait, then go.
    if (this._busyNow()) {
      var self = this, r = _retry || 0;
      if (r < 15) setTimeout(function () { self.riffleTo(i, r + 1); }, 160);
      return;
    }
    var flips = Math.max(1, Math.ceil(Math.abs(i - this.pos) / (this.wide ? 2 : 1)));
    if (flips <= 1) { this.pf.flip(this.wide ? i + 1 : i); return; }

    var target = '#/' + this._slug(i);
    if (target !== location.hash) history.pushState(null, '', target);
    var st = this.pf.getSettings ? this.pf.getSettings() : null;
    this._riffling = {
      target: i,
      dir: i > this.pos ? 1 : -1,
      orig: st ? st.flippingTime : this.duration
    };
    if (st) st.flippingTime = clamp(Math.round(900 / flips), 140, 350);
    this._riffleStep();
  };

  Flipbook.prototype._riffleStep = function () {
    var r = this._riffling;
    if (!r) return;
    var done = r.dir > 0 ? this.pos >= r.target : this.pos <= r.target;
    if (done) { this._cancelRiffle(); return; }
    if (r.dir > 0) this.pf.flipNext(); else this.pf.flipPrev();
  };

  Flipbook.prototype._cancelRiffle = function () {
    if (!this._riffling) return;
    var st = this.pf && this.pf.getSettings ? this.pf.getSettings() : null;
    if (st) st.flippingTime = this._riffling.orig;
    this._riffling = null;
  };

  // ---- input ---------------------------------------------------------------------
  Flipbook.prototype._bindInput = function () {
    var self = this;

    this._onKey = function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); self.next(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); self.prev(); }
      else if (e.key === 'Home') { e.preventDefault(); self.riffleTo(0); }
      else if (e.key === 'End') { e.preventDefault(); self.riffleTo(self.N - 1); }
    };
    document.addEventListener('keydown', this._onKey);

    var wheelLock = false;
    this.mount.addEventListener('wheel', function (e) {
      var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(d) < 14 || wheelLock) return;
      wheelLock = true; setTimeout(function () { wheelLock = false; }, 520);
      if (d > 0) self.next(); else self.prev();
    }, { passive: true });

    // Touch: a deliberate VERTICAL swipe also turns the page (the mobile
    // equivalent of scrolling — up = forward, down = back). Horizontal
    // swipes/drags stay StPageFlip's business.
    var ts = null;
    this.mount.addEventListener('touchstart', function (e) {
      ts = e.touches.length === 1
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : null;
    }, { passive: true });
    this.mount.addEventListener('touchend', function (e) {
      if (!ts || !e.changedTouches.length) { ts = null; return; }
      var c = e.changedTouches[0];
      var dx = c.clientX - ts.x, dy = c.clientY - ts.y;
      ts = null;
      if (Math.abs(dy) < 50 || Math.abs(dy) < Math.abs(dx) * 1.4) return;
      if (dy < 0) self.next(); else self.prev();
    }, { passive: true });

    // Pages are sized from the viewport at mount time, so any real resize
    // remounts (cheap) to keep the page aspect matched to the window.
    var t;
    this._onResize = function () {
      clearTimeout(t);
      t = setTimeout(function () {
        self.wide = window.innerWidth >= self.breakpoint;
        self.mount.classList.toggle('fb-spread', self.wide);
        self.mount.classList.toggle('fb-single', !self.wide);
        self._show(self.pos);
      }, 200);
    };
    window.addEventListener('resize', this._onResize);
    window.addEventListener('orientationchange', this._onResize);

    // Browser Back/Forward → animated flip to the page in the URL.
    this._onHash = function () {
      var i = self._hashIndex();
      if (i == null || i === self.pos) return;
      self.riffleTo(i);                  // riffleTo retries while mid-flip
    };
    window.addEventListener('hashchange', this._onHash);
    window.addEventListener('popstate', this._onHash);
  };

  // ---- teardown --------------------------------------------------------------------
  Flipbook.prototype.destroy = function () {
    document.removeEventListener('keydown', this._onKey);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('orientationchange', this._onResize);
    window.removeEventListener('hashchange', this._onHash);
    window.removeEventListener('popstate', this._onHash);
    if (this.pf) { try { this.pf.destroy(); } catch (e) {} }
    this.mount.innerHTML = '';
    this.mount.className = this.mount.className.replace(/\bfb-[\w-]+/g, '').trim();
  };

  root.Flipbook = Flipbook;
})(window);
