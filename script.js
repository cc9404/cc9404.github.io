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

  // Highlight the nav link for the section in view.
  var links = document.querySelectorAll('.nav-links a[href^="#"]');
  var sections = [];
  links.forEach(function (link) {
    var target = document.querySelector(link.getAttribute('href'));
    if (target) sections.push({ link: link, target: target });
  });

  if ('IntersectionObserver' in window && sections.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        sections.forEach(function (s) {
          s.link.classList.toggle('active', s.target === entry.target);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { observer.observe(s.target); });
  }
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
    '.section-head, .project, .skill-card, .edu-card, .exp-item, .footer-inner > *'
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


// Category stickers: a short stamp on click, then the normal anchor scroll.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-stamp]').forEach(function (el) {
    el.addEventListener('click', function () {
      if (reduce) return;
      el.classList.remove('is-stamped');
      void el.offsetWidth; // restart the animation
      el.classList.add('is-stamped');
    });
  });
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
