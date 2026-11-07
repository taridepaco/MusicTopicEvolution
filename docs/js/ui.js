// Shared helpers: colours from CSS tokens, motion, tooltip, legend, tables, resize.
const d3 = window.d3;

export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const dur = (ms = 650) => (reducedMotion() ? 0 : ms);

export const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
export const themeColor = (i) => css(`--s${i + 1}`);
// text inside a coloured fill: white, except near-black on the yellow slot (palette rule)
export const inkOn = (i) => (i === 3 ? "#0b0b0b" : "#ffffff");

export const pct = (v, digits = 0) => (v == null ? "–" : `${(v * 100).toFixed(digits)}%`);
export const pctAxis = (v) => `${Math.round(v * 100)}%`;

export function box(el) {
  const r = el.getBoundingClientRect();
  return { width: Math.max(260, r.width), height: Math.max(220, r.height) };
}

/* ---------------------------------------------------------------- tooltip */
const tipEl = () => document.getElementById("tooltip");

export function showTip(event, title, rows) {
  const el = tipEl();
  el.replaceChildren();
  const t = document.createElement("div");
  t.className = "tooltip__title";
  t.textContent = title;
  el.appendChild(t);
  for (const r of rows) {
    const row = document.createElement("div");
    row.className = "tooltip__row";
    const k = document.createElement("span");
    k.className = "k";
    if (r.color) {
      const key = document.createElement("span");
      key.className = "tooltip__key";
      key.style.background = r.color;
      k.appendChild(key);
    }
    k.appendChild(document.createTextNode(r.label));
    const v = document.createElement("span");
    v.className = "v";
    v.textContent = r.value;
    row.append(v, k);              // the value leads, the label follows
    el.appendChild(row);
  }
  el.hidden = false;
  const pad = 14;
  const { innerWidth: W, innerHeight: H } = window;
  const rect = el.getBoundingClientRect();
  let x = event.clientX + pad, y = event.clientY + pad;
  if (x + rect.width > W - 8) x = event.clientX - rect.width - pad;
  if (y + rect.height > H - 8) y = event.clientY - rect.height - pad;
  el.style.left = `${Math.max(8, x)}px`;
  el.style.top = `${Math.max(8, y)}px`;
}
export const hideTip = () => { tipEl().hidden = true; };

/* ---------------------------------------------------------------- legend */
export function legend(el, items) {
  el.replaceChildren();
  for (const it of items) {
    const span = document.createElement("span");
    span.className = "legend__item";
    const key = document.createElement("span");
    key.className = it.kind === "line" ? "legend__line" : "legend__swatch";
    key.style.background = it.color;
    span.append(key, document.createTextNode(it.label));
    el.appendChild(span);
  }
}

/* ---------------------------------------------------------------- tables */
export function table(el, columns, rows) {
  el.replaceChildren();
  const t = document.createElement("table");
  t.className = "data";
  const thead = t.createTHead().insertRow();
  for (const c of columns) {
    const th = document.createElement("th");
    th.textContent = c;
    thead.appendChild(th);
  }
  const tb = t.createTBody();
  for (const r of rows) {
    const tr = tb.insertRow();
    for (const v of r) tr.insertCell().textContent = v;
  }
  el.appendChild(t);
}

export function tableToggle(button, slot, build) {
  button.addEventListener("click", () => {
    const open = slot.hidden;
    if (open && !slot.firstChild) build(slot);
    slot.hidden = !open;
    button.textContent = open ? "Hide the table" : "Show the data as a table";
  });
}

/* ---------------------------------------------------------------- redraws */
const redraws = new Set();
export function onRedraw(fn) { redraws.add(fn); }
let timer;
function redrawAll() { clearTimeout(timer); timer = setTimeout(() => redraws.forEach((f) => f()), 120); }
window.addEventListener("resize", redrawAll);
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", redrawAll);
new MutationObserver(redrawAll).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

/* ---------------------------------------------------------------- axes */
export function yGrid(g, y, width, ticks = 5, format = pctAxis) {
  g.attr("class", "axis");
  g.call(d3.axisLeft(y).ticks(ticks).tickSize(-width).tickFormat(format));
  g.select(".domain").remove();
  g.selectAll(".tick line").attr("class", "grid-line").attr("stroke", "var(--grid)");
  g.selectAll(".tick text").attr("x", -6);
}
export function xAxis(g, x, ticks, format = d3.format("d")) {
  g.attr("class", "axis");
  g.call(d3.axisBottom(x).ticks(ticks).tickFormat(format).tickSizeOuter(0));
  g.select(".domain").attr("stroke", "var(--axis)");
  g.selectAll(".tick line").attr("stroke", "var(--axis)");
}
