// Each theme next to its closest BERTopic group, by decade (same unit, one axis per panel).
import { box, dur, hideTip, legend, pct, showTip, themeColor } from "../ui.js";
const d3 = window.d3;

export function bertopicChart(el, legendEl, data, themes) {
  const pairs = data.pairs;
  const idx = new Map(themes.map((t, i) => [t.id, i]));
  let mode = "all";
  legend(legendEl, [
    { label: "theme (topic models), in its colour", kind: "line",
      color: "linear-gradient(90deg, var(--s1), var(--s2), var(--s3), var(--s4), var(--s5), var(--s6))" },
    { label: "closest BERTopic group", color: "var(--mark-neutral)", kind: "line" }]);

  function render() {
    const { width, height } = box(el);
    const cols = width < 560 ? 2 : 3, rows = Math.ceil(pairs.length / cols);
    const gap = 18, pw = (width - gap * (cols - 1)) / cols, ph = (height - gap * (rows - 1)) / rows;
    const svg = d3.select(el).selectAll("svg").data([0]).join("svg").attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();
    const ymax = d3.max(pairs, (p) => d3.max([...p.lda, ...p.bertopic], (d) => d[1]));
    pairs.forEach((p, k) => {
      const i = idx.get(p.theme);
      const strong = mode === "all" || (mode === "agree" ? p.correlation >= 0.9 : p.correlation < 0.9);
      const ox = (k % cols) * (pw + gap), oy = Math.floor(k / cols) * (ph + gap);
      const m = { top: 34, right: 6, bottom: 20, left: 30 };
      const w = pw - m.left - m.right, h = ph - m.top - m.bottom;
      const panel = svg.append("g").attr("transform", `translate(${ox},${oy})`)
        .attr("opacity", strong ? 1 : 0.25);
      panel.transition().duration(dur(300)).attr("opacity", strong ? 1 : 0.25);
      panel.append("text").attr("class", "annotation annotation--strong").attr("x", m.left).attr("y", 12)
        .text(p.label.length > 26 && pw < 220 ? `${p.label.slice(0, 24)}…` : p.label);
      panel.append("text").attr("class", "annotation").attr("x", m.left).attr("y", 27).text(`correlation ${p.correlation.toFixed(2)}`);
      const g = panel.append("g").attr("transform", `translate(${m.left},${m.top})`);
      const x = d3.scaleLinear().domain([1940, 2020]).range([0, w]);
      const y = d3.scaleLinear().domain([0, ymax]).nice().range([h, 0]);
      const yAxis = d3.axisLeft(y).tickSize(-w).tickFormat(d3.format(".0%"));
      if (h < 120) yAxis.tickValues(y.domain()); else yAxis.ticks(3);
      g.append("g").attr("class", "axis").call(yAxis)
        .call((s) => { s.select(".domain").remove(); s.selectAll(".tick line").attr("stroke", "var(--grid)"); });
      g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`)
        .call(d3.axisBottom(x).tickValues([1940, 1980, 2020]).tickFormat((d) => `${d}s`).tickSizeOuter(0))
        .call((s) => s.select(".domain").attr("stroke", "var(--axis)"));
      const line = d3.line().x((d) => x(d[0])).y((d) => y(d[1])).curve(d3.curveMonotoneX);
      g.append("path").datum(p.bertopic).attr("d", line).attr("fill", "none").attr("stroke", "var(--mark-neutral)").attr("stroke-width", 2);
      g.append("path").datum(p.lda).attr("d", line).attr("fill", "none").attr("stroke", themeColor(i)).attr("stroke-width", 2.5);
      g.append("rect").attr("width", w).attr("height", h).attr("fill", "transparent")
        .on("pointermove", (ev) => {
          const dec = Math.round(x.invert(d3.pointer(ev)[0]) / 10) * 10;
          const a = p.lda.find((d) => d[0] === dec), b = p.bertopic.find((d) => d[0] === dec);
          if (!a || !b) return;
          showTip(ev, `${p.label}, ${dec}s`, [
            { color: themeColor(i), label: "theme", value: pct(a[1]) },
            { color: "var(--mark-neutral)", label: `BERTopic: ${p.bertopic_words.slice(0, 3).join(", ")}`, value: pct(b[1]) }]);
        })
        .on("pointerleave", hideTip);
    });
  }
  return { render, update(step) { mode = step; render(); } };
}
