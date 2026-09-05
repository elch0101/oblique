// Oblique — behavior ported from Oblique Site v4.dc.html (DCLogic component)
(function () {
  'use strict';

  // ---- Dynamic media: a static site cannot list a directory, so logos
  // come from images/logos/manifest.js and cases probe fixed names.
    //   images/cases/case-1..case-3   (case-1 = featured, case-2/3 = grid cards)
  var EXTS = ['png', 'jpg', 'jpeg', 'svg', 'webp'];
  function probeImage(base) {
    return new Promise(function (resolve) {
      var i = 0;
      (function tryNext() {
        if (i >= EXTS.length) return resolve(null);
        var url = base + '.' + EXTS[i++];
        var img = new Image();
        img.onload = function () { resolve(url); };
        img.onerror = tryNext;
        img.src = url;
      })();
    });
  }
  function probeSeries(base, count) {
    var probes = [];
    for (var i = 1; i <= count; i++) probes.push(probeImage(base + i));
    return Promise.all(probes);
  }

  // ---- Logo carousel: logos come from images/logos/manifest.js
  // (window.OBLIQUE_LOGOS). Filename minus extension = hover label.
  // Hidden until at least 4 logos load; found logos rendered twice for
  // the seamless -50% marquee loop.
  function probeUrl(url) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(url); };
      img.onerror = function () { resolve(null); };
      img.src = url;
    });
  }
  var track = document.getElementById('logo-track');
  if (track) {
    var names = window.OBLIQUE_LOGOS || [];
    Promise.all(names.map(function (n) {
      return probeUrl('images/logos/' + n).then(function (url) {
        return url && { url: url, label: n.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') };
      });
    })).then(function (logos) {
      var found = logos.filter(Boolean);
      var section = document.querySelector('.trusted');
      if (found.length < 4) {
        if (section) section.style.display = 'none';
        return;
      }
      var cells = '';
      for (var pass = 0; pass < 2; pass++) {
        for (var i = 0; i < found.length; i++) {
          var num = (i + 1 < 10 ? '0' : '') + (i + 1);
          cells +=
            '<div class="logo-cell">' +
            '<div class="logo-cell-num" title="' + found[i].label + '">' +
            '<span class="cell-idx">' + num + '</span> ' +
            '<span class="cell-lbl">' + found[i].label + '</span>' +
            '</div>' +
            '<div class="logo-wrap"><div class="logo-box">' +
            '<span class="img-slot"><img src="' + found[i].url + '" alt="' + found[i].label + '"></span>' +
            '</div></div>' +
            '</div>';
        }
      }
      track.innerHTML = cells;
    });
  }

  // ---- Casos: each case block is tied to its image; blocks without an
  // image are hidden. Zero images hides the whole section and its nav link.
  var casesSection = document.getElementById('casos');
  if (casesSection) {
    probeSeries('images/cases/case-', 3).then(function (urls) {
      var blocks = [casesSection.querySelector('.featured')].concat(
        Array.prototype.slice.call(casesSection.querySelectorAll('.case-card'))
      );
      var any = false;
      urls.forEach(function (url, i) {
        var block = blocks[i];
        if (!block) return;
        if (!url) {
          block.style.display = 'none';
          return;
        }
        any = true;
        var holder = block.querySelector('.featured-img, .case-img');
        if (holder) {
          var title = block.querySelector('.featured-title, .case-title');
          holder.innerHTML =
            '<img src="' + url + '" alt="' + (title ? title.textContent : 'caso ' + (i + 1)) + '">';
        }
      });
      if (!any) {
        casesSection.style.display = 'none';
        var nav = document.querySelector('.nav-link[data-spy="casos"]');
        if (nav) nav.style.display = 'none';
      }
    });
  }

  // ---- Scroll progress bar ----
  var progress = document.getElementById('nav-progress');
  var raf = 0;
  function onScroll() {
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      var d = document.documentElement;
      var max = d.scrollHeight - d.clientHeight;
      var pct = max > 0 ? Math.round((d.scrollTop / max) * 1000) / 10 : 0;
      if (progress) progress.style.width = pct + '%';
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---- Scrollspy: active nav link ----
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-link[data-spy]'));
  function setActive(id) {
    links.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('data-spy') === id);
    });
  }
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) setActive(e.target.id);
    });
  }, { rootMargin: '-35% 0px -55% 0px' });
  ['servicios', 'casos', 'metodo', 'equipo'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) spy.observe(el);
  });

  // ---- Reveal on scroll ----
  setTimeout(function () {
    var els = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('ob-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('ob-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e) { io.observe(e); });
    setTimeout(function () {
      els.forEach(function (e) { e.classList.add('ob-in'); });
    }, 6000);
  }, 120);
})();
