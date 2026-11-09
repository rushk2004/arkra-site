import D from "../data.js";
import {
  score,
  ead,
  epc,
  repayment,
  applicable,
  bestPlan,
  funding,
} from "../engine.js";
import { energyPlan, homeWithVerified } from "../product-model.js";
import {
  currentHome,
  planIds,
  setPlan,
  passport,
  save,
  href,
} from "../state.js";
import {
  esc,
  money,
  number,
  pill,
  rating,
  kpi,
  intro,
  button,
  barChart,
  demoForm,
  bindDemoForms,
  toast,
  shell,
} from "../ui.js";
export function planPage(main) {
  const h = homeWithVerified(currentHome(), passport().entries);
  let selected = new Set(planIds()),
    confirmed = new Set(),
    installer = "Not chosen";
  function draw(focus) {
    const ids = [...selected],
      totals = funding(h, ids, [...confirmed]),
      flags = {
        ...h.flags,
        ...Object.fromEntries(totals.measures.map((m) => [m.id, true])),
      },
      before = score(h),
      after = score(h, "today", flags),
      beforeFuture = score(h, "high"),
      afterFuture = score(h, "high", flags),
      beforeE = ead(h),
      afterE = ead(h, "today", flags),
      energy = epc(h),
      postEnergy = epc(h, flags),
      choices = D.measures
        .filter((m) => applicable(h, m))
        .map((m) => {
          const f = { ...h.flags, [m.id]: true },
            cost = funding(h, [m.id], [...confirmed]);
          return {
            ...m,
            net: cost.net,
            reduction: before.value - score(h, "today", f).value,
            avoid: beforeE.value - ead(h, "today", f).value,
          };
        })
        .sort(
          (a, b) => b.avoid / Math.max(1, b.net) - a.avoid / Math.max(1, a.net),
        );
    main.innerHTML =
      intro(
        "Practical first steps",
        "Your plan. At your pace.",
        `${esc(h.household || "Your household")} · ${esc(h.title)} · ${esc(h.place)}`,
        "COSTED, FUNDED, RECORDED",
      ) +
      `<div class="grid four summary-strip">${kpi("Your assessed score", `${before.value}<small> · likely ${before.low}–${before.high}</small>`, `${before.band[0]} · ${before.band[3]} · illustrative`)}${kpi("Expected annual damage", money(beforeE.value), "Illustrative long-run annual average")}${kpi("Energy readiness", `EPC ${energy.band}`, `SAP ${energy.sap}/100 · separate from risk`)}${kpi("Plan cost after support", money(totals.net), `${totals.measures.length} selected measures · illustrative`)}</div><div class="grid planlayout section"><div><div class="sectiontitle"><h2>Start with what matters most.</h2><small>Ranked by damage avoided per net £</small></div><div class="plan-presets"><button data-preset="value" class="preset"><strong>Best value ↗</strong><small>Practical first steps</small></button><button data-preset="score" class="preset"><strong>Lowest risk</strong><small>Reduce the score</small></button><button data-preset="energy" class="preset"><strong>Energy first</strong><small>Improve EPC readiness</small></button><button data-preset="clear">Clear</button></div><small>Illustrative costs and effects. Measures interact; individual reductions cannot be added together.</small>${h.hazards.coastal.startsWith("z") ? `<section class="card section adaptation"><span class="tag">LONG-TERM COASTAL ADAPTATION</span><h2>Plan for a changing shoreline.</h2><p>Household measures cannot reduce the coastal erosion hazard. Monitor shoreline change, discuss insurance and mortgage-term implications, review local Coastal Change Management Area guidance and consider long-term relocation planning.</p><p>Illustrative zone horizon: about ${beforeE.coastalYears} years · ${beforeE.coastalYears <= D.ead.mortgageYears ? "within" : "beyond"} a ${D.ead.mortgageYears}-year mortgage term.</p><a href="https://www.gov.uk/check-coastal-erosion-management-in-your-area" target="_blank" rel="noopener">Check local coastal guidance ↗</a><small>Energy and comfort options below do not address erosion.</small></section>` : ""}<section class="section measure-list">${choices
        .map(
          (m) =>
            `<article class="card measure ${selected.has(m.id) ? "in-plan" : ""}"><div class="measuretop"><div><span class="eyebrow">${m.hazards.map((id) => D.weights.find((w) => w.id === id)?.name || "Energy readiness").join(" · ")}</span><h3>${m.name}</h3></div><label class="check"><input type="checkbox" data-measure="${m.id}" ${selected.has(m.id) ? "checked" : ""}>${selected.has(m.id) ? "In your plan" : "Add to plan"}</label></div><div class="measure-cost"><strong>${money(m.costCentral)}</strong> <small>central · typical ${money(m.costLow)}–${money(m.costHigh)} · illustrative</small></div><div class="grid three measure-effects"><div><small>Score reduction</small><strong>${m.reduction} points</strong></div><div><small>Annual damage avoided</small><strong>${money(m.avoid)}</strong></div><div><small>Simple payback</small><strong>${m.avoid > 0 ? "about " + number(m.net / m.avoid) + " years" : m.hazards.includes("heat") ? "Health & comfort" : "N/A"}</strong></div></div><p>${esc(m.notes)} ${m.avoid <= 0 ? (m.hazards.includes("heat") ? "Protects health and comfort." : "Reduces disruption or improves energy readiness. Energy savings are not modelled.") : ""}</p><details><summary>Potential support & assumptions</summary><div class="section">${
              m.grants.length
                ? m.grants
                    .map((id) => {
                      const f = D.finance.find((f) => f.id === id);
                      return `<p><strong>May be eligible: ${esc(f.name)}</strong><br><small>${esc(f.eligibility)}</small> <a href="${f.source}" target="_blank" rel="noopener">Check current terms ↗</a></p>`;
                    })
                    .join("")
                : "<p>No grant modelled.</p>"
            }<small>Net cost if the confirmed support applies: ${money(m.net)}. Modelled life ${m.lifeYears} years. Simple payback may exceed this; maintenance and energy savings are excluded.</small></div></details></article>`,
        )
        .join(
          "",
        )}</section><section class="card section"><h2>A change you can see.</h2><p class="muted">Physical-risk score, before and after your selected plan.</p>${barChart(
        [
          {
            label: "Today · assessed",
            value: before.value,
            text: before.value + " (" + before.low + "–" + before.high + ")",
            colour: "var(--d)",
          },
          {
            label: "Today · with plan",
            value: after.value,
            text: after.value + " (" + after.low + "–" + after.high + ")",
          },
          {
            label: "2050 high · before",
            value: beforeFuture.value,
            text:
              beforeFuture.value +
              " (" +
              beforeFuture.low +
              "–" +
              beforeFuture.high +
              ")",
            colour: "var(--e)",
          },
          {
            label: "2050 high · plan",
            value: afterFuture.value,
            text:
              afterFuture.value +
              " (" +
              afterFuture.low +
              "–" +
              afterFuture.high +
              ")",
          },
        ],
      )}<div class="grid two"><div class="beforeafter"><small>Expected annual damage · today</small><div class="lineitem"><strong>${money(beforeE.value)}</strong><span>→</span><strong>${money(afterE.value)}</strong></div></div><div class="beforeafter"><small>Expected annual damage · 2050 high</small><div class="lineitem"><strong>${money(ead(h, "high").value)}</strong><span>→</span><strong>${money(ead(h, "high", flags).value)}</strong></div></div></div><small>All effects are illustrative. A planned reduction is not verified until work and evidence are checked.</small></section><section class="card section" id="get-it-done"><div class="sectiontitle"><div><div class="eyebrow">GET IT DONE</div><h2>Make the next step simple.</h2></div><span class="tag">EXAMPLE (FICTIONAL) SERVICES</span></div><details class="survey-details"><summary>Book a survey (demo) →</summary><div class="section">${demoForm("Book a survey")}</div></details><p class="muted section">Choose qualified help. Listings show the type of service the live product could connect you to; they are not real firms or accreditation claims.</p>${D.installers.map((i) => `<article class="installer"><div><span class="source-badge">${esc(i.group)}</span><h3>${esc(i.name)}</h3><p>${esc(i.description)}</p><small>${esc(i.accreditation)}</small> <a href="${i.source}" target="_blank" rel="noopener">Check accreditation guidance ↗</a></div><button data-installer="${esc(i.id)}">Use this example</button></article>`).join("")}<div class="callout section">Selected installer: <strong id="installer-choice">${esc(installer)}</strong>. Example (fictional). Demo: nothing is sent.</div></section></div><aside class="card sticky plan-panel"><div class="eyebrow">YOUR RESILIENCE PLAN</div><h2>Better prepared,<br>one step at a time.</h2>${totals.measures.length ? totals.measures.map((m) => `<div class="lineitem"><span>${m.name}</span><strong>${money(m.costCentral)}</strong></div>`).join("") : '<div class="empty-state">Choose a measure, or let Best value build practical first steps for you.</div>'}<div class="lineitem total"><span>Total cost</span><strong>${money(totals.cost)}</strong></div>${totals.lines.map(([n, v]) => `<div class="lineitem"><span>${esc(n)}</span><strong>−${money(v)}</strong></div>`).join("")}<div class="lineitem"><span>Total grants & cashback</span><strong>−${money(totals.grants)}</strong></div><div class="lineitem total"><span>Net plan cost</span><strong>${money(totals.net)}</strong></div><div class="beforeafter"><small>Physical-risk score · today</small><div class="lineitem"><strong>${before.value} → ${after.value}</strong>${pill(after)}</div><small>Likely ${before.low}–${before.high} → ${after.low}–${after.high}</small><div class="lineitem"><span>Energy readiness</span><strong>EPC ${energy.band} → ${postEnergy.band}</strong></div></div><button id="save-passport" class="primary full" ${!totals.measures.length ? "disabled" : ""}>Save to your passport →</button><small>Saved as planned. Evidence is needed for a verified reduction.</small><hr><h3>How to pay</h3><p class="muted">Pay from savings, confirm potential support, or explore an illustrative green further advance.</p>${D.finance.map((f) => `<details><summary>${esc(f.name)}</summary><p class="small-text">${esc(f.eligibility)} <a href="${f.source}" target="_blank" rel="noopener">Check current terms ↗</a></p>${f.id === "council" ? "<small>Ask your council. Not deducted to avoid overlapping funding.</small>" : `<label class="check"><input type="checkbox" data-confirm="${f.id}" ${confirmed.has(f.id) ? "checked" : ""}>Eligibility confirmed (demo)</label>${f.id === "bus" ? `<label class="check"><input type="checkbox" data-confirm="offgrid" ${confirmed.has("offgrid") ? "checked" : ""}>Eligible off-gas-grid oil/LPG replacement</label>` : ""}${f.id === "halifax" ? `<label class="check"><input type="checkbox" data-confirm="compatible" ${confirmed.has("compatible") ? "checked" : ""}>Compatible with other support and installation</label>` : ""}`}</details>`).join("")}<small class="section block">No support is auto-applied because the profile does not establish eligibility.</small><details class="section" open><summary>Illustrative green further advance</summary><p class="small-text">ARKRA concept. Illustrative rate, not a Lloyds offer, approval or lending decision. Secured borrowing puts your home at risk if repayments are not maintained.</p><label class="field">Amount to borrow (£)<input id="amount" type="number" min="0" value="${totals.net}"></label><div class="grid two"><label class="field">Term (years)<input id="term" type="number" min="5" max="25" value="${D.model.term}"></label><label class="field">APR (%) · illustrative<input id="apr" type="number" min="0" max="30" step="0.1" value="${D.model.apr}"></label></div><div id="repayment" aria-live="polite"></div></details></aside></div>`;
    const refresh = (selector) => {
      setPlan([...selected]);
      history.replaceState(null, "", href("plan"));
      shell();
      draw(selector);
    };
    main.querySelectorAll("[data-measure]").forEach(
      (el) =>
        (el.onchange = () => {
          el.checked
            ? selected.add(el.dataset.measure)
            : selected.delete(el.dataset.measure);
          refresh(`[data-measure="${el.dataset.measure}"]`);
        }),
    );
    main.querySelectorAll("[data-preset]").forEach(
      (b) =>
        (b.onclick = () => {
          selected = new Set(
            b.dataset.preset === "clear"
              ? []
              : b.dataset.preset === "energy"
                ? energyPlan(h)
                : bestPlan(h, b.dataset.preset, [...confirmed]),
          );
          refresh(`[data-preset="${b.dataset.preset}"]`);
        }),
    );
    main.querySelectorAll("[data-confirm]").forEach(
      (el) =>
        (el.onchange = () => {
          el.checked
            ? confirmed.add(el.dataset.confirm)
            : confirmed.delete(el.dataset.confirm);
          draw(`[data-confirm="${el.dataset.confirm}"]`);
        }),
    );
    main.querySelectorAll("[data-installer]").forEach(
      (el) =>
        (el.onclick = () => {
          installer = D.installers.find(
            (i) => i.id === el.dataset.installer,
          ).name;
          main.querySelector("#installer-choice").textContent = installer;
          toast("Fictional installer selected. Demo: nothing was sent.");
        }),
    );
    main.querySelector("#save-passport").onclick = () => {
      const record = passport();
      for (const m of totals.measures) {
        if (!record.entries.some((e) => e.measureId === m.id))
          record.entries.push({
            measureId: m.id,
            status: "planned",
            date: D.model.snapshotDate,
            cost: m.costCentral,
            installer,
            evidence: [],
            scoreBefore: before.value,
            scoreAfter: score(h, "today", { ...h.flags, [m.id]: true }).value,
          });
      }
      record.updated = D.model.snapshotDate;
      save();
      shell();
      main.querySelector("#save-passport").disabled = true;
      toast("Plan saved to your passport as planned. Demo: nothing was sent.");
      main
        .querySelector("#save-passport")
        .insertAdjacentHTML(
          "afterend",
          `<a class="button full" href="${href("passport")}">Open your passport →</a>`,
        );
    };
    const calculate = () => {
      const p = +main.querySelector("#amount").value,
        y = +main.querySelector("#term").value,
        a = +main.querySelector("#apr").value;
      const out = main.querySelector("#repayment");
      if (
        !Number.isFinite(p) ||
        !Number.isFinite(y) ||
        !Number.isFinite(a) ||
        p < 0 ||
        y < 5 ||
        y > 25 ||
        a < 0 ||
        a > 30
      ) {
        out.textContent =
          "Enter a valid amount, term 5–25 years and APR 0–30%.";
        return;
      }
      const m = repayment(p, a, y);
      out.innerHTML = `<div class="metric">£${m.toFixed(2)}<small> /month</small></div><div class="lineitem"><span>Total interest</span><strong>${money(m * y * 12 - p)}</strong></div><div class="lineitem"><span>Total repaid</span><strong>${money(m * y * 12)}</strong></div><small>Average monthly damage avoided: ${money((beforeE.value - afterE.value) / 12)}. Avoided damage is uncertain; it is not regular cash income to meet repayments.</small>`;
    };
    for (const id of ["amount", "term", "apr"])
      main.querySelector("#" + id).oninput = calculate;
    calculate();
    bindDemoForms(main);
    if (focus) {
      const el = main.querySelector(focus);
      if (el) {
        el.closest("details")?.setAttribute("open", "");
        el.focus({ preventScroll: true });
      }
    }
  }
  draw();
}
