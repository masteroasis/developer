(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CFG = window.SITE_CONFIG || {};

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

  /* ---------------------------------------------------------------- reveal */
  /* Set up first so content rendered later (events arrive async) can register. */

  var revealObserver = null;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(
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
  }

  function registerReveals(root) {
    var els = (root || document).querySelectorAll('.reveal');
    els.forEach(function (el) {
      if (revealObserver) revealObserver.observe(el);
      else el.classList.add('is-visible');
    });
  }

  /* -------------------------------------------------------------- helpers */

  function fill(root, selector, text) {
    var el = root.querySelector(selector);
    if (!el) return null;
    if (text) {
      el.textContent = text;
      return el;
    }
    el.remove();
    return null;
  }

  function drop(root, selector) {
    var el = root.querySelector(selector);
    if (el) el.remove();
  }

  // Only http(s) links. Blocks javascript: and data: URLs from sneaking in
  // through a spreadsheet a volunteer edits.
  function safeUrl(value) {
    var s = String(value || '').trim();
    return /^https?:\/\//i.test(s) ? s : '';
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

  // Minimal RFC4180 CSV reader — handles quoted fields containing commas,
  // newlines, and doubled quotes, which Google Sheets emits freely.
  function parseCSV(text) {
    var rows = [];
    var row = [];
    var field = '';
    var inQuotes = false;
    var src = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (var i = 0; i < src.length; i++) {
      var c = src.charAt(i);
      if (inQuotes) {
        if (c === '"') {
          if (src.charAt(i + 1) === '"') { field += '"'; i++; }
          else { inQuotes = false; }
        } else {
          field += c;
        }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field); field = '';
      } else if (c === '\n') {
        row.push(field); rows.push(row); row = []; field = '';
      } else {
        field += c;
      }
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  function csvToEvents(text) {
    var rows = parseCSV(text).filter(function (r) {
      return r.some(function (cell) { return String(cell).trim() !== ''; });
    });
    if (rows.length < 2) return [];

    var head = rows[0].map(function (h) { return String(h).trim().toLowerCase(); });
    return rows.slice(1).map(function (r) {
      var obj = {};
      head.forEach(function (key, i) { obj[key] = String(r[i] || '').trim(); });
      return obj;
    });
  }

  function renderEvents(data) {
    var list = document.getElementById('events-list');
    var tpl = document.getElementById('event-template');
    if (!list || !tpl) return;

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var upcoming = (data || [])
      .map(function (ev) { return { data: ev, when: parseDate(ev.date) }; })
      .filter(function (item) {
        // An unparseable date means a typo in the source — show it rather than
        // silently swallowing it, so the mistake is visible to whoever typed it.
        return !item.when || item.when >= today;
      })
      .sort(function (a, b) {
        if (!a.when) return 1;
        if (!b.when) return -1;
        return a.when - b.when;
      });

    list.innerHTML = '';

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
        drop(node, '.event-date');
      }

      fill(node, '[data-title]', ev.title || 'Untitled event');
      fill(node, '[data-tag]', ev.tag);
      fill(node, '[data-desc]', ev.description);

      // Only show the separator dot when there is something on both sides.
      var when = fill(node, '[data-when]', ev.time);
      var where = fill(node, '[data-where]', ev.place);
      if (!(when && where)) drop(node, '.event-dot');
      if (!when && !where) drop(node, '.event-meta');

      var rsvpUrl = safeUrl(ev.rsvp);
      var linkUrl = safeUrl(ev.link);

      var rsvp = node.querySelector('[data-rsvp]');
      if (rsvp) {
        if (rsvpUrl) {
          rsvp.setAttribute('href', rsvpUrl);
          rsvp.setAttribute('rel', 'noopener');
          rsvp.setAttribute('aria-label', 'Save my spot for ' + (ev.title || 'this event'));
        } else {
          rsvp.remove();
        }
      }

      var link = node.querySelector('[data-link]');
      if (link) {
        if (linkUrl) {
          link.setAttribute('href', linkUrl);
          link.setAttribute('rel', 'noopener');
          link.setAttribute('aria-label', 'Details for ' + (ev.title || 'this event'));
        } else {
          link.remove();
        }
      }

      if (!rsvpUrl && !linkUrl) drop(node, '.event-actions');

      frag.appendChild(node);
    });

    list.appendChild(frag);
    registerReveals(list);
  }

  function loadEvents() {
    var src = String(CFG.eventsSource || 'local').trim();
    var local = window.SITE_EVENTS || [];

    if (!/^https?:\/\//i.test(src)) {
      renderEvents(local);
      return;
    }

    fetch(src, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (text) {
        var rows = /^\s*[[{]/.test(text) ? JSON.parse(text) : csvToEvents(text);
        if (!rows.length) throw new Error('source returned no rows');
        renderEvents(rows);
      })
      .catch(function (err) {
        // Never leave the bulletin empty because a spreadsheet moved.
        console.warn('[bulletin] remote source failed, falling back to events.js:', err);
        renderEvents(local);
      });
  }

  loadEvents();

  /* --------------------------------------------------------------- gather */

  function wireGather() {
    var pairs = [
      ['[data-volunteer-link]', CFG.volunteerUrl],
      ['[data-booking-link]', CFG.bookingUrl]
    ];
    var shown = 0;

    pairs.forEach(function (pair) {
      var el = document.querySelector(pair[0]);
      if (!el) return;
      var url = safeUrl(pair[1]);
      if (url) {
        el.setAttribute('href', url);
        el.setAttribute('rel', 'noopener');
        el.removeAttribute('hidden');
        shown++;
      } else {
        el.remove();
      }
    });

    var stub = document.querySelector('[data-gather-stub]');
    if (stub && shown) stub.remove();

    // An empty flex row still carries its margin, leaving a phantom gap.
    // :empty won't catch it because of the whitespace between the tags.
    if (!shown) {
      var cta = document.querySelector('.section-cta');
      if (cta) cta.remove();
    }
  }

  wireGather();

  /* -------------------------------------------------------------- support */

  function renderSupport() {
    var list = document.getElementById('support-list');
    var tpl = document.getElementById('support-template');
    var stub = document.querySelector('[data-support-stub]');
    if (!list || !tpl) return;

    var items = (CFG.support && CFG.support.items) || [];
    if (!items.length) {
      list.remove();
      return;
    }

    var frag = document.createDocumentFragment();
    var live = 0;

    items.forEach(function (item) {
      var node = tpl.content.cloneNode(true);
      fill(node, '[data-price]', item.price);
      fill(node, '[data-name]', item.name || 'Item');
      fill(node, '[data-desc]', item.description);

      var url = safeUrl(item.url);
      var btn = node.querySelector('[data-buy]');
      var soon = node.querySelector('[data-soon]');

      if (url && btn) {
        btn.setAttribute('href', url);
        btn.setAttribute('rel', 'noopener');
        btn.textContent = item.cta || 'Buy';
        btn.setAttribute('aria-label', (item.cta || 'Buy') + ' — ' + (item.name || 'item'));
        if (soon) soon.remove();
        live++;
      } else {
        if (btn) btn.remove();
      }

      frag.appendChild(node);
    });

    list.appendChild(frag);
    registerReveals(list);

    // The warning only earns its place while nothing can actually be bought.
    if (stub && live === items.length) stub.remove();
  }

  renderSupport();

  /* Anything still in the static markup. */
  registerReveals(document);

  /* --------------------------------------------------------- bubble field */
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
      { id: 'name', message: 'Please enter your name.',
        test: function (v) { return v.length > 1; } },
      { id: 'email', message: 'Please enter a valid email address.',
        test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); } },
      // Deliberately loose: 7+ digits. Real people type (555) 555-0100,
      // +1 555 555 0100, and 555.555.0100, and all of them are correct.
      { id: 'phone', message: 'Please enter a phone number we can reach you on.',
        test: function (v) { return (v.match(/\d/g) || []).length >= 7; } }
    ];

    var firstBad = null;

    checks.forEach(function (check) {
      var input = form.querySelector('#' + check.id);
      if (!input) return;
      if (check.test(input.value.trim())) {
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
    var submitBtn = form.querySelector('button[type="submit"]');

    var say = function (text) {
      if (status) status.textContent = text;
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var honeypot = form.querySelector('#company');
      if (honeypot && honeypot.value) return; // Bot. Fail silently.

      if (!validate(form)) {
        say('');
        return;
      }

      var endpoint = safeUrl(CFG.contactEndpoint);
      if (!endpoint) {
        say('This form is not connected yet — please email hello@thewaters.life in the meantime.');
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      say('Sending…');

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          form.reset();
          say('Thank you — we have your details and someone will be in touch soon.');
        })
        .catch(function () {
          say('Something went wrong sending that. Please email hello@thewaters.life instead.');
        })
        .then(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });

    form.addEventListener('input', function (e) {
      if (e.target.hasAttribute('aria-invalid')) clearError(e.target);
    });
  }
})();
