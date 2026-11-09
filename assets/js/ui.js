import D from "./data.js";
import {
  page,
  root,
  params,
  state,
  homes,
  currentHome,
  persistent,
  href,
  selectPersona,
  save,
} from "./state.js";
export const esc = (x) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const money = (v) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(v);
export const number = (v) => Math.round(v).toLocaleString("en-GB");
export const date = (v) =>
  new Date(v + "T12:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
export const pill = (r) =>
  `<span class="pill ${r.band[0]}">${r.band[0]} · ${r.band[3]}</span>`;
export const rating = (r) =>
  `<span class="rating-value">${r.value}<span class="rating-denom"> /100</span></span><span class="score-range">Likely ${r.low}–${r.high} · illustrative</span>`;
export const button = (path, text, kind = "primary") =>
  `<a class="button ${kind}" href="${href(path)}">${text}</a>`;
export const kpi = (label, value, note, cls = "") =>
  `<article class="card kpi ${cls}"><div class="kpi-label">${label}</div><div class="metric">${value}</div><small>${note}</small></article>`;
export function intro(label, title, desc, tag = "") {
  return `<div class="pageintro"><div><div class="eyebrow">${label}</div><h1>${title}</h1><p>${desc}</p></div>${tag ? `<span class="tag">${tag}</span>` : ""}</div>`;
}
export function scale(r) {
  return `<div class="score-scale" role="img" aria-label="Score ${r.value}, likely ${r.low} to ${r.high} out of 100"><div class="rangebar">${D.model.scoreBands.map((b) => `<span class="${b[0]}">${b[0]} · ${b[1]}–${b[2]}</span>`).join("")}<i class="likely" style="left:${r.low}%;width:${r.high - r.low}%"></i><i class="marker" style="left:${r.value}%"></i></div></div>`;
}
export function shell() {
  document.documentElement.dataset.theme = state.theme || "light";
  document.body.classList.toggle("presentation", params.get("present") === "1");
  const h = currentHome();
  document.querySelector("#header").innerHTML =
    `<div class="demo-bar"><span class="demo-dot"></span> Demo · All figures are illustrative. Not a property assessment, valuation, insurance quote or financial advice.</div><header class="topbar"><div class="header"><div><a class="wordmark" href="${href("overview")}" aria-label="ARKRA home"><img src="${root}assets/arkra-logo.png" alt="ARKRA" width="615" height="544"></a><div class="brandnote">A BETTER-PREPARED HOME</div></div><nav aria-label="Main navigation">${[
      ["check", "Check"],
      ["home", "My home"],
      ["plan", "Plan"],
      ["passport", "Passport"],
      ["community", "Street"],
      ["lender", "For lenders"],
      ["how-it-works", "How it works"],
    ]
      .map(
        ([p, n]) =>
          `<a href="${href(p)}" ${page === p ? 'class="active" aria-current="page"' : ""}>${n}</a>`,
      )
      .join(
        "",
      )}</nav><button class="theme" aria-label="Toggle light and dark theme">◐</button></div></header><div class="persona-strip"><div class="persona-inner"><span class="persona-context">${h.isDemo === false ? "Your saved profile" : "Explore a fictional household’s journey"}</span><label>Viewing as: <select id="persona" aria-label="Demo persona">${homes()
      .filter((h, i, a) => a.findIndex((x) => x.id === h.id) === i)
      .map(
        (x) =>
          `<option value="${esc(x.id)}" ${x.id === h.id ? "selected" : ""}>${esc(x.household || "Your home")}, ${esc(x.place)}</option>`,
      )
      .join(
        "",
      )}</select></label><a href="${href("about")}">Why ARKRA ↗</a></div></div>${persistent ? "" : '<div class="save-warning" role="status">Your answers won’t be saved on this device. Keep your journey link open to retain this session.</div>'}`;
  document.querySelector("#persona").onchange = (e) =>
    selectPersona(e.target.value);
  document.querySelector(".theme").onclick = () => {
    state.theme =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = state.theme;
    save();
  };
  document.querySelector("#footer").innerHTML =
    `<footer class="footer"><span><strong>ARKRA /</strong><br>ARKRA · TCS Sustainathon 2026 · Lloyds Banking Group Future-Ready Homes challenge · Demo product</span><div><a href="${href("about")}">About ARKRA</a> · <a href="${href("how-it-works")}">Data & methodology</a><br>Your data stays on this device. It is never sold.</div></footer>`;
}
export function toast(message) {
  let el = document.querySelector("#toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    el.setAttribute("role", "status");
    document.body.append(el);
  }
  el.textContent = message;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.remove(), 6000);
}
export function demoForm(title = "Book a survey") {
  return `<form class="demo-form"><h3>${title}</h3><p class="muted">Example (fictional) service. This form demonstrates the next step.</p><div class="grid two"><label class="field">Name<input name="name" autocomplete="name" required maxlength="80"></label><label class="field">Phone<input name="phone" type="tel" autocomplete="tel" required maxlength="30"></label></div><label class="field">Best time to call<select name="time"><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label><button class="primary" type="submit">${title} (demo)</button><p class="form-message" role="status"></p><small>Nothing is sent or stored. Please use fictional details.</small></form>`;
}
export function bindDemoForms(scope = document) {
  scope.querySelectorAll(".demo-form").forEach(
    (form) =>
      (form.onsubmit = (e) => {
        e.preventDefault();
        form.querySelector(".form-message").textContent =
          "Demo: nothing was sent. In the live product, your chosen adviser would contact you.";
        form.reset();
      }),
  );
}
export function sourceBadge(home, id) {
  const corrected = home.overrides?.some((o) => o.hazard === id),
    source = corrected ? "owner" : home.answerSource?.[id] || "assumed";
  return `<span class="source-badge ${source}">${corrected ? "Owner-corrected" : source === "official" ? "Official source" + (home.isDemo ? " (demo)" : "") : source === "owner" ? "Your answer" : "Assumed · wider range"}</span>`;
}
export function barChart(
  rows,
  { max = 100, label = "Physical-risk score · 0–100 · illustrative" } = {},
) {
  const h = rows.length * 48 + 25;
  return `<svg class="svg-chart" viewBox="0 0 580 ${h}" role="img" aria-label="${esc(label)}"><text x="0" y="12" class="chart-caption">${esc(label)}</text>${rows.map((r, i) => `<text x="0" y="${44 + i * 48}" class="chart-label">${esc(r.label)}</text><rect x="155" y="${28 + i * 48}" width="350" height="20" rx="3" fill="var(--paper)"/><rect x="155" y="${28 + i * 48}" width="${max ? (350 * r.value) / max : 0}" height="20" rx="3" fill="${r.colour || "var(--accent)"}"/><text x="520" y="${43 + i * 48}" class="chart-label">${esc(r.text ?? r.value)}</text>`).join("")}</svg>`;
}
export function journey() {
  const names = [
    ["Check", "A few simple answers"],
    ["Understand", "Know what matters"],
    ["Plan", "Practical first steps"],
    ["Pay", "Find a way to fund it"],
    ["Get it done", "Choose qualified help"],
    ["Prove it", "Record the evidence"],
    ["Keep up to date", "Act at the right moment"],
  ];
  return `<div class="journey-scroll"><svg class="journey-svg" viewBox="0 0 1260 100" role="img" aria-label="Check, Understand, Plan, Pay, Get it done, Prove it, Keep up to date">${names
    .map(([name, benefit], i) => {
      const x = i * 180 + 22;
      return `<circle cx="${x}" cy="25" r="15" fill="var(--card)" stroke="var(--line)"/><text x="${x}" y="29" text-anchor="middle" class="journey-number">${i + 1}</text>${i < 6 ? `<path d="M${x + 25} 25H${x + 145}m-7-4 7 4-7 4" stroke="var(--line)" fill="none"/>` : ""}<text x="${x - 15}" y="62" class="journey-name">${name}</text><text x="${x - 15}" y="82" class="journey-benefit">${benefit}</text>`;
    })
    .join("")}</svg></div>`;
}
