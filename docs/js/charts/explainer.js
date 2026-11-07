// How a topic model reads a song, with an invented verse (no real lyrics on this page).
import { inkOn, themeColor } from "../ui.js";

const VERSE = [
  "We drove into town on a Friday night,",
  "the band was loud and we danced in the light,",
  "you looked at the sky and said it would rain,",
  "and I thought of the hurt and I thought of the change.",
];
// cleaned words: [word, theme key or null, kept?]; theme keys are resolved by label, not position
const WORDS = [
  ["drive", "towns"], ["town", "towns"], ["friday", null], ["night", null, false], ["band", "dance"],
  ["loud", "dance"], ["dance", "dance"], ["light", "sky"], ["look", null, false], ["sky", "sky"],
  ["rain", "sky"], ["think", "heart"], ["hurt", "heart"], ["change", "heart"],
];
const MIX_KEYS = [["towns", 0.26], ["dance", 0.30], ["sky", 0.24], ["heart", 0.20]];

export function explainer(el, themes) {
  const idx = (key) => themes.findIndex((t) => t.label.toLowerCase().includes(key));
  const WORDS_I = WORDS.map(([w, k, kept = true]) => [w, k == null ? null : idx(k), kept]);
  const MIX = MIX_KEYS.map(([k, v]) => [idx(k), v]);
  const label = (i) => themes[i].label;
  function chip(word, theme, kept = true, colored = false) {
    const c = document.createElement("span");
    c.className = `chip${kept ? "" : " chip--out"}`;
    if (colored && theme != null) {
      const dot = document.createElement("span");
      dot.className = "chip__dot";
      dot.style.background = themeColor(theme);
      c.appendChild(dot);
    }
    c.appendChild(document.createTextNode(word));
    return c;
  }
  function note(text) {
    const n = document.createElement("p");
    n.className = "explainer__note";
    n.textContent = text;
    return n;
  }
  const states = {
    lines() {
      const v = document.createElement("div");
      v.className = "verse";
      VERSE.forEach((l) => { const s = document.createElement("div"); s.textContent = l; v.appendChild(s); });
      return [v, note("An invented verse, written for this illustration.")];
    },
    words() {
      const c = document.createElement("div");
      c.className = "chips";
      WORDS_I.forEach(([w, t, kept]) => c.appendChild(chip(w, t, kept)));
      return [c, note("Struck out: words used by too many hits to tell themes apart.")];
    },
    topics() {
      const groups = document.createElement("div");
      groups.className = "groups";
      for (const [t] of MIX) {
        const g = document.createElement("div");
        g.className = "group";
        const title = document.createElement("div");
        title.className = "group__title";
        const dot = document.createElement("span");
        dot.className = "chip__dot";
        dot.style.background = themeColor(t);
        title.append(dot, document.createTextNode(label(t)));
        const chips = document.createElement("div");
        chips.className = "chips";
        WORDS_I.filter(([, th, kept]) => th === t && kept).forEach(([w]) => chips.appendChild(chip(w, t)));
        g.append(title, chips);
        groups.appendChild(g);
      }
      return [groups];
    },
    mix() {
      const bar = document.createElement("div");
      bar.className = "mixbar";
      bar.setAttribute("role", "img");
      bar.setAttribute("aria-label", MIX.map(([t, v]) => `${label(t)} ${Math.round(v * 100)}%`).join(", "));
      for (const [t, v] of MIX) {
        const seg = document.createElement("div");
        seg.style.flex = `${v} 1 0`;
        seg.style.background = themeColor(t);
        seg.style.color = inkOn(t);
        seg.textContent = `${Math.round(v * 100)}%`;
        bar.appendChild(seg);
      }
      const leg = document.createElement("div");
      leg.className = "legend";
      for (const [t] of MIX) {
        const it = document.createElement("span");
        it.className = "legend__item";
        const sw = document.createElement("span");
        sw.className = "legend__swatch";
        sw.style.background = themeColor(t);
        it.append(sw, document.createTextNode(label(t)));
        leg.appendChild(it);
      }
      return [bar, leg, note("Illustrative numbers for the invented verse.")];
    },
  };
  let current = "lines";
  const render = () => el.replaceChildren(...states[current]());
  return { render, update(step) { current = step; render(); } };
}
