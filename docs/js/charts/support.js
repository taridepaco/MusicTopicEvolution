// How often each theme appears among the 100 models, and in each independent half.
import { box, dur, hideTip, pct, showTip, themeColor } from "../ui.js";
const d3 = window.d3;

export function supportChart(el, data) {
  const themes = data.themes;
  let mode = "all";
  function render() {
    const { width, height } = box(el);
    const narrow = width < 560;
    const m = { top: 46, right: narrow ? 12 : 90, bottom: 30, left: narrow ? 118 : 210 };
    const w = width - m.left - m.right, h = Math.min(height - m.top - m.bottom, themes.length * 70);
    const svg = d3.select(el).selectAll("svg").data([0]).join("svg").attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();
    svg.append("text").attr("class", "annotation annotation--strong").attr("x", m.left).attr("y", 18)
      .text(mode === "all" ? "Share of the 100 models where the theme appears" : "…and in each half of the models");
    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);
    const x = d3.scaleLinear().domain([0, 1]).range([0, w]);
    const y = d3.scaleBand().domain(themes.map((t) => t.id)).range([0, h]).padding(0.45);
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".0%")).tickSize(-h))
      .call((s) => { s.select(".domain").remove(); s.selectAll(".tick line").attr("stroke", "var(--grid)"); });
    // thresholds
    const rules = mode === "all" ? [[0.3, "minimum 30%"]] : [[0.3, "30%"], [0.5, "core: 50% in both halves"]];
    for (const [v, lab] of rules) {
      g.append("line").attr("x1", x(v)).attr("x2", x(v)).attr("y1", -6).attr("y2", h).attr("stroke", "var(--ink-2)").attr("stroke-width", 1);
      g.append("text").attr("class", "annotation").attr("x", x(v) + 4).attr("y", -8).text(lab);
    }
    const row = g.selectAll("g.row").data(themes).join("g").attr("class", "row")
      .attr("transform", (d) => `translate(0,${y(d.id) + y.bandwidth() / 2})`);
    row.append("text").attr("x", -12).attr("dy", "0.35em").attr("text-anchor", "end").attr("fill", "var(--ink)")
      .style("font-size", narrow ? "11px" : "13px").text((d) => d.label);
    row.append("line").attr("x1", 0).attr("x2", 0).attr("stroke", (d, i) => themeColor(i)).attr("stroke-width", 2)
      .transition().duration(dur()).attr("x2", (d) => x(mode === "all" ? d.support : Math.max(d.support_half1, d.support_half2)));
    if (mode === "all") {
      row.append("circle").attr("r", 6).attr("cx", 0).attr("fill", (d, i) => themeColor(i))
        .attr("stroke", "var(--surface)").attr("stroke-width", 2)
        .transition().duration(dur()).attr("cx", (d) => x(d.support));
      row.append("text").attr("class", "annotation").attr("x", (d) => x(d.support) + 12).attr("dy", "0.35em").text((d) => pct(d.support));
    } else {
      for (const key of ["support_half1", "support_half2"]) {
        row.append("circle").attr("r", 5).attr("cx", (d) => x(d.support)).attr("fill", "var(--surface)")
          .attr("stroke", (d, i) => themeColor(i)).attr("stroke-width", 2.5)
          .transition().duration(dur()).attr("cx", (d) => x(d[key]));
      }
      if (!narrow) {
        row.append("text").attr("class", "tier-label annotation annotation--strong").attr("x", w + 10).attr("dy", "0.35em")
          .text((d) => d.tier);
      }
    }
    row.append("rect").attr("x", -m.left).attr("y", -y.bandwidth()).attr("width", w + m.left).attr("height", y.bandwidth() * 2)
      .attr("fill", "transparent")
      .on("pointermove", (ev, d) => showTip(ev, d.label, [
        { label: "of all 100 models", value: pct(d.support) },
        { label: "of the first half", value: pct(d.support_half1) },
        { label: "of the second half", value: pct(d.support_half2) },
        { label: "tier", value: d.tier }]))
      .on("pointerleave", hideTip);
  }
  return { render, update(step) { mode = step; render(); } };
}
