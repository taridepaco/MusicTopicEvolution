// Theme by theme: the focused theme with its confidence band, the others as faint context.
import { box, dur, hideTip, legend, pct, showTip, themeColor, xAxis, yGrid } from "../ui.js";
const d3 = window.d3;

const NOTES = {
  "Hip-hop swagger": "Explicit language, money and status. Close to absent until 1990, it takes off with 1990s rap and reaches about a fifth of the words of the hits in the 2010s and 2020s.",
  "Heartache and second thoughts": "The biggest theme in every decade: hurt, doubts, changes and endings. It peaks in the power-ballad 1980s, when it takes 45% of the words, and drops back to about 30%.",
  "On the dance floor": "Dance, party, rock, beat, groove. Remarkably steady, between 7% and 10% for eighty years, with peaks in the twist years of the early 1960s and the disco 1970s.",
  "Towns, rides and bars": "Towns, roads, cars, drinks and bars. It sags in the 1980s–2000s and comes back with the country hits of the 2010s and 2020s.",
  "Sky, sun and rain": "Sky, sun, rain, wind, stars, the sea. Natural imagery halves, from 17% of the words of the 1940s hits to 8% in the 2020s.",
  "In the club": "Clubs, bodies and dance-floor bravado: the club-rap years. It rises with late-1990s hip-hop, peaks around 2004 and settles back.",
};

export function buildTourSteps(container, themes) {
  const intro = document.createElement("div");
  intro.className = "step";
  intro.dataset.step = "all";
  const p = document.createElement("p");
  p.textContent = "Here are the six themes, each as the share of a year's hit lyrics that goes to it. Hover or tap the chart to read the values. Now one at a time, core themes first.";
  intro.appendChild(p);
  container.appendChild(intro);
  themes.forEach((t, i) => {
    const s = document.createElement("div");
    s.className = "step";
    s.dataset.step = t.id;
    const h = document.createElement("h3");
    const key = document.createElement("span");
    key.className = "theme-key";
    key.style.background = themeColor(i);
    const tier = document.createElement("span");
    tier.className = "tier";
    tier.textContent = t.tier;
    h.append(key, document.createTextNode(t.label), tier);
    const note = document.createElement("p");
    note.textContent = NOTES[t.label] || t.summary;
    const words = document.createElement("p");
    words.className = "words";
    words.textContent = `Words: ${t.words.slice(0, 10).join(", ")}`;
    const songsTitle = document.createElement("p");
    songsTitle.className = "words";
    songsTitle.textContent = "Songs where it dominates:";
    const ul = document.createElement("ul");
    ul.className = "songs";
    for (const e of t.examples.slice(0, 4)) {
      const li = document.createElement("li");
      li.textContent = `${e.title} — ${e.artist} (${e.year})`;
      ul.appendChild(li);
    }
    s.append(h, note, words, songsTitle, ul);
    if (t.tier !== "core") {
      const c = document.createElement("p");
      c.className = "words";
      c.textContent = "Secondary theme: found by both halves of the models, but less often. Read the trend with caution.";
      s.appendChild(c);
    }
    container.appendChild(s);
  });
}

export function tourChart(el, legendEl, data) {
  const themes = data.themes;
  const years = themes[0].series.map((d) => d[0]);
  let focus = "all";

  function render() {
    const { width, height } = box(el);
    const fi = themes.findIndex((t) => t.id === focus);
    legend(legendEl, fi < 0 ? themes.map((t, i) => ({ label: t.label, color: themeColor(i), kind: "line" }))
      : [{ label: themes[fi].label, color: themeColor(fi), kind: "line" }, { label: "other themes", color: "var(--mark-faint)", kind: "line" }]);
    const m = { top: 12, right: width < 560 ? 12 : 56, bottom: 28, left: 40 };
    const w = width - m.left - m.right, h = height - m.top - m.bottom;
    const x = d3.scaleLinear().domain(d3.extent(years)).range([0, w]);
    const y = d3.scaleLinear().domain([0, 0.5]).range([h, 0]);
    const svg = d3.select(el).selectAll("svg").data([0]).join("svg").attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();
    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);
    g.append("g").call((s) => yGrid(s, y, w, 5));
    g.append("g").attr("transform", `translate(0,${h})`).call((s) => xAxis(s, x, width < 560 ? 4 : 8));
    const line = d3.line().x((d) => x(d[0])).y((d) => y(d[1])).curve(d3.curveMonotoneX);
    const band = d3.area().x((d) => x(d[0])).y0((d) => y(d[2])).y1((d) => y(d[3])).curve(d3.curveMonotoneX);
    const order = themes.map((t, i) => i).sort((a, b) => (a === fi) - (b === fi));     // focus drawn last
    for (const i of order) {
      const t = themes[i];
      const on = fi < 0 || i === fi;
      if (i === fi) g.append("path").datum(t.series).attr("d", band).attr("fill", themeColor(i)).attr("fill-opacity", 0.14);
      const p = g.append("path").datum(t.series).attr("d", line).attr("fill", "none")
        .attr("stroke", on ? themeColor(i) : "var(--mark-faint)").attr("stroke-width", i === fi ? 2.5 : 2)
        .attr("stroke-linejoin", "round").attr("stroke-linecap", "round");
      if (i === fi) {
        const len = p.node().getTotalLength();
        p.attr("stroke-dasharray", len).attr("stroke-dashoffset", len).transition().duration(dur(900)).attr("stroke-dashoffset", 0);
        const last = t.series[t.series.length - 1];
        g.append("circle").attr("cx", x(last[0])).attr("cy", y(last[1])).attr("r", 4.5).attr("fill", themeColor(i))
          .attr("stroke", "var(--surface)").attr("stroke-width", 2);
        if (m.right > 40) g.append("text").attr("class", "annotation annotation--strong").attr("x", x(last[0]) + 8)
          .attr("y", y(last[1])).attr("dy", "0.35em").text(pct(last[1]));
      }
    }
    const cross = g.append("line").attr("y1", 0).attr("y2", h).attr("stroke", "var(--ink-2)").attr("opacity", 0);
    g.append("rect").attr("width", w).attr("height", h).attr("fill", "transparent")
      .on("pointermove", (ev) => {
        const yr = Math.round(x.invert(d3.pointer(ev)[0]));
        const k = years.indexOf(yr);
        if (k < 0) return;
        cross.attr("x1", x(yr)).attr("x2", x(yr)).attr("opacity", 1);
        const list = fi < 0 ? themes.map((t, i) => [t, i]) : [[themes[fi], fi]];
        const rows = list.map(([t, i]) => ({ color: themeColor(i), label: t.label, value: pct(t.series[k][1]) }));
        if (fi >= 0) rows.push({ label: "95% interval", value: `${pct(themes[fi].series[k][2])}–${pct(themes[fi].series[k][3])}` });
        showTip(ev, String(yr), rows);
      })
      .on("pointerleave", () => { cross.attr("opacity", 0); hideTip(); });
  }
  return { render, update(step) { focus = step; render(); } };
}
