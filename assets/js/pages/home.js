import D from "../data.js";
import { score, explain, ead, epc, bestPlan, funding } from "../engine.js";
import {
  currentHome,
  updateHome,
  href,
  params,
  passport,
  save,
} from "../state.js";
import {
  passportScores,
  momentMatches,
  homeWithVerified,
} from "../product-model.js";
import {
  esc,
  money,
  pill,
  rating,
  kpi,
  intro,
  scale,
  sourceBadge,
  button,
  date,
  toast,
  shell,
} from "../ui.js";
export function dashboard(main) {
  const original = currentHome(),
    h = homeWithVerified(original, passport().entries),
    scenario = D.scenarios.some((s) => s.id === params.get("scenario"))
      ? params.get("scenario")
      : "today";
  let chosen = scenario;
  const draw = () => {
    const result = score(h, chosen),
      energy = epc(h),
      damage = ead(h),
      futureDamage = ead(h, "high"),
      plan = bestPlan(h),
      next = D.measures.find((m) => m.id === plan[0]),
      official = score(h, chosen, h.flags, { official: true });
    main.innerHTML =
      intro(
        "Your home, looking ahead",
        `A clearer picture for ${esc(h.household || "your household")}.`,
        `${esc(h.title)} · ${esc(h.place)}${h.isDemo ? " · Fictional household" : h.isReal ? " · Real example" : " · Your answers; not an assessed property"}`,
        h.isDemo ? "DEMO HOME" : "YOUR HOME PROFILE",
      ) +
      `${h.notes ? `<div class="callout section">${esc(h.notes)}</div>` : ""}${params.get("checked") === "1" ? '<div class="callout section" role="status">Your profile is ready and saved for this journey. Demo: nothing was sent.</div>' : ""}<div class="dashboard-layout grid"><div><section class="card outlook"><div class="sectiontitle"><div><div class="eyebrow">PHYSICAL CLIMATE RISK</div><h2>Your home’s climate outlook</h2></div><div class="segmented">${D.scenarios.map((s) => `<button data-scenario="${s.id}" class="${s.id === chosen ? "selected" : ""}" aria-pressed="${s.id === chosen}">${s.name}</button>`).join("")}</div></div><div class="outlook-score"><div>${rating(result)}</div><div>${pill(result)}<p class="muted">${esc(h.story)}</p></div></div>${scale(result)}<div class="callout">${esc(explain(result)[0])} A severe hazard carries more weight, so it cannot disappear into an average.</div><div class="confidence-line"><span class="source-badge">Based on ${result.confidence} of 5 official sources${h.isDemo ? " · demo labels" : ""}</span><a href="${href("check")}">Fill the gaps ↗</a></div><div class="grid three trajectory">${D.scenarios
        .map((s) => {
          const r = score(h, s.id);
          return `<article class="card"><small>${s.name}</small><div class="trajectory-score">${r.value}<small> · likely ${r.low}–${r.high}</small></div>${pill(r)}</article>`;
        })
        .join(
          "",
        )}</div><small class="range-note">Ranges show sensitivity to uncertain inputs, not statistical confidence. Assumed answers use wider bounds.</small>${h.overrides?.length ? `<div class="callout section">Owner-corrected: ${result.value} · likely ${result.low}–${result.high}. Original area bands: ${official.value} · likely ${official.low}–${official.high}. Owner corrections are unverified.</div>` : ""}<div class="actions section noprint">${button("plan", "Build your plan →")}<button id="print">Print home report</button></div></section><section class="card section hazard-section"><div class="sectiontitle"><h2>What drives your score?</h2><small>Area conditions → your home</small></div>${result.rows
        .map(
          (row) =>
            `<article class="hazard"><div class="hazardtitle"><strong>${row.name}</strong>${sourceBadge(h, row.id)}</div><div class="hazard-meta"><span>Area band: <strong>${row.code}</strong></span><span>Weight ${row.value.toFixed(2)}</span></div><svg class="hazard-svg" viewBox="0 0 600 49" role="img" aria-label="Area value ${row.area.toFixed(2)}, this home ${row.r.toFixed(2)}, on a 0–1 scale"><text x="0" y="15">Area</text><rect x="75" y="5" width="460" height="8" rx="3" fill="var(--paper)"/><rect x="75" y="5" width="${row.area * 460}" height="8" rx="3" fill="#a6b8c1"/><text x="550" y="15">${row.area.toFixed(2)}</text><text x="0" y="39">Your home</text><rect x="75" y="29" width="460" height="8" rx="3" fill="var(--paper)"/><rect x="75" y="29" width="${row.r * 460}" height="8" rx="3" fill="var(--accent)"/><text x="550" y="39">${row.r.toFixed(2)}</text></svg><div>${row.applied.map((f) => `<span class="factor ${f.value > 1 ? "up" : ""}">${esc(f.id.replace(/([A-Z])/g, " $1"))} ×${f.value}</span>`).join("") || "<small>No additional building factors</small>"}</div>${row.id === "subsidence" && chosen !== "today" && ["C", "D", "E"].includes(row.code) ? `<p class="drought-note">Hotter, drier summers increase ground movement on clay soils.</p>` : ""}<details><summary>Think something’s wrong?</summary><form class="correction-form" data-hazard="${row.id}"><label class="field">Corrected area band<select name="band">${Object.keys(
              D.bands.find((b) => b.id === row.id).values,
            )
              .map(
                (b) =>
                  `<option ${b === row.code ? "selected" : ""}>${b}</option>`,
              )
              .join(
                "",
              )}</select></label><label class="field">Reason<select name="reason"><option>Flood defences built since the map</option><option>Floor higher than assumed</option><option>Survey says ground stable</option><option>Other evidence or local knowledge</option></select></label><label class="field">Your note<textarea name="note" maxlength="500">${esc(h.overrides?.find((o) => o.hazard === row.id)?.note || "")}</textarea></label><div class="actions"><button type="submit">Save correction</button><button type="button" data-restore="${row.id}">Restore original band</button></div><small>Stored on this device. Demo: nothing is sent.</small></form></details></article>`,
        )
        .join(
          "",
        )}</section><section class="card section print-secondary"><h2>Money at risk</h2><p class="muted">Expected annual damage is a modelled long-run average, not a yearly bill or insurance premium.</p><div class="grid two">${kpi("Today", money(damage.value), "Illustrative expected annual damage")}${kpi("2050 high emissions", money(futureDamage.value), "Illustrative expected annual damage")}</div><p class="section">${damage.coastalYears ? `Projected inside the erosion zone in about ${damage.coastalYears} years. ${damage.coastalYears <= D.ead.mortgageYears ? "Within" : "Beyond"} a ${D.ead.mortgageYears}-year mortgage term. No £ erosion loss is modelled.` : "No coastal erosion zone in these inputs."}</p><p>Overheating exposure: <strong>${damage.heat}</strong>. Heat can affect health, especially for older or vulnerable occupants. It carries no £ damage in this model.</p><h3>Insurance & value signals</h3><p>Homes at long-term flood risk can sell for less. ARKRA does not estimate a valuation change or a premium.</p>${h.builtAfter2009 && ["riverSea", "surfaceWater"].some((id) => ["medium", "high"].includes(h.hazards[id])) ? '<div class="callout">Homes built from 1 January 2009 are not covered by Flood Re, so flood insurance may be harder to find. Check with an insurer. Cut-off: team verification pending.</div>' : ""}</section></div><aside><section class="card next-step"><div class="eyebrow">YOUR NEXT BEST STEP</div><div class="next-icon" aria-hidden="true">↗</div><h2>${next ? next.name : "Keep your home ready"}</h2><p>${next ? "Start with a practical improvement before considering a full retrofit." : "Your current inputs do not suggest a positive EAD measure. Review the risk, comfort and energy options."}</p>${next ? `<div class="lineitem"><span>Illustrative central cost</span><strong>${money(funding(h, [next.id]).net)}</strong></div><div class="lineitem"><span>Score with this measure</span><strong>${score(h, "today", { ...h.flags, [next.id]: true }).value} · likely ${score(h, "today", { ...h.flags, [next.id]: true }).low}–${score(h, "today", { ...h.flags, [next.id]: true }).high}</strong></div>` : ""}${button("plan", "Explore your plan →")}<small>Practical first steps, with funding eligibility checked before you commit.</small></section><section class="card section energy-card"><div class="eyebrow">ENERGY READINESS</div><h2>EPC ${energy.band}</h2><div class="epcladder">${D.model.epcBands.map(([b], i) => `<span class="${energy.band === b ? "current" : ""}" style="background:${["#32914b", "#78b645", "#afd064", "#f4d24e", "#eeae4f", "#e88950", "#da5d50"][i]}">${b}</span>`).join("")}</div><strong>SAP ${energy.sap}/100</strong><p>${energy.pointsToC} points and ${energy.bandsToC} bands to EPC C.<br>${esc(h.heating)}.</p><small>SAP is the 1–100 energy score behind your EPC band. Energy readiness stays separate from physical climate risk. Your input is illustrative, not a new certificate.</small></section><section class="card section moments-card"><div class="eyebrow">AT THE RIGHT MOMENT</div><h2>Your next reminders</h2>${
        momentMatches(h)
          .map(
            (m) =>
              `<article class="moment"><span class="tag">${esc(m.name)}</span><p>${m.id === "remortgage" ? `Your mortgage deal ends in ${h.moments.remortgageMonths} months. ` : m.id === "insurance" ? `Renewal in ${h.moments.insuranceRenewalMonths} months. ` : ""}${esc(m.nudge)}</p><a href="${href(m.page)}">${m.cta} →</a></article>`,
          )
          .join("") ||
        "<p>Keep your profile and evidence up to date, even when no renewal is due.</p>"
      }<label class="field">Simulate a moment<select id="moment-demo"><option value="">Choose a demo event</option>${D.moments.map((m) => `<option value="${m.id}">${m.name}</option>`).join("")}</select></label><div id="nudge-preview" aria-live="polite"></div></section><div class="callout section">Your data stays on this device. You decide who sees your passport. <a href="${href("passport")}">Open your record →</a></div></aside></div><p class="print-only">ARKRA Home climate report · ${date(D.model.snapshotDate)} · Demo · All figures illustrative. Not a property assessment, valuation, insurance quote or financial advice.</p>`;
    main.querySelectorAll("[data-scenario]").forEach(
      (b) =>
        (b.onclick = () => {
          chosen = b.dataset.scenario;
          draw();
          main
            .querySelector(`[data-scenario="${chosen}"]`)
            ?.focus({ preventScroll: true });
        }),
    );
    main.querySelector("#print").onclick = () => window.print();
    main.querySelectorAll(".correction-form").forEach(
      (form) =>
        (form.onsubmit = (e) => {
          e.preventDefault();
          const f = new FormData(form);
          h.overrides = (h.overrides || []).filter(
            (o) => o.hazard !== form.dataset.hazard,
          );
          h.overrides.push({
            hazard: form.dataset.hazard,
            band: f.get("band"),
            reason: f.get("reason"),
            note: f.get("note"),
            date: D.model.snapshotDate,
          });
          updateHome({ ...original, overrides: h.overrides });
          shell();
          passport().updated = D.model.snapshotDate;
          save();
          draw();
          toast("Correction saved on this device. Demo: nothing was sent.");
        }),
    );
    main.querySelectorAll("[data-restore]").forEach(
      (b) =>
        (b.onclick = () => {
          h.overrides = h.overrides.filter(
            (o) => o.hazard !== b.dataset.restore,
          );
          updateHome({ ...original, overrides: h.overrides });
          shell();
          draw();
        }),
    );
    main.querySelector("#moment-demo").onchange = (e) => {
      const m = D.moments.find((m) => m.id === e.target.value);
      main.querySelector("#nudge-preview").innerHTML = m
        ? `<div class="callout"><strong>${esc(m.name)} · demo</strong><p>${esc(m.nudge)}</p><a href="${href(m.page)}">${m.cta} →</a></div>`
        : "";
    };
  };
  draw();
}
