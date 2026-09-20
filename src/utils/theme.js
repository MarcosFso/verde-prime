const KEY = "vp-theme";

export function getTheme() {
  if (document.documentElement.getAttribute("data-theme") === "dark") return "dark";
  return "light";
}

export function setTheme(theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  try { localStorage.setItem(KEY, theme); } catch (e) {}
}

export function toggleTheme() {
  const next = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}
