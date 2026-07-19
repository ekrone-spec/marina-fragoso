/* Marina Fragoso — homepage concept behavior
   Three small jobs: reveal-on-scroll, folio counter, sticky-header show. */

(function () {
  'use strict';

  // Auto-updating year in the colophon
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Reveal on scroll ---------------------------------------------------
  var reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  }

  // --- Folio counter + sticky header --------------------------------------
  var folioNum = document.getElementById('folioNum');
  var header = document.getElementById('siteHeader');
  var spreads = document.querySelectorAll('.spread');

  var sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var folio = entry.target.getAttribute('data-folio');
      if (folio && folioNum) folioNum.textContent = folio;
      // Sticky header appears once we've left the cover
      if (header) {
        if (entry.target.id === 'cover') header.classList.remove('is-visible');
        else header.classList.add('is-visible');
      }
    });
  }, { threshold: 0.55 });

  spreads.forEach(function (s) { sectionObserver.observe(s); });
})();
