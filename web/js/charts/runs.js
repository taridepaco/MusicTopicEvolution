// Two runs of the same model side by side, then stability against the number of topics.
import { box, dur, hideTip, showTip, themeColor, xAxis, yGrid } from "../ui.js";
import { dec, fmt, t } from "../i18n.js";
const d3 = window.d3;

export function runsChart(el, data) {
  const pairs = data.example.pairs;
  // run B listed in its own order (alphabetical by first word), so the pairing has to be drawn
  const bOrder = pairs.map((p, i) => i).sort((i, j) => pairs[i].b[0].localeCompare(pairs[j].b[0]));
  const bRow = new Map(bOrder.map((i, r) => [i, r]));
  let mode = "one";

  function renderRuns(svg, width, height) {
    const narrow = width < 560;
    const m = { top: 34, bottom: 8 };
    const rowH = (height - m.top - m.bottom) / pairs.length;
    const colW = narrow ? width * 0.4 : width * 0.36;
    const xa = 0, xb = width - colW;
    const words = (ws) => ws.slice(0, narrow ? 3 : 5).join(" · ");
    svg.append("text").attr("class", "annotation annotation--strong").attr("x", xa).attr("y", 16).text(t("runs.run", { n: 1, seed: data.example.seeds[0] }));
    if (mode === "two") {
      svg.append("text").attr("class", "annotation annotation--strong").attr("x", xb).attr("y", 16).text(t("runs.run", { n: 2, seed: data.example.seeds[1] }));
    }
    const ya = (i) => m.top + rowH * (i + 0.5);
    const a = svg.append("g");
    a.selectAll("text").data(pairs).join("text").attr("x", xa).attr("y", (d, i) => ya(i)).attr("dy", "0.35em")
      .attr("fill", "var(--ink)").style("font-size", narrow ? "11px" : "13px").text((d) => words(d.a));
    if (mode !== "two") return;
    const links = svg.append("g");
    const sim = d3.scaleLinear().domain([0.2, 0.8]).range([0.25, 1]).clamp(true);
    links.selectAll("path").data(pairs).join("path")
      .attr("d", (d, i) => {
        const x0 = xa + colW + 6, x1 = xb - 8, y0 = ya(i), y1 = ya(bRow.get(i));
        return `M${x0},${y0}C${(x0 + x1) / 2},${y0} ${(x0 + x1) / 2},${y1} ${x1},${y1}`;
      })
      .attr("fill", "none").attr("stroke", (d) => (d.similarity >= 0.6 ? themeColor(0) : "var(--ink-2)"))
      .attr("stroke-width", (d) => (d.similarity >= 0.6 ? 2.5 : 1.2)).attr("stroke-opacity", (d) => sim(d.similarity))
      .attr("stroke-dasharray", function () { return this.getTotalLength(); })
      .attr("stroke-dashoffset", function () { return this.getTotalLength(); })
      .transition().duration(dur(900)).attr("stroke-dashoffset", 0);
    links.selectAll("text").data(pairs).join("text").attr("class", "annotation")
      .attr("x", xa + colW + 10).attr("y", (d, i) => ya(i) - 7)
      .style("font-weight", (d) => (d.similarity >= 0.6 ? 700 : 400))
      .text((d) => dec(d.similarity, 2));
    svg.append("g").selectAll("text").data(bOrder).join("text").attr("x", xb).attr("y", (i, r) => ya(r))
      .attr("dy", "0.35em").attr("fill", "var(--ink)").style("font-size", narrow ? "11px" : "13px")
      .text((i) => words(pairs[i].b));
  }

  function renderGrid(svg, width, height) {
    const grid = data.grid;
    const robust = new Map(data.robust.map((r) => [r.k, r.robust_topics]));
    const m = { top: 40, right: 16, bottom: 84, left: 44 };
    const w = width - m.left - m.right, h = height - m.top - m.bottom;
    svg.append("text").attr("class", "annotation annotation--strong").attr("x", m.left).attr("y", 18)
      .text(t("runs.grid.title"));
    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);
    const x = d3.scaleLinear().domain([4, 25]).range([0, w]);
    const y = d3.scaleLinear().domain([0, 1]).range([h, 0]);
    g.append("g").call((s) => yGrid(s, y, w, 5, fmt(".1f")));
    g.append("g").attr("transform", `translate(0,${h})`).call((s) => xAxis(s, x, 6));
    g.append("text").attr("class", "annotation").attr("x", w).attr("y", h + 32).attr("text-anchor", "end").text(t("runs.axis.k"));
    const line = d3.line().x((d) => x(d.k)).y((d) => y(d.stability));
    const path = g.append("path").datum(grid).attr("fill", "none").attr("stroke", "var(--mark-neutral)")
      .attr("stroke-width", 2).attr("d", line);
    const len = path.node().getTotalLength();
    path.attr("stroke-dasharray", len).attr("stroke-dashoffset", len).transition().duration(dur(900)).attr("stroke-dashoffset", 0);
    g.selectAll("circle").data(grid).join("circle").attr("cx", (d) => x(d.k)).attr("cy", (d) => y(d.stability))
      .attr("r", 4.5).attr("fill", "var(--mark-neutral)").attr("stroke", "var(--surface)").attr("stroke-width", 2);
    g.append("text").attr("class", "annotation").attr("x", 0).attr("y", h + 54).text(t("runs.robust"));
    g.selectAll("text.rob").data(grid).join("text").attr("class", "annotation annotation--strong rob")
      .attr("x", (d) => x(d.k)).attr("y", h + 74).attr("text-anchor", "middle").attr("dx", 0)
      .text((d) => (width < 560 && d.k % 2 ? "" : robust.get(d.k)));
    g.selectAll("rect.hit").data(grid).join("rect").attr("class", "hit")
      .attr("x", (d) => x(d.k) - 12).attr("y", 0).attr("width", 24).attr("height", h).attr("fill", "transparent")
      .on("pointermove", (ev, d) => showTip(ev, t("runs.tip.title", { k: d.k }), [
        { label: t("runs.tip.stability"), value: dec(d.stability, 2) },
        { label: t("runs.tip.npmi"), value: dec(d.npmi, 2) },
        { label: t("runs.tip.robust"), value: String(robust.get(d.k)) }]))
      .on("pointerleave", hideTip);
  }

  function render() {
    const { width, height } = box(el);
    const svg = d3.select(el).selectAll("svg").data([0]).join("svg").attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();
    if (mode === "grid") renderGrid(svg, width, height); else renderRuns(svg, width, height);
  }
  return { render, update(step) { mode = step; render(); } };
}
