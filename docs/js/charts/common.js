// Small multiples: share of each year's hits that use a very common word.
import { hideTip, pct, showTip } from "../ui.js";
const d3 = window.d3;

export function commonChart(el, data) {
  function render() {
    el.replaceChildren();
    for (const word of data.words) {
      const s = data.series[word];
      const panel = document.createElement("div");
      const title = document.createElement("p");
      title.className = "sm-panel__title";
      title.textContent = word;
      const first = d3.mean(s.filter((d) => d[0] < 1960), (d) => d[1]);
      const last = d3.mean(s.filter((d) => d[0] >= 2016), (d) => d[1]);
      const sub = document.createElement("p");
      sub.className = "sm-panel__sub";
      sub.textContent = `${pct(first)} of hits (1946–59) → ${pct(last)} (2016–25)`;
      const box = document.createElement("div");
      box.className = "sm-panel";
      panel.append(title, sub, box);
      el.appendChild(panel);
      const width = box.getBoundingClientRect().width || 260, height = 180;
      const m = { top: 8, right: 8, bottom: 22, left: 34 };
      const w = width - m.left - m.right, h = height - m.top - m.bottom;
      const x = d3.scaleLinear().domain(d3.extent(s, (d) => d[0])).range([0, w]);
      const y = d3.scaleLinear().domain([0, 1]).range([h, 0]);
      const svg = d3.select(box).append("svg").attr("viewBox", `0 0 ${width} ${height}`);
      const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);
      g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(2).tickSize(-w).tickFormat(d3.format(".0%")))
        .call((a) => { a.select(".domain").remove(); a.selectAll(".tick line").attr("stroke", "var(--grid)"); });
      g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`)
        .call(d3.axisBottom(x).tickValues([1950, 1980, 2010]).tickFormat(d3.format("d")).tickSizeOuter(0))
        .call((a) => a.select(".domain").attr("stroke", "var(--axis)"));
      g.append("path").datum(s).attr("fill", "var(--mark-neutral)").attr("fill-opacity", 0.12)
        .attr("d", d3.area().x((d) => x(d[0])).y0((d) => y(d[2])).y1((d) => y(d[3])).curve(d3.curveMonotoneX));
      g.append("path").datum(s).attr("fill", "none").attr("stroke", "var(--mark-neutral)").attr("stroke-width", 2)
        .attr("d", d3.line().x((d) => x(d[0])).y((d) => y(d[1])).curve(d3.curveMonotoneX));
      const cross = g.append("line").attr("y1", 0).attr("y2", h).attr("stroke", "var(--ink-2)").attr("opacity", 0);
      g.append("rect").attr("width", w).attr("height", h).attr("fill", "transparent")
        .on("pointermove", (ev) => {
          const yr = Math.round(x.invert(d3.pointer(ev)[0]));
          const d = s.find((r) => r[0] === yr);
          if (!d) return;
          cross.attr("x1", x(yr)).attr("x2", x(yr)).attr("opacity", 1);
          showTip(ev, `${word}, ${yr}`, [{ label: "of the year's hits", value: pct(d[1]) },
            { label: "95% interval", value: `${pct(d[2])}–${pct(d[3])}` }]);
        })
        .on("pointerleave", () => { cross.attr("opacity", 0); hideTip(); });
    }
  }
  return { render };
}
