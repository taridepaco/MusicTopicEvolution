// The most distinctive words of each decade (weighted log-odds), one decade per step.
import { box, dur, hideTip, pct, showTip } from "../ui.js";
import { cap, dec, decade, onLang, t } from "../i18n.js";
const d3 = window.d3;

// one step per decade, rewritten in place when the language changes
export function buildDecadeSteps(container, decades) {
  const fills = [];
  for (const d of Object.keys(decades)) {
    const s = document.createElement("div");
    s.className = "step";
    s.dataset.step = d;
    const h = document.createElement("h3");
    const p = document.createElement("p");
    s.append(h, p);
    container.appendChild(s);
    fills.push(() => { h.textContent = cap(decade(d)); p.textContent = t(`dec.caption.${d}`); });
  }
  const fill = () => fills.forEach((f) => f());
  fill();
  onLang(fill);
}

export function decadesChart(el, data) {
  const decades = data.decades;
  let current = Object.keys(decades)[0];
  function render() {
    const { width, height } = box(el);
    const words = decades[current];
    // the key ("bar: … · label: …") takes two lines on narrow screens
    const sub = width < 560 ? t("dec.sub").split(" · ") : [t("dec.sub")];
    const m = { top: 25 + 15 * sub.length, right: 80, bottom: 26, left: 92 };
    const w = width - m.left - m.right, h = Math.min(height - m.top - m.bottom, words.length * 40);
    const svg = d3.select(el).selectAll("svg").data([0]).join("svg").attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();
    const tx = sub.length > 1 ? 0 : m.left;
    svg.append("text").attr("class", "annotation annotation--strong").attr("x", tx).attr("y", 18)
      .text(t("dec.title", { decade: cap(decade(current)) }));
    sub.forEach((line, k) => svg.append("text").attr("class", "annotation").attr("x", tx).attr("y", 33 + 15 * k).text(line));
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
        { label: t("dec.tip.share", { decade: decade(current) }), value: pct(d.share, 1) },
        { label: t("dec.tip.z"), value: dec(d.z, 1) }]))
      .on("pointerleave", hideTip);
  }
  return { render, update(step) { current = step; render(); } };
}
