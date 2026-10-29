// "More" on a team photo opens the whole biography.
//
// The panel on the photo only ever shows as much as fits - anything longer is
// trimmed - so this is the way to read the rest.
(function () {
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
