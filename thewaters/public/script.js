(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- basics */

  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  var navToggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.site-nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* -------------------------------------------------------------- bulletin */

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Parse YYYY-MM-DD as a LOCAL date. new Date('2026-09-01') parses as UTC,
  // which renders as Aug 31 for anyone west of Greenwich.
  function parseDate(value) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim());
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d.getTime()) ? null : d;
  }

  function fill(root, selector, text) {
    var el = root.querySelector(selector);
    if (!el) return null;
    if (text) {
      el.textContent = text;
    } else {
      el.remove();
      return null;
    }
    return el;
  }

  function renderEvents() {
    var list = document.getElementById('events-list');
    var tpl = document.getElementById('event-template');
    if (!list || !tpl) return;

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var upcoming = (window.SITE_EVENTS || [])
      .map(function (ev) {
        return { data: ev, when: parseDate(ev.date) };
      })
      .filter(function (item) {
        // An unparseable date is a typo in events.js — show it rather than
        // silently swallowing it, so the mistake is visible.
        return !item.when || item.when >= today;
      })
      .sort(function (a, b) {
        if (!a.when) return 1;
        if (!b.when) return -1;
        return a.when - b.when;
      });

    if (!upcoming.length) {
      list.innerHTML =
        '<p class="events-empty">Nothing on the calendar just yet — check back soon.</p>';
      return;
    }

    var frag = document.createDocumentFragment();

    upcoming.forEach(function (item) {
      var ev = item.data;
      var node = tpl.content.cloneNode(true);

      if (item.when) {
        fill(node, '[data-month]', MONTHS[item.when.getMonth()]);
        fill(node, '[data-day]', String(item.when.getDate()));
      } else {
        var chip = node.querySelector('.event-date');
        if (chip) chip.remove();
      }

      fill(node, '[data-title]', ev.title || 'Untitled event');
      fill(node, '[data-tag]', ev.tag);
      fill(node, '[data-desc]', ev.description);

      // Only show the separator dot when there is something on both sides.
      var when = fill(node, '[data-when]', ev.time);
      var where = fill(node, '[data-where]', ev.place);
      var dot = node.querySelector('.event-dot');
      if (dot && !(when && where)) dot.remove();
      if (!when && !where) {
        var meta = node.querySelector('.event-meta');
        if (meta) meta.remove();
      }

      var link = node.querySelector('[data-link]');
      if (link) {
        if (ev.link) {
          link.setAttribute('href', ev.link);
          link.setAttribute(
            'aria-label',
            'Details and signup for ' + (ev.title || 'this event')
          );
        } else {
          link.remove();
        }
      }

      frag.appendChild(node);
    });

    list.appendChild(frag);
  }

  renderEvents();

  /* ---------------------------------------------------------------- reveal */
  /* Runs after renderEvents so the event cards are observed too. */

  var revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) {
      el.classList.add('is-visible');
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ------------------------------------------------------------ bubble field */
  /* Bubbles drift up on their own and get a shove from the scroll wheel:
     scrolling down pushes them up faster, scrolling up slows them. */

  function initBubbles() {
    var canvas = document.querySelector('.bubble-field');
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    var bubbles = [];
    var w = 0;
    var h = 0;
    var boost = 0;
    var lastScrollY = window.scrollY;
    var lastFrame = 0;
    var rafId = null;

    function makeBubble(fromBottom) {
      // Squaring the random makes most bubbles small and a few big.
      var r = 3 + Math.pow(Math.random(), 2) * 24;
      return {
        x: Math.random() * w,
        y: fromBottom ? h + r + Math.random() * 60 : Math.random() * h,
        r: r,
        speed: 12 + r * 1.15 + Math.random() * 12,
        wobble: 5 + Math.random() * 15,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.14 + Math.random() * 0.28
      };
    }

    function seed() {
      var count = Math.round(Math.min(70, Math.max(18, (w * h) / 24000)));
      bubbles = [];
      for (var i = 0; i < count; i++) {
        bubbles.push(makeBubble(false));
      }
    }

    function sizeCanvas() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function paint(b) {
      var g = ctx.createRadialGradient(
        b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.1,
        b.x, b.y, b.r
      );
      g.addColorStop(0, 'rgba(255,255,255,' + Math.min(1, b.alpha * 1.9) + ')');
      g.addColorStop(0.55, 'rgba(214,240,235,' + b.alpha * 0.5 + ')');
      g.addColorStop(1, 'rgba(120,196,186,' + b.alpha * 0.3 + ')');

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,' + b.alpha * 0.7 + ')';
      ctx.stroke();
    }

    function frame(t) {
      if (!lastFrame) lastFrame = t;
      // Clamp dt so a backgrounded tab doesn't teleport everything on return.
      var dt = Math.min((t - lastFrame) / 1000, 0.05);
      lastFrame = t;

      boost *= 0.94;
      if (Math.abs(boost) < 0.4) boost = 0;

      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < bubbles.length; i++) {
        var b = bubbles[i];
        b.phase += dt * 1.6;
        b.y -= (b.speed + boost) * dt;
        b.x += Math.sin(b.phase) * b.wobble * dt;

        if (b.y + b.r < -10) {
          bubbles[i] = makeBubble(true);
          continue;
        }
        if (b.x < -b.r) b.x = w + b.r;
        else if (b.x > w + b.r) b.x = -b.r;

        paint(b);
      }

      rafId = window.requestAnimationFrame(frame);
    }

    function start() {
      if (rafId === null) {
        lastFrame = 0;
        rafId = window.requestAnimationFrame(frame);
      }
    }

    function stop() {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      boost += (y - lastScrollY) * 2.2;
      boost = Math.max(-150, Math.min(500, boost));
      lastScrollY = y;
    }, { passive: true });

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(sizeCanvas, 180);
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else start();
    });

    sizeCanvas();
    start();
  }

  if (!reduceMotion) {
    initBubbles();
  }

  /* ------------------------------------------------------------------ form */

  function showError(input, message) {
    clearError(input);
    input.setAttribute('aria-invalid', 'true');
    var msg = document.createElement('span');
    msg.className = 'field-error';
    msg.textContent = message;
    msg.id = input.id + '-error';
    input.setAttribute('aria-describedby', msg.id);
    input.parentNode.appendChild(msg);
  }

  function clearError(input) {
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
    var existing = input.parentNode.querySelector('.field-error');
    if (existing) existing.remove();
  }

  function validate(form) {
    var checks = [
      { id: 'name', test: function (v) { return v.length > 1; },
        message: 'Please enter your name.' },
      { id: 'email', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); },
        message: 'Please enter a valid email address.' },
      // Deliberately loose: 7+ digits. Real people type (555) 555-0100,
      // +1 555 555 0100, and 555.555.0100, and all of them are correct.
      { id: 'phone', test: function (v) { return (v.match(/\d/g) || []).length >= 7; },
        message: 'Please enter a phone number we can reach you on.' }
    ];

    var firstBad = null;

    checks.forEach(function (check) {
      var input = form.querySelector('#' + check.id);
      if (!input) return;
      var value = input.value.trim();
      if (check.test(value)) {
        clearError(input);
      } else {
        showError(input, check.message);
        if (!firstBad) firstBad = input;
      }
    });

    if (firstBad) {
      firstBad.focus();
      return false;
    }
    return true;
  }

  var form = document.querySelector('form[name="contact"]');
  if (form) {
    var status = form.querySelector('[data-form-status]');

    form.addEventListener('submit', function (e) {
      var honeypot = form.querySelector('#company');
      if (honeypot && honeypot.value) {
        e.preventDefault();
        return; // Bot. Fail silently.
      }

      if (!validate(form)) {
        e.preventDefault();
        if (status) status.textContent = '';
        return;
      }

      // No backend yet. Block the submit rather than let it look like it sent.
      // Remove data-form-unwired from the <form> tag once one is connected.
      if (form.hasAttribute('data-form-unwired')) {
        e.preventDefault();
        if (status) {
          status.textContent =
            'This form is not connected yet — please email hello@thewaters.life in the meantime.';
        }
      }
    });

    form.addEventListener('input', function (e) {
      if (e.target.hasAttribute('aria-invalid')) clearError(e.target);
    });
  }
})();
