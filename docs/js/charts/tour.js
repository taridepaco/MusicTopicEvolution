// Theme by theme: the focused theme with its confidence band, the others as faint context.
import { box, dur, hideTip, legend, pct, showTip, themeColor, xAxis, yGrid } from "../ui.js";
import { onLang, t, themeLabel } from "../i18n.js";
const d3 = window.d3;

// one step per theme; the text is rewritten in place when the language changes (scrollama keeps
// references to the step elements, so they are never rebuilt)
export function buildTourSteps(container, themes) {
  const intro = document.createElement("div");
  intro.className = "step";
  intro.dataset.step = "all";
  const p = document.createElement("p");
  intro.appendChild(p);
  container.appendChild(intro);
  const fills = [() => { p.textContent = t("tour.intro"); }];
  themes.forEach((th, i) => {
    const s = document.createElement("div");
    s.className = "step";
    s.dataset.step = th.id;
    const h = document.createElement("h3");
    const key = document.createElement("span");
    key.className = "theme-key";
    key.style.background = themeColor(i);
    const name = document.createTextNode("");
    const tier = document.createElement("span");
    tier.className = "tier";
    h.append(key, name, tier);
    const note = document.createElement("p");
    const words = document.createElement("p");
    words.className = "words";
    const songsTitle = document.createElement("p");
    songsTitle.className = "words";
    const ul = document.createElement("ul");
    ul.className = "songs";
    for (const e of th.examples.slice(0, 4)) {
      const li = document.createElement("li");
      li.textContent = `${e.title} — ${e.artist} (${e.year})`;      // titles stay as they are
      ul.appendChild(li);
    }
    s.append(h, note, words, songsTitle, ul);
    const caution = th.tier !== "core" ? document.createElement("p") : null;
    if (caution) { caution.className = "words"; s.appendChild(caution); }
    container.appendChild(s);
    fills.push(() => {
      name.textContent = themeLabel(th);
      tier.textContent = t(`tier.${th.tier}`);
      note.textContent = t(`tour.note.${th.label}`);
      words.textContent = t("tour.words", { words: th.words.slice(0, 10).join(", ") });
      songsTitle.textContent = t("tour.songs");
      if (caution) caution.textContent = t("tour.secondary");
    });
  });
  const fill = () => fills.forEach((f) => f());
  fill();
  onLang(fill);
}

export function tourChart(el, legendEl, data) {
  const themes = data.themes;
  const years = themes[0].series.map((d) => d[0]);
  let focus = "all";

  function render() {
    const { width, height } = box(el);
    const fi = themes.findIndex((th) => th.id === focus);
    legend(legendEl, fi < 0 ? themes.map((th, i) => ({ label: themeLabel(th), color: themeColor(i), kind: "line" }))
      : [{ label: themeLabel(themes[fi]), color: themeColor(fi), kind: "line" },
        { label: t("tour.others"), color: "var(--mark-faint)", kind: "line" }]);
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
    const order = themes.map((th, i) => i).sort((a, b) => (a === fi) - (b === fi));     // focus drawn last
    for (const i of order) {
      const th = themes[i];
      const on = fi < 0 || i === fi;
      if (i === fi) g.append("path").datum(th.series).attr("d", band).attr("fill", themeColor(i)).attr("fill-opacity", 0.14);
      const p = g.append("path").datum(th.series).attr("d", line).attr("fill", "none")
        .attr("stroke", on ? themeColor(i) : "var(--mark-faint)").attr("stroke-width", i === fi ? 2.5 : 2)
        .attr("stroke-linejoin", "round").attr("stroke-linecap", "round");
      if (i === fi) {
        const len = p.node().getTotalLength();
        p.attr("stroke-dasharray", len).attr("stroke-dashoffset", len).transition().duration(dur(900)).attr("stroke-dashoffset", 0);
        const last = th.series[th.series.length - 1];
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
        const list = fi < 0 ? themes.map((th, i) => [th, i]) : [[themes[fi], fi]];
        const rows = list.map(([th, i]) => ({ color: themeColor(i), label: themeLabel(th), value: pct(th.series[k][1]) }));
        if (fi >= 0) rows.push({ label: t("tip.ci"), value: `${pct(themes[fi].series[k][2])}–${pct(themes[fi].series[k][3])}` });
        showTip(ev, String(yr), rows);
      })
      .on("pointerleave", () => { cross.attr("opacity", 0); hideTip(); });
  }
  return { render, update(step) { focus = step; render(); } };
}
