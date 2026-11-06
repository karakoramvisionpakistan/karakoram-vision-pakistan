// "More" on a team photo opens the whole biography.
//
// The panel on the photo only ever shows as much as fits - anything longer is
// trimmed - so this is the way to read the rest.
(function () {
  // Phone par hover nahi hota: photo ya kone ka "+" dabane se bio khulta hai,
  // dobara dabane (ya kahin aur dabane) se band. Desktop par hover pehle jaisa.
  var noHover = window.matchMedia && window.matchMedia("(hover: none)").matches;
  function setOpen(card, open) {
    card.classList.toggle("is-open", open);
    var t = card.querySelector("[data-team-toggle]");
    if (t) t.setAttribute("aria-expanded", open ? "true" : "false");
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-team-more]")) return;
    var card = e.target.closest(".bk-team-card");
    var hit = card && card.querySelector(".bk-team-panel")
      && (e.target.closest("[data-team-toggle]") || (noHover && e.target.closest(".bk-team-photo")));
    var open = document.querySelectorAll(".bk-team-card.is-open");
    for (var i = 0; i < open.length; i++) if (!hit || open[i] !== card) setOpen(open[i], false);
    if (hit) setOpen(card, !card.classList.contains("is-open"));
  });

  var modal = document.querySelector("[data-team-modal]");
  if (!modal) return;

  var nameEl = modal.querySelector("[data-team-modal-name]");
  var roleEl = modal.querySelector("[data-team-modal-role]");
  var bioEl = modal.querySelector("[data-team-modal-bio]");

  function close() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  document.addEventListener("click", function (e) {
    var button = e.target.closest("[data-team-more]");
    if (button) {
      nameEl.textContent = button.getAttribute("data-name") || "";
      roleEl.textContent = button.getAttribute("data-role") || "";
      bioEl.textContent = button.getAttribute("data-bio") || "";
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      return;
    }
    if (e.target.closest("[data-team-close]") || e.target === modal) close();
  });

  document.addEventListener("keydown", function (e) {
    if (!modal.hidden && e.key === "Escape") close();
  });
})();
