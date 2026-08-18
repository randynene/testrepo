(function () {
  'use strict';

  /* Safety net: if GSAP never loads (blocked CDN, offline) or the user prefers
     reduced motion, make sure hero content — the only thing hidden by default
     CSS — is never left permanently invisible. */
  window.setTimeout(function () {
    if (!window.gsapAnimated) {
      document.documentElement.classList.add('force-visible');
    }
  }, 1800);

  var reducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion || !window.gsap) {
    document.documentElement.classList.add('force-visible');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  window.gsapAnimated = true;

  /* ---------------------------------------------------------------- */
  /* Count-up utility — parses a rendered number (with optional        */
  /* currency prefix, thousands separator, decimal, or trailing unit)  */
  /* and animates it from 0 to the original value, then restores the   */
  /* exact original text so formatting is never lost.                  */
  /* ---------------------------------------------------------------- */
  function animateCount(el, opts) {
    if (!el) return;
    opts = opts || {};
    var raw = el.textContent.trim();
    var m = raw.match(/^([€$]?)([\d,]+(?:\.\d+)?)(.*)$/);
    if (!m) return;

    var prefix = m[1];
    var numStr = m[2].replace(/,/g, '');
    var suffix = m[3];
    var hasComma = m[2].indexOf(',') !== -1;
    var decimals = (numStr.split('.')[1] || '').length;
    var target = parseFloat(numStr);
    var obj = { val: 0 };

    gsap.to(obj, {
      val: target,
      duration: opts.duration || 1.4,
      delay: opts.delay || 0,
      ease: 'power2.out',
      onUpdate: function () {
        var v = decimals ? obj.val.toFixed(decimals) : Math.round(obj.val);
        if (hasComma) v = Number(v).toLocaleString('en-US');
        el.textContent = prefix + v + suffix;
      },
      onComplete: function () {
        el.textContent = raw;
      }
    });
  }

  /* ---------------------------------------------------------------- */
  /* Word-mask headline reveal — each word gets its own overflow-hidden */
  /* box so it can rise into place from below without clipping the     */
  /* line. Runs once per element (marks it with data-split="done").    */
  /* ---------------------------------------------------------------- */
  function splitWords(el) {
    if (!el || el.dataset.split === 'done') {
      return el ? Array.prototype.slice.call(el.querySelectorAll('.word-mask > span')) : [];
    }
    var words = (el.textContent || '').split(/\s+/).filter(Boolean);
    el.textContent = '';
    var spans = [];
    words.forEach(function (w, i) {
      var mask = document.createElement('span');
      mask.className = 'word-mask';
      var inner = document.createElement('span');
      inner.textContent = w;
      mask.appendChild(inner);
      el.appendChild(mask);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      spans.push(inner);
    });
    el.dataset.split = 'done';
    return spans;
  }

  /* ---------------------------------------------------------------- */
  /* Hero on-load timeline (Home / Services / Contact — whichever      */
  /* hero elements exist on the current page)                          */
  /* ---------------------------------------------------------------- */
  var heroBlock = document.querySelector('[data-block="hero"], [data-block="services.hero"], [data-block="contact.hero"], [data-block="about.hero"]');
  if (heroBlock) {
    var heroItems = gsap.utils.toArray('.js-hero-el', heroBlock);
    var heroTitle = heroBlock.querySelector('.hero__title, .services-hero__title, .contact-hero__title, .about-hero__title');
    var heroArtifact = document.querySelector('.js-hero-el--right');

    var htl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.1 });

    if (heroItems[0]) htl.to(heroItems[0], { opacity: 1, y: 0, duration: 0.5 }, 0);

    if (heroTitle) {
      gsap.set(heroTitle, { opacity: 1, y: 0, x: 0 });
      var words = splitWords(heroTitle);
      if (words.length) {
        gsap.set(words, { yPercent: 115, opacity: 0 });
        htl.to(words, { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.055 }, 0.08);
      }
    }

    if (heroItems.length > 1) {
      htl.to(Array.prototype.slice.call(heroItems).slice(1), { opacity: 1, y: 0, duration: 0.65, stagger: 0.09 }, 0.34);
    }

    if (heroArtifact) {
      htl.to(heroArtifact, { opacity: 1, y: 0, x: 0, scale: 1, duration: 0.95 }, 0.16);
      var metricCards = heroArtifact.querySelectorAll('.hero-artifact__metric');
      if (metricCards.length) gsap.set(metricCards, { opacity: 0, y: 12 });
      htl.to(metricCards, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, 0.5);
    }

    htl.add(function () {
      document
        .querySelectorAll('[data-block="hero.artifact"] .hero-artifact__metric-value')
        .forEach(function (el, i) { animateCount(el, { duration: 1.3, delay: i * 0.1 }); });

      document.querySelectorAll('.channel-row__fill').forEach(function (fill, i) {
        var target = fill.style.width;
        gsap.set(fill, { width: 0 });
        gsap.to(fill, { width: target, duration: 1.1, ease: 'power2.out', delay: i * 0.12 });
      });

      document.querySelectorAll('.channel-row__value').forEach(function (el, i) {
        animateCount(el, { duration: 1.1, delay: i * 0.12 });
      });
    }, '-=0.3');
  }

  /* ---------------------------------------------------------------- */
  /* Scroll-triggered reveal groups — shared across all three pages;   */
  /* selectors that don't exist on a given page simply resolve empty.  */
  /* ---------------------------------------------------------------- */
  var GROUPS = [
    { sel: '.logo-strip__name', y: 12, stagger: 0.06 },
    { sel: '.section__head', y: 20, stagger: 0 },
    { sel: '.card-feature', y: 24, stagger: 0.1 },
    { sel: '.process-step', y: 24, stagger: 0.12, extra: 'rule' },
    { sel: '.card-model', y: 24, stagger: 0.12, extra: 'count', countSel: '.card-model__name' },
    { sel: '.stat', y: 20, stagger: 0.1, extra: 'count', countSel: '.stat__value' },
    { sel: '.testimonial', y: 24, stagger: 0.15 },
    { sel: '.team-member', y: 20, stagger: 0.08 },
    { sel: '.writing-card', y: 24, stagger: 0.12 },
    { sel: '.callout', y: 16, scale: 0.97, stagger: 0 },
    { sel: '.service-row', y: 28, stagger: 0.1 },
    { sel: '.card-pricing', y: 28, stagger: 0.12, extra: 'count', countSel: '.card-pricing__price' },
    { sel: '.enquiry-form', y: 24, stagger: 0 },
    { sel: '.rail > div', y: 24, stagger: 0.12 },
    { sel: '.booking-slot', y: 12, stagger: 0.08 },
    { sel: '.about-intro__inner', y: 20, stagger: 0 },
    { sel: '.about-practice-item', y: 20, stagger: 0.1 },
    { sel: '.fit-grid > div', y: 20, stagger: 0.15 }
  ];

  GROUPS.forEach(function (g) {
    var items = gsap.utils.toArray(g.sel);
    if (!items.length) return;

    var fromVars = { opacity: 0, y: g.y || 0 };
    if (g.scale) fromVars.scale = g.scale;
    gsap.set(items, fromVars);

    ScrollTrigger.batch(items, {
      start: 'top 85%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1, y: 0, scale: 1,
          duration: 0.8, ease: 'power3.out',
          stagger: g.stagger || 0,
          overwrite: true
        });

        if (g.extra === 'rule') {
          batch.forEach(function (el) {
            var rule = el.querySelector('.process-step__rule');
            if (rule) gsap.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power2.out' });

            var num = el.querySelector('.process-step__num');
            if (num) {
              var target = parseInt(num.textContent, 10);
              if (isFinite(target)) {
                var counter = { v: 0 };
                gsap.to(counter, {
                  v: target, duration: 0.6, ease: 'power1.out', delay: 0.1,
                  onUpdate: function () { num.textContent = String(Math.round(counter.v)).padStart(2, '0'); }
                });
              }
            }
          });
        }

        if (g.extra === 'count') {
          batch.forEach(function (el) {
            var target = el.querySelector(g.countSel);
            if (target) animateCount(target, { duration: 1.2 });
          });
        }
      }
    });
  });

  /* ---------------------------------------------------------------- */
  /* Sliding nav underline indicator                                    */
  /* ---------------------------------------------------------------- */
  (function setupNavIndicator() {
    var nav = document.querySelector('.nav__links');
    var indicator = document.querySelector('.nav__indicator');
    if (!nav || !indicator) return;

    var links = gsap.utils.toArray('.nav__link', nav);
    var active = nav.querySelector('.nav__link.is-active');

    function moveTo(el) {
      gsap.to(indicator, {
        x: el.offsetLeft, width: el.offsetWidth, opacity: 1,
        duration: 0.35, ease: 'power2.out'
      });
    }

    if (active) gsap.set(indicator, { x: active.offsetLeft, width: active.offsetWidth, opacity: 1 });

    links.forEach(function (link) {
      link.addEventListener('mouseenter', function () { moveTo(link); });
    });
    nav.addEventListener('mouseleave', function () {
      if (active) moveTo(active);
      else gsap.to(indicator, { opacity: 0, duration: 0.3 });
    });
  })();

  /* ---------------------------------------------------------------- */
  /* Lucide icons (feature card icons on Home)                         */
  /* ---------------------------------------------------------------- */
  (function initLucide(tries) {
    var n = tries || 0;
    if (window.lucide && window.lucide.createIcons) { window.lucide.createIcons(); return; }
    if (n > 60) return;
    window.setTimeout(function () { initLucide(n + 1); }, 60);
  })();

  /* ---------------------------------------------------------------- */
  /* Tab-visibility safety net — a backgrounded tab throttles rAF,     */
  /* which can leave ScrollTrigger's viewport math stale. Refresh once */
  /* the tab is foregrounded again so reveals fire correctly.          */
  /* ---------------------------------------------------------------- */
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && window.ScrollTrigger) ScrollTrigger.refresh();
  });
})();
