(function () {
  // Expand or collapse each project's full story.
  // The motion answers the click, so it shows what changed.
  document.querySelectorAll('[data-project]').forEach(function (project) {
    var button = project.querySelector('.toggle');
    var body = project.querySelector('.project-body');
    if (!button || !body) return;

    button.addEventListener('click', function () {
      var isOpen = project.classList.toggle('open');
      button.setAttribute('aria-expanded', String(isOpen));
      button.textContent = isOpen ? 'Hide the story' : 'Read the full story';
      if (isOpen) {
        body.hidden = false;
      } else {
        // Hide after the collapse transition finishes
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        setTimeout(function () {
          if (!project.classList.contains('open')) body.hidden = true;
        }, reduce ? 0 : 460);
      }
    });
  });
})();

// Page loader: keep it visible through the 1.2s check animation,
// then fade it out once the page has finished loading.
(function () {
  var loader = document.getElementById('siteLoader');
  if (!loader) return;

  document.documentElement.classList.add('is-loading');

  var MIN_SHOW_MS = 1200; // ring (1s) + check (0.2s)
  var start = Date.now();
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function hide() {
    document.documentElement.classList.remove('is-loading');
    loader.classList.add('is-done');
  }

  function finish() {
    var wait = reduce ? 0 : Math.max(0, MIN_SHOW_MS - (Date.now() - start));
    setTimeout(hide, wait);
  }

  if (document.readyState === 'complete') finish();
  else window.addEventListener('load', finish);

  // Safety net: never leave the visitor stuck behind the loader
  setTimeout(hide, 5000);
})();


// Scroll reveal for sections and cards.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  var targets = document.querySelectorAll(
    '.section-head, .project, .feature, .skill-card, .edu-card, .exp-item, .footer-inner > *'
  );
  targets.forEach(function (el) { el.classList.add('reveal'); });

  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(function (el) { observer.observe(el); });
})();




// Company logos: if a logo file is missing, show the text name instead.
(function () {
  document.querySelectorAll('.exp-logo').forEach(function (wrap) {
    var img = wrap.querySelector('img');
    if (!img) return;
    var fallback = wrap.querySelector('.logo-fallback');
    var mark = function () {
      wrap.classList.add('is-missing');
      img.style.display = 'none';
      if (fallback) fallback.hidden = false;
    };
    img.addEventListener('error', mark);
    if (img.complete && img.naturalWidth === 0) mark();
  });
})();


// Always open the page at the top, including when returning to it.
(function () {
  function toTop() {
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  document.addEventListener('DOMContentLoaded', toTop);
  window.addEventListener('load', function () { toTop(); setTimeout(toTop, 60); });
  window.addEventListener('pageshow', function (e) { if (e.persisted) toTop(); });
})();

// Category cards: tilt toward the cursor, glare follows it, and the card lifts.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduce || !finePointer) return;

  document.querySelectorAll('.sticker').forEach(function (card) {
    card.addEventListener('pointerenter', function () {
      card.classList.add('is-active');
    });
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--ry', ((px - 0.5) * 14).toFixed(2) + 'deg');
      card.style.setProperty('--rx', ((0.5 - py) * 10).toFixed(2) + 'deg');
      card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
    });
    card.addEventListener('pointerleave', function () {
      card.classList.remove('is-active');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
    card.addEventListener('click', function () {
      card.classList.remove('is-stamped');
      void card.offsetWidth;
      card.classList.add('is-stamped');
    });
  });
})();


// Nav links: jump directly to the section, highlight the clicked link at once,
// and keep the scroll-spy from flickering through the sections on the way.
(function () {
  var links = document.querySelectorAll('.nav-links a[href^="#"]');
  var header = document.querySelector('.topbar');
  var timer = null;

  links.forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href').slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();

      var headerH = header ? header.offsetHeight : 0;
      var top = target.getBoundingClientRect().top + window.pageYOffset - headerH - 12;

      window.__navLock = true;
      clearTimeout(timer);
      links.forEach(function (l) { l.classList.toggle('active', l === link); });

      window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
      history.replaceState(null, '', '#' + id);

      timer = setTimeout(function () {
        window.__navLock = false;
        if (window.__navSync) window.__navSync();
      }, 700);
    });
  });
})();


// Highlight state: the nav link for the section in view, or the brand name at the top.
// Recomputed from the real scroll position, so returning to the top always restores it.
(function () {
  var brand = document.querySelector('.brand');
  var header = document.querySelector('.topbar');
  var pairs = [];
  // Some nav links cover more than one area of the page. Projects covers both
  // the category stickers (#projects) and the project groups below them (#selected).
  var alsoCovers = { '#projects': ['#selected'] };
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(function (a) {
    var href = a.getAttribute('href');
    var targets = [href].concat(alsoCovers[href] || []);
    targets.forEach(function (h) {
      var el = document.querySelector(h);
      if (el) pairs.push({ link: a, el: el });
    });
  });
  var ticking = false;

  function update() {
    ticking = false;
    if (window.__navLock) return;
    var headerH = header ? header.offsetHeight : 0;
    var line = headerH + 140;
    var current = null;
    // Pick the section whose top is closest above the line (the one on screen),
    // rather than the last link in nav order, since Explore sits above Experience.
    var bestTop = -Infinity;
    pairs.forEach(function (p) {
      var t = p.el.getBoundingClientRect().top;
      if (t <= line && t > bestTop) { bestTop = t; current = p; }
    });
    if (window.pageYOffset < 40) current = null;

    // At the very bottom of the page, the last section (Contact) is the one on screen,
    // even when its top has not reached the reading line yet.
    var atBottom = window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 4;
    if (atBottom && pairs.length) {
      for (var i = pairs.length - 1; i >= 0; i--) {
        if (pairs[i].link.getAttribute('href') === '#contact') { current = pairs[i]; break; }
      }
    }

    // Clear every link first, then mark the one that owns the current area.
    // (A link can own two areas, so toggling per entry would let one undo the other.)
    pairs.forEach(function (p) { p.link.classList.remove('active'); });
    if (current) current.link.classList.add('active');
    if (brand) brand.classList.toggle('is-current', current === null);
  }

  function request() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.__navSync = update;
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  window.addEventListener('pageshow', update);
  document.addEventListener('DOMContentLoaded', update);
  window.addEventListener('load', function () { update(); setTimeout(update, 80); });
  update();
})();


// Feature rows: expand or collapse "The full story".
(function () {
  document.querySelectorAll('.feature-toggle').forEach(function (btn) {
    var story = btn.parentElement.querySelector('.feature-story');
    if (!story) return;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      if (open) {
        story.hidden = true;
      } else {
        story.hidden = false;
      }
    });
  });
})();
