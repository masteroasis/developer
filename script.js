(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  var header = document.querySelector('.site-header');
  function onScroll() {
    if (window.scrollY > 8) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }
  if (header) {
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

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
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  var counters = document.querySelectorAll('[data-count]');
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) {
      el.textContent = target + suffix;
      return;
    }
    var duration = 1200;
    var startTime = null;
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }
  if (counters.length) {
    if (!reduceMotion) {
      counters.forEach(function (el) {
        var suffix = el.getAttribute('data-suffix') || '';
        el.textContent = '0' + suffix;
      });
    }
    if (reduceMotion || !('IntersectionObserver' in window)) {
      counters.forEach(animateCount);
    } else {
      var counterObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCount(entry.target);
              counterObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach(function (el) {
        counterObserver.observe(el);
      });
    }
  }

  var form = document.getElementById('contact-form');
  if (form) {
    var status = document.getElementById('form-status');
    var submitBtn = form.querySelector('button[type="submit"]');
    var config = window.LAKEFRONT_EMAIL_CONFIG || {};
    var configured =
      window.emailjs &&
      config.publicKey &&
      config.publicKey.indexOf('YOUR_') !== 0 &&
      config.serviceId &&
      config.templateId;

    if (configured) {
      emailjs.init({ publicKey: config.publicKey });
    }

    function setStatus(message, kind) {
      status.textContent = message;
      status.className = 'form-status' + (kind ? ' is-' + kind : '');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (form.company_website.value) {
        return;
      }

      var name = form.name.value.trim();
      var email = form.email.value.trim();
      var message = form.message.value.trim();

      if (!name || !email || !message) {
        setStatus('Please fill in your name, email, and message.', 'error');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setStatus('Please enter a valid email address.', 'error');
        return;
      }

      if (!configured) {
        setStatus(
          'The form isn’t connected yet — please email info@lakefronttelecom.com directly.',
          'error'
        );
        return;
      }

      submitBtn.disabled = true;
      var originalLabel = submitBtn.textContent;
      submitBtn.textContent = 'Sending…';
      setStatus('');

      emailjs
        .send(config.serviceId, config.templateId, {
          name: name,
          email: email,
          phone: form.phone.value.trim() || 'Not provided',
          message: message
        })
        .then(function () {
          form.reset();
          setStatus('Thanks! Your message is on its way — we’ll be in touch shortly.', 'success');
        })
        .catch(function () {
          setStatus(
            'Something went wrong sending your message. Please email info@lakefronttelecom.com directly.',
            'error'
          );
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        });
    });
  }

  var heroArt = document.querySelector('.hero-art');
  if (heroArt && !reduceMotion && window.matchMedia('(hover: hover)').matches) {
    var layers = heroArt.querySelectorAll('[data-depth]');
    heroArt.addEventListener('mousemove', function (e) {
      var rect = heroArt.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      layers.forEach(function (layer) {
        var depth = parseFloat(layer.getAttribute('data-depth'));
        layer.style.transform = 'translate(' + (x * depth).toFixed(2) + 'px, ' + (y * depth).toFixed(2) + 'px)';
      });
    });
    heroArt.addEventListener('mouseleave', function () {
      layers.forEach(function (layer) {
        layer.style.transform = 'translate(0, 0)';
      });
    });
  }
})();
