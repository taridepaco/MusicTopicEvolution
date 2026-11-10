// "Look up a song": an accessible combobox over the 6,826 hits and their theme mix.
import { inkOn, legend, themeColor } from "../ui.js";
import { onLang, pct, t, themeLabel } from "../i18n.js";

const norm = (s) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function songSearch(root, songsData, themes) {
  const input = root.querySelector("#search-input");
  const list = root.querySelector("#search-list");
  const result = document.getElementById("search-result");
  const [TITLE, ARTIST, YEARS, RANK, STATUS, WEIGHTS] = [0, 1, 2, 3, 4, 5];
  const songs = songsData.songs.map((r) => ({ r, key: norm(`${r[TITLE]} ${r[ARTIST]}`), title: norm(r[TITLE]) }));
  const labelOf = new Map(themes.map((th, i) => [th.id, [th, i]]));
  const name = (id) => themeLabel(labelOf.get(id)[0]);
  let matches = [], active = -1;

  function search(q) {
    const n = norm(q.trim());
    if (n.length < 2) return [];
    const starts = [], contains = [];
    for (const s of songs) {
      if (s.title.startsWith(n)) starts.push(s);
      else if (s.key.includes(n)) contains.push(s);
      if (starts.length >= 8) break;
    }
    return [...starts, ...contains].slice(0, 8);
  }
  function close() { list.hidden = true; input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant"); active = -1; }
  function open(items) {
    list.replaceChildren();
    items.forEach((s, i) => {
      const li = document.createElement("li");
      li.id = `song-opt-${i}`;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", "false");
      const ttl = document.createElement("div");
      ttl.textContent = s.r[TITLE];
      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = `${s.r[ARTIST]} · ${s.r[YEARS].join(", ")}`;
      li.append(ttl, meta);
      li.addEventListener("mousedown", (e) => { e.preventDefault(); choose(i); });
      list.appendChild(li);
    });
    list.hidden = items.length === 0;
    input.setAttribute("aria-expanded", String(items.length > 0));
  }
  function highlight(i) {
    [...list.children].forEach((li, k) => li.setAttribute("aria-selected", String(k === i)));
    active = i;
    if (i >= 0) { input.setAttribute("aria-activedescendant", `song-opt-${i}`); list.children[i].scrollIntoView({ block: "nearest" }); }
  }
  let current = null;
  function pick(s) {
    current = s;
    input.value = `${s.r[TITLE]} — ${s.r[ARTIST]}`;
    close();
    show(s.r);
  }
  function choose(i) { if (matches[i]) pick(matches[i]); }
  // random pick among the songs that have a theme mix, never the one on screen
  const pool = songs.filter((s) => s.r[STATUS] === "m");
  root.querySelector("#search-random").addEventListener("click", () => {
    let s;
    do s = pool[Math.floor(Math.random() * pool.length)]; while (s === current && pool.length > 1);
    pick(s);
  });
  function show(r) {
    const card = document.createElement("div");
    card.className = "result-card";
    const h = document.createElement("h3");
    h.textContent = r[TITLE];
    const meta = document.createElement("p");
    meta.className = "meta";
    meta.textContent = t("search.meta", { artist: r[ARTIST], years: r[YEARS].join(", "), rank: r[RANK] });
    card.append(h, meta);
    if (r[STATUS] !== "m") {
      const p = document.createElement("p");
      p.textContent = t("search.notin", { reason: t(`status.${r[STATUS]}`) });
      card.appendChild(p);
    } else {
      const parts = songsData.themes.map((id, k) => ({ id, v: r[WEIGHTS][k] / 100 }))
        .filter((p) => p.v >= 0.01).sort((a, b) => b.v - a.v);
      const rest = Math.max(0, 1 - parts.reduce((a, p) => a + p.v, 0));
      const bar = document.createElement("div");
      bar.className = "segbar";
      bar.setAttribute("role", "img");
      bar.setAttribute("aria-label", parts.map((p) => `${name(p.id)} ${pct(p.v)}`).join(", ")
        + `, ${t("search.rest")} ${pct(rest)}`);
      for (const p of parts) {
        const [, i] = labelOf.get(p.id);
        const seg = document.createElement("div");
        seg.style.flex = `${p.v} 1 0`;
        seg.style.background = themeColor(i);
        seg.style.color = inkOn(i);
        if (p.v >= 0.09) seg.textContent = pct(p.v);
        seg.title = `${name(p.id)}: ${pct(p.v)}`;
        bar.appendChild(seg);
      }
      if (rest > 0.01) {
        const seg = document.createElement("div");
        seg.style.flex = `${rest} 1 0`;
        seg.style.background = "var(--mark-faint)";
        seg.style.color = "var(--ink)";
        if (rest >= 0.09) seg.textContent = pct(rest);
        bar.appendChild(seg);
      }
      const leg = document.createElement("div");
      leg.className = "legend";
      legend(leg, [...parts.map((p) => {
        const [, i] = labelOf.get(p.id);
        return { label: `${name(p.id)} ${pct(p.v)}`, color: themeColor(i) };
      }), ...(rest > 0.01 ? [{ label: `${t("search.rest")} ${pct(rest)}`, color: "var(--mark-faint)" }] : [])]);
      card.append(bar, leg);
    }
    result.replaceChildren(card);
  }

  input.addEventListener("input", () => { matches = search(input.value); open(matches); highlight(-1); });
  input.addEventListener("keydown", (e) => {
    if (list.hidden && e.key === "ArrowDown") { matches = search(input.value); open(matches); }
    if (e.key === "ArrowDown") { e.preventDefault(); highlight(Math.min(matches.length - 1, active + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); highlight(Math.max(0, active - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); choose(active >= 0 ? active : 0); }
    else if (e.key === "Escape") close();
  });
  input.addEventListener("blur", () => setTimeout(close, 100));
  onLang(() => { if (current) show(current.r); });
  return { show, search };
}
