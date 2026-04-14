(function () {
  var key = "ln-mock-theme";
  var root = document.documentElement;
  if (localStorage.getItem(key) === "dark") {
    root.setAttribute("data-theme", "dark");
  }
  function syncButtons() {
    var dark = root.getAttribute("data-theme") === "dark";
    document.querySelectorAll(".ln-theme-toggle").forEach(function (btn) {
      btn.setAttribute("aria-pressed", dark ? "true" : "false");
      btn.textContent = dark ? "라이트 모드" : "다크 모드";
    });
  }
  syncButtons();
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (!t.classList.contains("ln-theme-toggle")) return;
    var dark = root.getAttribute("data-theme") === "dark";
    if (dark) {
      root.removeAttribute("data-theme");
      localStorage.setItem(key, "light");
    } else {
      root.setAttribute("data-theme", "dark");
      localStorage.setItem(key, "dark");
    }
    syncButtons();
  });
})();
