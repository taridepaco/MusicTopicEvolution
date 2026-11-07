// Loads the data, builds every chart and wires the scroll steps.
import { legend, onRedraw, pct, table, tableToggle, themeColor } from "./ui.js";
import { heroChart } from "./charts/hero.js";
import { coverageChart } from "./charts/coverage.js";
import { explainer } from "./charts/explainer.js";
import { runsChart } from "./charts/runs.js";
import { supportChart } from "./charts/support.js";
import { buildTourSteps, tourChart } from "./charts/tour.js";
import { bertopicChart } from "./charts/bertopic.js";
import { buildDecadeSteps, decadesChart } from "./charts/decades.js";
import { commonChart } from "./charts/common.js";
import { songSearch } from "./charts/search.js";

const load = (name) => fetch(`data/${name}.json`).then((r) => {
  if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
  return r.json();
});

function themeToggle() {
  const btn = document.querySelector(".theme-toggle");
  const root = document.documentElement;
  let stored = null;
  try { stored = localStorage.getItem("ste-theme"); } catch { /* storage unavailable */ }
  if (stored) root.dataset.theme = stored;
  btn.addEventListener("click", () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("ste-theme", root.dataset.theme); } catch { /* ignore */ }
  });
}

const OFFSET = 0.6;

function scrolly(section, chart) {
  const steps = [...section.querySelectorAll(".step")];
  let current = null;
  const activate = (el) => {
    if (el === current) return;
    current = el;
    steps.forEach((s) => s.classList.toggle("is-active", s === el));
    chart.update(el.dataset.step);
  };
  const scroller = window.scrollama();
  scroller.setup({ step: steps, offset: OFFSET }).onStepEnter(({ element }) => activate(element));
  // fallback for fast jumps (flicks, keyboard End, links): the last step whose top is above the
  // trigger line is the active one
  let raf = 0;
  window.addEventListener("scroll", () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const line = window.innerHeight * OFFSET;
      const r = section.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const passed = steps.filter((s) => s.getBoundingClientRect().top <= line);
      activate(passed.length ? passed[passed.length - 1] : steps[0]);
    });
  }, { passive: true });
  activate(steps[0]);
  onRedraw(() => { scroller.resize(); chart.render(); });
  return scroller;
}

async function main() {
  themeToggle();
  const [themes, stability, coverage, bert, decades, common, songs] = await Promise.all(
    ["themes", "stability", "coverage", "bertopic", "decade_words", "common_words", "songs"].map(load));
  const T = themes.themes;

  // hero
  legend(document.getElementById("hero-legend"), T.map((t, i) => ({ label: t.label, color: themeColor(i) })));
  const hero = heroChart(document.getElementById("hero-chart"), themes);
  hero.render();
  onRedraw(() => {
    legend(document.getElementById("hero-legend"), T.map((t, i) => ({ label: t.label, color: themeColor(i) })));
    hero.render();
  });
  tableToggle(document.querySelector('[data-table="hero"]'), document.getElementById("hero-table"), (slot) =>
    table(slot, ["Year", ...T.map((t) => t.label)],
      T[0].series.map((d, k) => [String(d[0]), ...T.map((t) => pct(t.series[k][1], 1))])));

  // scrolly sections
  const sections = Object.fromEntries([...document.querySelectorAll(".scrolly")].map((s) => [s.dataset.chart, s]));
  buildTourSteps(document.getElementById("tour-steps"), T);
  buildDecadeSteps(document.getElementById("decade-steps"), decades.decades);
  scrolly(sections.coverage, coverageChart(document.getElementById("coverage-chart"), coverage));
  scrolly(sections.explainer, explainer(document.getElementById("explainer"), T));
  scrolly(sections.runs, runsChart(document.getElementById("runs-chart"), stability));
  scrolly(sections.support, supportChart(document.getElementById("support-chart"), themes));
  scrolly(sections.tour, tourChart(document.getElementById("tour-chart"), document.getElementById("tour-legend"), themes));
  scrolly(sections.bertopic, bertopicChart(document.getElementById("bertopic-chart"),
    document.getElementById("bertopic-legend"), bert, T));
  scrolly(sections.decades, decadesChart(document.getElementById("decades-chart"), decades));

  // common words
  const cw = commonChart(document.getElementById("common-chart"), common);
  cw.render();
  onRedraw(() => cw.render());
  tableToggle(document.querySelector('[data-table="common"]'), document.getElementById("common-table"), (slot) =>
    table(slot, ["Year", ...common.words], common.series[common.words[0]].map((d, k) =>
      [String(d[0]), ...common.words.map((w) => pct(common.series[w][k][1]))])));

  songSearch(document.getElementById("search"), songs, T);
  document.documentElement.classList.add("is-ready");
}

main().catch((err) => {
  console.error(err);
  const p = document.createElement("p");
  p.className = "prose";
  p.textContent = "The charts could not be loaded. Please reload the page.";
  document.querySelector("main").prepend(p);
});
