/* =========================================================================
   Marina Fragoso — flip engine
   A modern, dependency-free page-turn book. No scroll; the only navigation
   is turning a page. Desktop = open spread (two pages + gutter). Mobile =
   one page. Interactive drag on touch, click/keys/wheel on desktop, riffle
   for menu jumps, hash deep-links, reduced-motion instant swaps.

   Model: `pos` = index of the RIGHT-hand page currently at rest.
     - Desktop spreads: cover(0) alone, then rectos 2,4,6,8,10,12 with
       verso = recto-1.  pos is even.
     - Mobile: every page shown alone. pos is the page index (0..N-1).
   ========================================================================= */

(function () {
  'use strict';

  var PAGES = window.MF_PAGES;
  var SECTIONS = window.MF_SECTIONS;
  var N = PAGES.length;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DUR = reduce ? 0 : 820;          // normal turn (ms)
  var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

  // ---- DOM refs ----------------------------------------------------------
  var book   = document.getElementById('book');
  var elL    = document.getElementById('pageL');   // resting left page
  var elR    = document.getElementById('pageR');   // resting right page
  var leaf   = document.getElementById('leaf');     // the turning sheet
  var leafF  = leaf.querySelector('.leaf-face.front');
  var leafB  = leaf.querySelector('.leaf-face.back');
  var edgesL = document.getElementById('edgesL');
  var edgesR = document.getElementById('edgesR');
  var live   = document.getElementById('live');
  var folio  = document.getElementById('folio');

  var isMobile = false;
  var pos = 0;                 // right-page index (desktop) / page index (mobile)
  var busy = false;

  // slug -> index
  var bySlug = {};
  PAGES.forEach(function (p, i) { bySlug[p.slug] = i; });

  // ---- helpers -----------------------------------------------------------
  function render(slotEl, idx) {
    if (idx == null || idx < 0 || idx >= N) { slotEl.innerHTML = ''; slotEl.dataset.kind = 'blank'; slotEl.hidden = true; return; }
    slotEl.hidden = false;
    slotEl.innerHTML = PAGES[idx].html;
    slotEl.dataset.kind = PAGES[idx].kind;
    slotEl.dataset.idx = idx;
    // hydrate any year spans
    var y = slotEl.querySelector('.year'); if (y) y.textContent = new Date().getFullYear();
  }

  function measureMode() {
    isMobile = window.matchMedia('(max-width: 820px)').matches;
    document.body.dataset.mode = isMobile ? 'single' : 'spread';
  }

  // Left/right page indices for a given resting pos
  function spreadFor(p) {
    if (isMobile) return { L: null, R: p, cover: false };
    if (p <= 0)   return { L: null, R: 0, cover: true };   // closed magazine
    return { L: p - 1, R: p };
  }

  function step() { return isMobile ? 1 : 2; }

  function clampPos(p) {
    if (p < 0) return 0;
    var max = isMobile ? N - 1 : (N % 2 === 0 ? N : N - 1); // last recto
    // ensure desktop lands on an even recto (or cover 0)
    if (!isMobile && p > 0 && p % 2 === 1) p += 1;
    if (p > (isMobile ? N - 1 : lastRecto())) return (isMobile ? N - 1 : lastRecto());
    return p;
  }
  function lastRecto() {
    // largest even index <= N-1, but at least covering the last page as a recto/verso
    var r = N - 1;
    if (r % 2 === 1) return r;      // odd count: last page is a recto
    return r;                        // even index page is a recto already
  }

  // ---- paint resting state ----------------------------------------------
  function paint() {
    var s = spreadFor(pos);
    book.dataset.cover = s.cover ? '1' : '0';
    render(elL, s.L);
    render(elR, s.R);
    leaf.hidden = true;
    paintEdges();
    updateChrome();
  }

  function paintEdges() {
    // page-edge thickness shows position within the issue
    var leftCount, rightCount;
    if (isMobile) { leftCount = pos; rightCount = N - 1 - pos; }
    else { leftCount = Math.max(0, pos - 1); rightCount = Math.max(0, N - 1 - pos); }
    var px = function (c) { return Math.min(14, 2 + c * 0.9); };
    edgesL.style.width = px(leftCount) + 'px';
    edgesR.style.width = px(rightCount) + 'px';
    edgesL.style.opacity = leftCount ? 1 : 0;
    edgesR.style.opacity = rightCount ? 1 : 0;
  }

  function updateChrome() {
    var cur = PAGES[pos];
    var human = pos + 1;
    folio.textContent = human + ' / ' + N;
    if (live) live.textContent = 'Page ' + human + ' of ' + N + ' — ' + (cur ? cur.section : '');
    // adaptive menu theme — light chrome over photo/ink/cover, dark over paper
    var s = spreadFor(pos);
    var themeSrc = (!isMobile && s.L != null) ? PAGES[s.L] : PAGES[s.R];
    var dark = themeSrc && /photo|ink|cover/.test(themeSrc.kind);
    var menu = document.getElementById('menu');
    if (menu) menu.dataset.theme = dark ? 'light' : 'dark';
    // reflect active section in the menu
    document.querySelectorAll('#menu [data-slug]').forEach(function (a) {
      a.classList.toggle('active', PAGES[pos] && PAGES[pos].section === a.dataset.section);
    });
  }

  // ---- the turn ----------------------------------------------------------
  // dir: +1 forward, -1 back. Returns a Promise.
  function turn(dir, dur) {
    dur = (dur == null) ? DUR : dur;
    var s = step();
    var target = pos + dir * s;
    if (target < 0 || target > (isMobile ? N - 1 : lastRecto())) return Promise.resolve(false);

    if (reduce || dur === 0) { pos = target; paint(); return Promise.resolve(true); }

    return new Promise(function (resolve) {
      var fromCover = (!isMobile && pos === 0);
      // Set up leaf faces + revealed underlayer
      if (dir > 0) setupForward(target, fromCover);
      else setupBackward(target);

      // force reflow then animate
      leaf.hidden = false;
      leaf.style.transition = 'none';
      leaf.style.transform = startTransform(dir);
      // eslint-disable-next-line no-unused-expressions
      leaf.offsetWidth;
      leaf.style.transition = 'transform ' + dur + 'ms ' + EASE;
      leaf.classList.add('turning');
      requestAnimationFrame(function () {
        leaf.style.transform = endTransform(dir);
      });
      var done = function () {
        leaf.removeEventListener('transitionend', done);
        leaf.classList.remove('turning');
        pos = target;
        paint();
        resolve(true);
      };
      leaf.addEventListener('transitionend', done);
      // safety timeout
      setTimeout(function () { if (leaf.classList.contains('turning')) done(); }, dur + 120);
    });
  }

  // Which edge the leaf pivots on
  function startTransform(dir) { return dir > 0 ? 'rotateY(0deg)' : 'rotateY(180deg)'; }
  function endTransform(dir)   { return dir > 0 ? 'rotateY(-180deg)' : 'rotateY(0deg)'; }

  function setLeafSide(dir, fromCover) {
    // Forward turns pivot on the LEFT (spine) edge; the leaf sits over the right page.
    // On mobile & cover, the turning sheet occupies the whole/right area.
    leaf.dataset.side = 'right';
    leaf.classList.toggle('is-cover', !!fromCover);
  }

  function setupForward(target, fromCover) {
    setLeafSide(1, fromCover);
    if (isMobile) {
      // front = current page, back = target, underneath = target
      leafF.innerHTML = PAGES[pos].html;     leafF.dataset.kind = PAGES[pos].kind;
      leafB.innerHTML = PAGES[target].html;  leafB.dataset.kind = PAGES[target].kind;
      render(elR, target); render(elL, null);
    } else {
      var oldL = pos - 1, oldR = pos, newL = pos + 1, newR = pos + 2;
      if (fromCover) { oldR = 0; newL = 1; newR = 2; }
      leafF.innerHTML = PAGES[oldR].html;    leafF.dataset.kind = PAGES[oldR].kind;
      leafB.innerHTML = PAGES[newL] ? PAGES[newL].html : ''; leafB.dataset.kind = PAGES[newL] ? PAGES[newL].kind : 'blank';
      render(elL, fromCover ? null : oldL);  // stays until leaf lands
      render(elR, newR != null && newR < N ? newR : null); // revealed right
      if (fromCover) render(elL, null);
    }
    hydrateYears();
  }

  function setupBackward(target) {
    setLeafSide(-1, false);
    if (isMobile) {
      leafF.innerHTML = PAGES[target].html;  leafF.dataset.kind = PAGES[target].kind;
      leafB.innerHTML = PAGES[pos].html;     leafB.dataset.kind = PAGES[pos].kind;
      render(elR, target); render(elL, null);
    } else {
      var curL = pos - 1, curR = pos, prevL = target - 1, prevR = target;
      leafF.innerHTML = PAGES[curL] ? PAGES[curL].html : ''; leafF.dataset.kind = PAGES[curL] ? PAGES[curL].kind : 'blank';
      leafB.innerHTML = PAGES[prevR] ? PAGES[prevR].html : ''; leafB.dataset.kind = PAGES[prevR] ? PAGES[prevR].kind : 'blank';
      render(elL, prevL >= 0 ? prevL : null);   // revealed left
      render(elR, curR);                         // stays until leaf lands
    }
    hydrateYears();
  }

  function hydrateYears() {
    [leafF, leafB].forEach(function (f) {
      var y = f.querySelector('.year'); if (y) y.textContent = new Date().getFullYear();
    });
  }

  // ---- riffle (menu jumps) ----------------------------------------------
  function riffleTo(idx) {
    if (busy) return;
    var target = isMobile ? idx : (idx % 2 === 1 ? idx + 1 : idx); // verso → its recto
    if (!isMobile && target > lastRecto()) target = lastRecto();
    if (target === pos) return;
    busy = true;
    var dir = target > pos ? 1 : -1;
    var s = step();
    var flips = Math.abs(target - pos) / s;
    var i = 0;
    function next() {
      if ((dir > 0 && pos >= target) || (dir < 0 && pos <= target)) { busy = false; syncHash(); return; }
      i++;
      // accelerate in, decelerate out; middle flips fast
      var remaining = Math.abs(target - pos) / s;
      var fast = (i === 1 || remaining <= 1) ? 300 : Math.max(90, 520 / flips);
      turn(dir, reduce ? 0 : fast).then(function (ok) {
        if (!ok) { busy = false; syncHash(); return; }
        if (reduce) { pos = target; paint(); busy = false; syncHash(); return; }
        next();
      });
    }
    next();
  }

  // ---- interactive drag (pointer) ---------------------------------------
  var drag = null;
  function onDown(e) {
    if (busy || leaf.classList.contains('turning')) return;
    var x = e.clientX, w = book.clientWidth, edge = w * 0.5;
    var dir = 0;
    if (isMobile) { dir = 0; /* decided on move */ }
    else {
      // right half → forward, left half → back
      dir = (x - book.getBoundingClientRect().left) > edge ? 1 : -1;
    }
    drag = { x0: x, dir: dir, started: false, w: w };
    book.setPointerCapture && book.setPointerCapture(e.pointerId);
  }
  function onMove(e) {
    if (!drag) return;
    var dx = e.clientX - drag.x0;
    if (!drag.started) {
      if (Math.abs(dx) < 6) return;
      drag.dir = dx < 0 ? 1 : -1;           // drag left = forward
      // guard bounds
      var t = pos + drag.dir * step();
      if (t < 0 || t > (isMobile ? N - 1 : lastRecto())) { drag = null; return; }
      drag.started = true;
      if (drag.dir > 0) setupForward(pos + step(), !isMobile && pos === 0);
      else setupBackward(pos - step());
      leaf.hidden = false; leaf.style.transition = 'none';
      leaf.classList.add('turning');
    }
    var frac = Math.max(0, Math.min(1, Math.abs(dx) / (drag.w * (isMobile ? 0.9 : 0.5))));
    var deg = drag.dir > 0 ? -180 * frac : -180 * (1 - frac);
    leaf.style.transform = 'rotateY(' + deg + 'deg)';
    drag.frac = frac;
  }
  function onUp(e) {
    if (!drag) return;
    var d = drag; drag = null;
    if (!d.started) return;
    var complete = d.frac > 0.4;
    leaf.style.transition = 'transform 380ms ' + EASE;
    if (complete) {
      leaf.style.transform = d.dir > 0 ? 'rotateY(-180deg)' : 'rotateY(0deg)';
      var target = pos + d.dir * step();
      var fin = function () { leaf.removeEventListener('transitionend', fin); leaf.classList.remove('turning'); pos = target; paint(); syncHash(); };
      leaf.addEventListener('transitionend', fin);
      setTimeout(function(){ if(leaf.classList.contains('turning')) fin(); }, 460);
    } else {
      leaf.style.transform = d.dir > 0 ? 'rotateY(0deg)' : 'rotateY(-180deg)';
      var back = function () { leaf.removeEventListener('transitionend', back); leaf.classList.remove('turning'); paint(); };
      leaf.addEventListener('transitionend', back);
      setTimeout(function(){ if(leaf.classList.contains('turning')) back(); }, 460);
    }
  }

  // ---- input wiring ------------------------------------------------------
  function go(dir) { if (busy) return; turn(dir).then(syncHash); }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
    else if (e.key === 'Home') { riffleTo(0); }
    else if (e.key === 'End') { riffleTo(N - 1); }
  });

  // click zones (desktop): left third = back, right third = forward
  book.addEventListener('click', function (e) {
    if (e.target.closest('a, button, input, .plate-item')) return; // let links work
    if (drag) return;
    var r = book.getBoundingClientRect();
    var x = e.clientX - r.left;
    if (x > r.width * 0.62) go(1);
    else if (x < r.width * 0.38) go(-1);
  });

  // trackpad / wheel (horizontal or vertical), debounced
  var wheelLock = false;
  book.addEventListener('wheel', function (e) {
    var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(d) < 20 || wheelLock || busy) return;
    e.preventDefault();
    wheelLock = true; setTimeout(function () { wheelLock = false; }, 900);
    go(d > 0 ? 1 : -1);
  }, { passive: false });

  book.addEventListener('pointerdown', onDown);
  book.addEventListener('pointermove', onMove);
  book.addEventListener('pointerup', onUp);
  book.addEventListener('pointercancel', onUp);

  // ---- hash routing ------------------------------------------------------
  function syncHash() {
    var slug = PAGES[pos] ? PAGES[pos].slug : 'cover';
    if (('#/' + slug) !== location.hash) history.replaceState(null, '', '#/' + slug);
  }
  function fromHash(animate) {
    var m = location.hash.match(/^#\/(.+)$/);
    if (!m) return false;
    var idx = bySlug[m[1]];
    if (idx == null) return false;
    if (!isMobile && idx % 2 === 1) idx += 1;
    if (animate) riffleTo(idx);
    else { pos = idx; paint(); }
    return true;
  }
  window.addEventListener('hashchange', function () {
    var m = location.hash.match(/^#\/(.+)$/);
    if (!m) return;
    var idx = bySlug[m[1]]; if (idx == null) return;
    if (!isMobile && idx % 2 === 1) idx += 1;
    if (idx !== pos) riffleTo(idx);
  });

  // ---- menu (fades in after 3s) -----------------------------------------
  function buildMenu() {
    var menu = document.getElementById('menu');
    var html = '<a class="brand" href="#/cover" data-slug="cover" aria-label="Marina Fragoso — cover"><img src="assets/logo.png" alt="Marina Fragoso" /></a><span class="menu-sections">';
    SECTIONS.forEach(function (s) {
      html += '<a href="#/' + s.slug + '" data-slug="' + s.slug + '" data-section="' + s.label + '">' + s.label + '</a>';
    });
    html += '</span><span class="menu-folio" id="folio">1 / ' + N + '</span>';
    menu.innerHTML = html;
    folio = document.getElementById('folio');
    menu.querySelectorAll('a[data-slug]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var idx = bySlug[a.dataset.slug];
        if (idx != null) riffleTo(idx);
      });
    });
    // reveal timing
    var reveal = function () { menu.classList.add('visible'); };
    if (reduce) reveal();
    else {
      var t = setTimeout(reveal, 3000);
      // any early interaction reveals it too
      var early = function () { clearTimeout(t); reveal(); cleanup(); };
      var cleanup = function () {
        book.removeEventListener('pointerdown', early);
        document.removeEventListener('keydown', early);
        book.removeEventListener('wheel', early);
      };
      book.addEventListener('pointerdown', early, { once: true });
      document.addEventListener('keydown', early, { once: true });
      book.addEventListener('wheel', early, { once: true });
    }
  }

  // ---- init / resize -----------------------------------------------------
  function init() {
    measureMode();
    buildMenu();
    if (!fromHash(false)) { pos = 0; paint(); }
    else paint();
  }

  function remeasureKeepingPage() {
    var keepSlug = PAGES[pos] ? PAGES[pos].slug : 'cover';
    var wasMobile = isMobile;
    measureMode();
    if (isMobile === wasMobile) { paint(); return; }
    var idx = bySlug[keepSlug];
    if (!isMobile && idx % 2 === 1) idx += 1;   // verso → its recto
    pos = idx || 0; paint();
  }

  var rT;
  window.addEventListener('resize', function () {
    clearTimeout(rT);
    rT = setTimeout(remeasureKeepingPage, 150);
  });
  // catch layout that settles after first paint (fonts/viewport)
  window.addEventListener('load', function () { requestAnimationFrame(remeasureKeepingPage); });

  init();
})();
