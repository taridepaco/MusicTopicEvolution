// Stacked area of the six themes by year, with crosshair tooltip and direct labels.
import { box, dur, hideTip, pct, showTip, themeColor, xAxis, yGrid } from "../ui.js";
import { themeLabel } from "../i18n.js";
const d3 = window.d3;

export function heroChart(el, data) {
  const themes = data.themes;
  const years = themes[0].series.map((d) => d[0]);
  const rows = years.map((y, i) => {
    const r = { year: y };
    themes.forEach((th) => { r[th.id] = th.series[i][1]; });
    return r;
  });
  const keys = themes.map((th) => th.id);
  const stack = d3.stack().keys(keys)(rows);
  let drawn = false;

  function render() {
    const { width, height } = box(el);
    const m = { top: 8, right: width < 600 ? 12 : 150, bottom: 28, left: 40 };
    const w = width - m.left - m.right, h = height - m.top - m.bottom;
    const x = d3.scaleLinear().domain(d3.extent(years)).range([0, w]);
    const top = d3.max(stack[stack.length - 1], (d) => d[1]);
    const y = d3.scaleLinear().domain([0, Math.ceil(top * 10) / 10]).range([h, 0]);

    const svg = d3.select(el).selectAll("svg").data([0]).join("svg")
      .attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();
    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);
    g.append("g").call((s) => yGrid(s, y, w, 5));
    g.append("g").attr("transform", `translate(0,${h})`).call((s) => xAxis(s, x, width < 600 ? 4 : 8));

    const area = d3.area().x((d) => x(d.data.year)).y0((d) => y(d[0])).y1((d) => y(d[1])).curve(d3.curveMonotoneX);
    const edge = d3.line().x((d) => x(d.data.year)).y((d) => y(d[1])).curve(d3.curveMonotoneX);
    const clipId = `hero-clip-${Math.random().toString(36).slice(2)}`;
    const clip = svg.append("clipPath").attr("id", clipId).append("rect")
      .attr("x", m.left).attr("y", 0).attr("height", height).attr("width", drawn ? w : 0);
    const layers = svg.append("g").attr("clip-path", `url(#${clipId})`)
      .append("g").attr("transform", `translate(${m.left},${m.top})`);
    layers.selectAll("path.area").data(stack).join("path").attr("class", "area")
      .attr("d", area).attr("fill", (d, i) => themeColor(i)).attr("fill-opacity", 0.3);
    layers.selectAll("path.edge").data(stack).join("path").attr("class", "edge")
      .attr("d", edge).attr("fill", "none").attr("stroke", (d, i) => themeColor(i)).attr("stroke-width", 2)
      .attr("stroke-linejoin", "round");
    if (!drawn) { clip.transition().duration(dur(1400)).ease(d3.easeCubicOut).attr("width", w); drawn = true; }

    // direct labels at the right edge (text in ink, identity from the coloured mark beside it)
    if (m.right > 100) {
      const last = stack.map((s, i) => ({ i, y: y((s[s.length - 1][0] + s[s.length - 1][1]) / 2) }))
        .sort((a, b) => a.y - b.y);
      for (let k = 1; k < last.length; k++) last[k].y = Math.max(last[k].y, last[k - 1].y + 16);   // no overlap
      const lab = g.append("g").attr("transform", `translate(${w + 10},0)`);
      lab.selectAll("g").data(last).join("g").attr("transform", (d) => `translate(0,${d.y})`)
        .call((s) => {
          s.append("rect").attr("width", 10).attr("height", 10).attr("y", -5).attr("rx", 2)
            .attr("fill", (d) => themeColor(d.i));
          s.append("text").attr("x", 15).attr("dy", "0.35em").text((d) => themeLabel(themes[d.i]));
        });
    }

    // crosshair + tooltip listing every theme at that year
    const cross = g.append("line").attr("y1", 0).attr("y2", h).attr("stroke", "var(--ink-2)")
      .attr("stroke-width", 1).attr("opacity", 0);
    g.append("rect").attr("width", w).attr("height", h).attr("fill", "transparent")
      .on("pointermove", (ev) => {
        const [px] = d3.pointer(ev);
        const yr = Math.round(x.invert(px));
        const r = rows.find((d) => d.year === yr);
        if (!r) return;
        cross.attr("x1", x(yr)).attr("x2", x(yr)).attr("opacity", 1);
        showTip(ev, String(yr), themes.map((th, i) => ({ color: themeColor(i), label: themeLabel(th), value: pct(r[th.id]) })).reverse());
      })
      .on("pointerleave", () => { cross.attr("opacity", 0); hideTip(); });
  }
  return { render };
}
