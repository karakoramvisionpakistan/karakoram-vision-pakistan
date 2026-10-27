// A row that only slides when it has to.
//
// Five photos fit on a wide screen. With five or fewer the row simply sits in
// the middle and the arrows stay hidden - arrows that do nothing are worse
// than no arrows. Add a sixth and they appear.
//
// No library: the browser's own smooth scrolling does the work, so this costs
// nothing on page load.
(function () {
  function setup(strip) {
    var track = strip.querySelector("[data-strip-track]");
    var prev = strip.querySelector("[data-strip-prev]");
    var next = strip.querySelector("[data-strip-next]");
    if (!track) return;

    function step() {
      var first = track.firstElementChild;
      var card = first ? first.getBoundingClientRect().width + 24 : 240;
      return Math.max(card, Math.round(track.clientWidth * 0.8));
    }

    function refresh() {
      var overflows = track.scrollWidth > track.clientWidth + 4;
      strip.classList.toggle("is-sliding", overflows);
      if (!prev || !next) return;
      prev.disabled = !overflows || track.scrollLeft <= 2;
      next.disabled = !overflows || track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    }

    if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
    if (next) next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: "smooth" }); });
    track.addEventListener("scroll", refresh, { passive: true });
    window.addEventListener("resize", refresh);
    refresh();
  }

  function start() { document.querySelectorAll("[data-strip]").forEach(setup); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
