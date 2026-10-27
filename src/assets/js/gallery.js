// Gallery: filter chips and a full-screen viewer.
//
// No library. Filtering is a class on each tile, and the viewer walks whatever
// tiles are currently on show - so after filtering, the arrows stay inside
// that album instead of wandering into photos you cannot see.
(function () {
  var grid = document.querySelector("[data-gallery]");
  var box = document.querySelector("[data-lightbox]");
  if (!grid || !box) return;

  var img = box.querySelector("[data-lightbox-img]");
  var caption = box.querySelector("[data-lightbox-caption]");
  var at = 0;

  function shown() {
    return Array.prototype.filter.call(grid.querySelectorAll(".bk-gallery-item"), function (el) {
      return !el.hidden;
    });
  }

  function open(index) {
    var list = shown();
    if (!list.length) return;
    at = (index + list.length) % list.length;
    var button = list[at].querySelector("button");
    img.src = button.getAttribute("data-photo");
    img.alt = button.getAttribute("data-caption") || "";
    caption.textContent = button.getAttribute("data-caption") || "";
    box.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function close() {
    box.hidden = true;
    img.src = "";
    document.body.style.overflow = "";
  }

  grid.addEventListener("click", function (e) {
    var button = e.target.closest("button[data-photo]");
    if (!button) return;
    open(shown().indexOf(button.closest(".bk-gallery-item")));
  });

  box.querySelector("[data-lightbox-close]").addEventListener("click", close);
  box.querySelector("[data-lightbox-prev]").addEventListener("click", function () { open(at - 1); });
  box.querySelector("[data-lightbox-next]").addEventListener("click", function () { open(at + 1); });
  box.addEventListener("click", function (e) { if (e.target === box) close(); });

  document.addEventListener("keydown", function (e) {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") open(at - 1);
    else if (e.key === "ArrowRight") open(at + 1);
  });

  var chips = document.querySelector("[data-gallery-chips]");
  if (!chips) return;
  chips.addEventListener("click", function (e) {
    var chip = e.target.closest("button[data-filter]");
    if (!chip) return;
    var want = chip.getAttribute("data-filter");
    chips.querySelectorAll("button").forEach(function (b) { b.classList.toggle("is-on", b === chip); });
    grid.querySelectorAll(".bk-gallery-item").forEach(function (tile) {
      tile.hidden = want !== "all" && tile.getAttribute("data-album") !== want;
    });
  });
})();
