// The most distinctive words of each decade (weighted log-odds), one decade per step.
import { box, dur, hideTip, pct, showTip } from "../ui.js";
const d3 = window.d3;

const CAPTIONS = {
  1940: "Violins, sighs and sweethearts: the language of crooners and big bands.",
  1950: "Waltzes, thrills and kisses; dear and lonesome hearts.",
  1960: "The Mashed Potato and the Twist, groovy and gee, and plenty of loneliness.",
  1970: "The Lord, the blues, the gambler, the boogie and the morning after.",
  1980: "Hearts, lovers, passion and romance, often far apart: the power-ballad decade.",
  1990: "Rhymes and flow, funk and brothers, and cuz: hip-hop arrives in the charts.",
  2000: "The club, shorties, chicks and holla: club rap and R&B.",
  2010: "Explicit language goes mainstream, along with money and drinks.",
  2020: "Opps, bros and whiskey: drill-inflected rap meets country.",
};

export function buildDecadeSteps(container, decades) {
  for (const d of Object.keys(decades)) {
    const s = document.createElement("div");
    s.className = "step";
    s.dataset.step = d;
    const h = document.createElement("h3");
    h.textContent = `${d}s`;
    const p = document.createElement("p");
    p.textContent = CAPTIONS[d] || "";
    s.append(h, p);
    container.appendChild(s);
  }
}

export function decadesChart(el, data) {
  const decades = data.decades;
  let current = Object.keys(decades)[0];
  function render() {
    const { width, height } = box(el);
    const words = decades[current];
    const m = { top: 40, right: 80, bottom: 26, left: 92 };
    const w = width - m.left - m.right, h = Math.min(height - m.top - m.bottom, words.length * 40);
    const svg = d3.select(el).selectAll("svg").data([0]).join("svg").attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();
    svg.append("text").attr("class", "annotation annotation--strong").attr("x", m.left).attr("y", 18)
      .text(`${current}s: most distinctive words`);
    svg.append("text").attr("class", "annotation").attr("x", m.left).attr("y", 33)
      .text("bar: how distinctive (z-score) · label: share of the decade's hits that use it");
    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top + 8})`);
    const zmax = d3.max(Object.values(decades).flat(), (d) => d.z);
    const x = d3.scaleLinear().domain([0, zmax]).range([0, w]);
    const y = d3.scaleBand().domain(words.map((d) => d.word)).range([0, h]).padding(0.35);
    const bh = Math.min(24, y.bandwidth());
    const shape = (len) => {
      const r = Math.min(4, bh / 2, len / 2);
      return `M0,0H${len - r}Q${len},0 ${len},${r}V${bh - r}Q${len},${bh} ${len - r},${bh}H0Z`;
    };
    const row = g.selectAll("g").data(words).join("g")
      .attr("transform", (d) => `translate(0,${y(d.word) + (y.bandwidth() - bh) / 2})`);
    row.append("text").attr("x", -10).attr("y", bh / 2).attr("dy", "0.35em").attr("text-anchor", "end")
      .attr("fill", "var(--ink)").style("font-size", "14px").text((d) => d.word);
    row.append("path").attr("fill", "var(--mark-neutral)").attr("d", shape(0))
      .transition().duration(dur(500)).attr("d", (d) => shape(Math.max(1, x(d.z))));
    row.append("text").attr("class", "annotation").attr("x", (d) => x(d.z) + 8).attr("y", bh / 2).attr("dy", "0.35em")
      .text((d) => pct(d.share));
    row.append("rect").attr("x", -m.left).attr("width", w + m.left + m.right).attr("height", bh).attr("fill", "transparent")
      .on("pointermove", (ev, d) => showTip(ev, d.word, [
        { label: `of the ${current}s hits use it`, value: pct(d.share, 1) },
        { label: "distinctiveness (z)", value: d.z.toFixed(1) }]))
      .on("pointerleave", hideTip);
  }
  return { render, update(step) { current = step; render(); } };
}
