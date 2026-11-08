const KEY = "vp-theme";

export type Tema = "dark" | "light";

export function getTheme(): Tema {
  if (document.documentElement.getAttribute("data-theme") === "dark") return "dark";
  return "light";
}

export function setTheme(theme: Tema) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  try { localStorage.setItem(KEY, theme); } catch (e) {}
}

export function toggleTheme(): Tema {
  const next = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}
