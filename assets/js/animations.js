(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  document.addEventListener("DOMContentLoaded", function () {
    var selectors = [
      ".post > article > h2.section-head",
      ".post > article > p",
      ".post > article > ul",
      ".post > article > ol",
      ".entry-list > .entry-date",
      ".entry-list > .entry-body",
      "ol.bibliography > li",
    ];

    var els = document.querySelectorAll(selectors.join(","));

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
    );

    els.forEach(function (el) {
      el.classList.add("reveal");
      observer.observe(el);
    });
  });
})();
