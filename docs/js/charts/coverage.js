// The songs: entries per decade, then instrumentals and other-language lyrics per decade.
import { box, dur, hideTip, pct, showTip, yGrid } from "../ui.js";
const d3 = window.d3;

export function coverageChart(el, data) {
  const rows = data.decades;
  let mode = "entries";

  function columns(g, x, y, h, value, fmt, highlight) {
    const bw = Math.min(24, x.bandwidth());
    const bars = g.selectAll("path.col").data(rows, (d) => d.decade).join("path").attr("class", "col")
      .attr("fill", (d) => (highlight && !highlight(d) ? "var(--mark-faint)" : "var(--mark-neutral)"));
    const shape = (d, v) => {
      const x0 = x(d.decade) + (x.bandwidth() - bw) / 2, y0 = y(v), r = Math.min(4, (h - y0) / 2);
      return `M${x0},${h}V${y0 + r}Q${x0},${y0} ${x0 + r},${y0}H${x0 + bw - r}Q${x0 + bw},${y0} ${x0 + bw},${y0 + r}V${h}Z`;
    };
    bars.attr("d", (d) => shape(d, 0)).transition().duration(dur()).attr("d", (d) => shape(d, value(d)));
    g.selectAll("text.val").data(rows.filter((d) => value(d) > 0)).join("text").attr("class", "annotation val")
      .attr("x", (d) => x(d.decade) + x.bandwidth() / 2).attr("y", (d) => y(value(d)) - 6)
      .attr("text-anchor", "middle").text((d) => fmt(value(d)));
    g.append("rect").attr("width", x.range()[1]).attr("height", h).attr("fill", "transparent")
      .on("pointermove", (ev) => {
        const [px] = d3.pointer(ev);
        const d = rows[Math.max(0, Math.min(rows.length - 1, Math.floor(px / x.step())))];
        showTip(ev, `${d.decade}s`, [
          { label: "chart entries", value: d3.format(",")(d.entries) },
          { label: "English lyrics", value: pct(d.english, 1) },
          { label: "other language", value: pct(d.other_language, 1) },
          { label: "instrumental", value: pct(d.instrumental, 1) },
          { label: "no lyrics available", value: pct(d.unavailable, 1) }]);
      })
      .on("pointerleave", hideTip);
  }

  function render() {
    const { width, height } = box(el);
    const svg = d3.select(el).selectAll("svg").data([0]).join("svg").attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();
    const label = (d) => `${String(d).slice(2)}s`;
    if (mode !== "shares") {
      const m = { top: 40, right: 10, bottom: 28, left: 44 };
      const w = width - m.left - m.right, h = height - m.top - m.bottom;
      const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);
      const x = d3.scaleBand().domain(rows.map((d) => d.decade)).range([0, w]).padding(0.3);
      const y = d3.scaleLinear().domain([0, 1100]).range([h, 0]);
      g.append("g").call((s) => yGrid(s, y, w, 4, d3.format(",")));
      g.append("g").attr("transform", `translate(0,${h})`).attr("class", "axis")
        .call(d3.axisBottom(x).tickFormat(label).tickSizeOuter(0)).call((s) => s.select(".domain").attr("stroke", "var(--axis)"));
      svg.append("text").attr("class", "annotation annotation--strong").attr("x", m.left).attr("y", 18)
        .text(mode === "entries" ? "Year-end hits per decade" : "Hits with lyrics found, per decade");
      const value = mode === "entries" ? (d) => d.entries
        : (d) => Math.round(d.entries * (d.english + d.other_language));
      columns(g, x, y, h, value, d3.format(","), null);
      return;
    }
    // two small multiples, one measure each (never two scales on one plot)
    const panels = [["instrumental", "Instrumentals"], ["other_language", "Lyrics in another language"]];
    const stacked = width < 560;
    const pw = stacked ? width : (width - 24) / 2, ph = stacked ? (height - 10) / 2 : height;
    panels.forEach(([key, title], i) => {
      const ox = stacked ? 0 : i * (pw + 24), oy = stacked ? i * (ph + 10) : 0;
      const m = { top: 40, right: 8, bottom: 26, left: 38 };
      const w = pw - m.left - m.right, h = ph - m.top - m.bottom;
      const p = svg.append("g").attr("transform", `translate(${ox},${oy})`);
      p.append("text").attr("class", "annotation annotation--strong").attr("x", m.left).attr("y", 18).text(`${title} (share of hits)`);
      const g = p.append("g").attr("transform", `translate(${m.left},${m.top})`);
      const x = d3.scaleBand().domain(rows.map((d) => d.decade)).range([0, w]).padding(0.3);
      const y = d3.scaleLinear().domain([0, 0.1]).range([h, 0]);
      g.append("g").call((s) => yGrid(s, y, w, 2, (v) => `${Math.round(v * 100)}%`));
      g.append("g").attr("transform", `translate(0,${h})`).attr("class", "axis")
        .call(d3.axisBottom(x).tickFormat(label).tickSizeOuter(0)).call((s) => s.select(".domain").attr("stroke", "var(--axis)"));
      columns(g, x, y, h, (d) => d[key], (v) => (v >= 0.005 ? pct(v, 0) : ""), null);
    });
  }

  return {
    render,
    update(step) { mode = step; render(); },
  };
}
