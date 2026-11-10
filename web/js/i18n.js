// Language: English (the text in index.html) or Spanish (strings.js), switched in place.
// Song titles, artists and words from the lyrics are never translated.
import STRINGS from "./strings.js";

const d3 = window.d3;
const root = document.documentElement;
export const LANGS = ["en", "es"];
let lang = root.lang === "es" ? "es" : "en";     // chosen by the inline script in <head>

const LOCALES = {
  en: d3.formatLocale({ decimal: ".", thousands: ",", grouping: [3], currency: ["$", ""] }),
  es: d3.formatLocale({ decimal: ",", thousands: ".", grouping: [3], currency: ["", " €"], percent: " %" }),
};

export const getLang = () => lang;

export function t(key, vars = {}) {
  const s = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export const fmt = (spec) => LOCALES[lang].format(spec);
export const num = (v) => fmt(",")(v);
export const dec = (v, digits = 2) => fmt(`.${digits}f`)(v);
export const pct = (v, digits = 0) => (v == null ? "–" : fmt(`.${digits}%`)(v));
export const pctAxis = (v) => fmt(".0%")(v);
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// "1940s" / "años 40", "años 2000"
export const decade = (d) => (lang === "es" ? `años ${+d < 2000 ? String(d).slice(2) : d}` : `${d}s`);
// axis labels: "1940s" / "1940", and the compact "40s" / "1940" for crowded axes
export const decadeAxis = (d) => (lang === "es" ? String(d) : `${d}s`);
export const decadeShort = (d) => (lang === "es" ? String(d) : `${String(d).slice(2)}s`);

export const themeLabel = (th) => (lang === "es" && th.label_es ? th.label_es : th.label);

/* ---------------------------------------------------------------- static text */
// English originals, saved the first time an element is translated: element -> innerHTML,
// and "attribute@element" pairs -> attribute value
const original = new Map();
const originalAttr = new Map();
let originalTitle = null;

function applyStatic() {
  for (const el of document.querySelectorAll("[data-i18n]")) {
    if (!original.has(el)) original.set(el, el.innerHTML);
    el.innerHTML = lang === "en" ? original.get(el) : (STRINGS[lang][el.dataset.i18n] ?? original.get(el));
  }
  for (const el of document.querySelectorAll("[data-i18n-attr]")) {
    if (!originalAttr.has(el)) originalAttr.set(el, {});
    const saved = originalAttr.get(el);
    for (const pair of el.dataset.i18nAttr.split(";")) {   // "aria-label:key;placeholder:key"
      const [attr, key] = pair.split(":").map((s) => s.trim());
      if (!(attr in saved)) saved[attr] = el.getAttribute(attr) ?? "";
      el.setAttribute(attr, lang === "en" ? saved[attr] : (STRINGS[lang][key] ?? saved[attr]));
    }
  }
  if (originalTitle == null) originalTitle = document.title;
  document.title = lang === "en" ? originalTitle : t("meta.title");
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", t("meta.description"));
  for (const b of document.querySelectorAll("[data-lang]")) b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
}

/* ---------------------------------------------------------------- switching */
const listeners = [];
export function onLang(fn) { listeners.push(fn); }

export function setLang(next, { remember = false } = {}) {
  if (!LANGS.includes(next)) return;
  const changed = next !== lang;
  lang = next;
  root.lang = lang;
  applyStatic();
  if (remember) {
    try { localStorage.setItem("ste-lang", lang); } catch { /* storage unavailable */ }
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("lang", lang);
      window.history.replaceState(null, "", u);
    } catch { /* ignore */ }
  }
  if (changed) listeners.forEach((f) => f());
}

// called once, before the data loads: translate the static text and wire the EN | ES buttons
export function initLang() {
  for (const b of document.querySelectorAll("[data-lang]")) {
    b.addEventListener("click", () => setLang(b.dataset.lang, { remember: true }));
  }
  applyStatic();
  root.classList.remove("i18n-pending");
}
