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
