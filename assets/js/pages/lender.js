import D from "../data.js";
import { portfolio, score } from "../engine.js";
import {
  portfolioModel,
  portfolioImpact,
  momentMatches,
  passportScores,
  homeWithVerified,
  hasEvidence,
} from "../product-model.js";
import { currentHome, passport, href } from "../state.js";
import {
  esc,
  money,
  number,
  intro,
  kpi,
  pill,
  rating,
  barChart,
} from "../ui.js";
let model;
export function getBook() {
  return model || (model = portfolioModel(portfolio()));
}
export function lenderPage(main) {
  const rows = getBook();
  let uptake = D.model.defaultUptake,
    verification = D.model.defaultVerification;
  main.innerHTML =
    intro(
      "For mortgage & climate-risk teams",
      "More resilient homes. Measurable progress.",
      "Connect homeowner action to a portfolio outcome. Explore adoption, evidence and timely customer support.",
      "SYNTHETIC PORTFOLIO · NOT LLOYDS DATA",
    ) +
    `<section class="card lender-controls"><div><div class="eyebrow">SCENARIO EXPLORER</div><h2>What if more homeowners took the next step?</h2><small>${number(rows.length)} synthetic homes · 2050 high scenario · no verified grant eligibility assumed</small></div><div class="grid two slider-controls"><label class="field">Uptake among D/E homes <strong id="uptake-label">${uptake}%</strong><input id="uptake" type="range" min="0" max="100" value="${uptake}"></label><label class="field">Verification rate <strong id="verification-label">${verification}%</strong><input id="verification" type="range" min="0" max="100" value="${verification}"></label></div></section><div id="impact-results" class="section" aria-live="polite"></div><section class="card section" id="outreach"></section><section class="card section"><div class="sectiontitle"><div><div class="eyebrow">DESIGNED TO FIT INSIDE YOUR APP</div><h2>Your bank. A consistent customer journey.</h2></div><div class="segmented"><button id="arkra-preview" class="selected" aria-pressed="true">ARKRA theme</button><button id="partner-preview" aria-pressed="false">Your Bank (fictional)</button></div></div><div id="white-label" class="white-label-preview"><div class="partner-head"><strong id="preview-brand">ARKRA /</strong><span>My home</span></div><div class="partner-body"><small>${esc(currentHome().household || "Your household")} · ${esc(currentHome().title)}</small><h3>Your home’s climate outlook</h3>${rating(score(homeWithVerified(currentHome(), passport().entries)))}${pill(score(homeWithVerified(currentHome(), passport().entries)))}<p>Know what matters. Start with a practical plan.</p><a class="button primary" href="${href("home")}">Explore your home →</a></div></div><small class="block section">Neutral grey and navy partner preview. Your Bank is fictional. No real lender branding, pricing, approval or capital-treatment claim is implied.</small></section>`;
  const update = () => {
    const impact = portfolioImpact(rows, uptake, verification);
    main.querySelector("#uptake-label").textContent = uptake + "%";
    main.querySelector("#verification-label").textContent = verification + "%";
    const counts = {};
    for (const r of impact.eligible) {
      const top = [...r.future.rows].sort((a, b) => b.a - a.a)[0].name;
      counts[top] = (counts[top] || 0) + 1;
    }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const distributions = ["today", "future", "after"].map((key) =>
      D.model.scoreBands.map(([b]) => {
        const rs = rows.filter(
          (r) =>
            (key === "after"
              ? impact.adopters.has(r)
                ? r.after
                : r.future
              : r[key]
            ).band[0] === b,
        );
        return {
          count: rs.length,
          balance: rs.reduce((s, r) => s + r.home.value * r.home.ltv, 0),
        };
      }),
    );
    main.querySelector("#impact-results").innerHTML =
      `<div class="grid four"><article class="card impact-headline"><div class="eyebrow">THE OUTCOME THAT MATTERS</div><div class="metric">${number(impact.reduced)}</div><h2>homes reduced in risk</h2><span class="verified-count">of which verified: ${number(impact.verifiedReduced)}</span><small>Illustrative adoption and verification scenario</small></article>${kpi("Homes moved out of D/E", number(impact.moved), `From ${impact.eligible.length} high / very high risk homes`)}${kpi("Annual damage avoided", money(impact.avoided), "Illustrative EAD · 2050 high")}${kpi("Homes newly reaching EPC C+", number(impact.epcC), "Best value favours physical risk; energy plans are separate")}</div><div class="grid four section">${kpi("Net plan cost", money(impact.net), "Across adopting homes · illustrative")}${kpi("Grants & cashback drawn", money(impact.grants), "£0: eligibility is not established")}${kpi("Illustrative lending volume", money(impact.net), "Assumes the full net cost is borrowed")}${kpi("Top driver among D/E homes", top?.[0] || "None", `${top?.[1] || 0} homes · 2050 high`)}</div><div class="callout section">Modelled reductions and evidence-backed outcomes are different. The verification slider estimates how many adopters complete the evidence step; these are scenario projections, not verified real properties.</div><div class="grid two section"><section class="card"><h2>Where the mortgage book sits</h2><small>Counts by physical-risk band · 0–${rows.length} homes</small>${D.model.scoreBands
        .map(
          ([b, , , name], i) =>
            `<div class="band-chart"><span class="pill ${b}">${b} · ${name}</span>${barChart(
              [
                { label: "Today", value: distributions[0][i].count },
                {
                  label: "2050 high",
                  value: distributions[1][i].count,
                  colour: `var(--${b.toLowerCase()})`,
                },
                { label: "After uptake", value: distributions[2][i].count },
              ],
              {
                max: rows.length,
                label: "Number of synthetic homes · illustrative",
              },
            )}</div>`,
        )
        .join(
          "",
        )}</section><section class="card"><h2>Outstanding balance by band</h2><p class="muted">Synthetic loan balances. No mortgage pricing or regulatory capital effect is modelled.</p><div class="tablewrap"><table><thead><tr><th>Band</th><th>Today</th><th>2050 high</th><th>After uptake</th></tr></thead><tbody>${D.model.scoreBands.map(([b], i) => `<tr><td><span class="pill ${b}">${b}</span></td>${distributions.map((d) => `<td>${money(d[i].balance)}</td>`).join("")}</tr>`).join("")}</tbody></table></div><div class="section"><h3>Why it matters to a lender</h3><p>Physical climate risk can affect collateral resilience, insurability and affordability. ARKRA joins practical homeowner support to an auditable record of action.</p></div><div class="callout"><strong>Selected home’s passport</strong><p>${esc(currentHome().title)} · ${passport().entries.filter((e) => e.status === "verified").length} entries labelled Verified (demo). This local record is separate from the synthetic portfolio projection.</p><a href="${href("passport")}">Inspect the evidence step →</a></div></section></div><section class="card section"><h2>Regional view</h2><div class="tablewrap"><table><thead><tr><th>Worked-example area</th><th>Homes</th><th>D/E today</th><th>D/E 2050 high</th><th>D/E after uptake</th><th>Reduced</th></tr></thead><tbody>${[
        ...new Set(rows.map((r) => r.home.place)),
      ]
        .map((region) => {
          const subset = rows.filter((r) => r.home.place === region);
          return `<tr><td>${esc(region)}</td><td>${subset.length}</td><td>${subset.filter((r) => r.today.value >= 60).length}</td><td>${subset.filter((r) => r.future.value >= 60).length}</td><td>${subset.filter((r) => (impact.adopters.has(r) ? r.after : r.future).value >= 60).length}</td><td>${subset.filter((r) => impact.adopters.has(r) && r.after.value < r.future.value).length}</td></tr>`;
        })
        .join("")}</tbody></table></div></section>`;
  };
  main.querySelector("#uptake").oninput = (e) => {
    uptake = +e.target.value;
    update();
  };
  main.querySelector("#verification").oninput = (e) => {
    verification = +e.target.value;
    update();
  };
  update();
  const quarter = {
    remortgage: rows.filter(
      (r) => r.future.value >= 60 && r.home.moments.remortgageMonths <= 3,
    ).length,
    insurance: rows.filter(
      (r) => r.future.value >= 60 && r.home.moments.insuranceRenewalMonths <= 3,
    ).length,
    claim: rows.filter(
      (r) => r.future.value >= 60 && r.home.moments.recentFloodClaim,
    ).length,
  };
  const outreach = rows
    .filter(
      (r) =>
        r.future.value >= 60 &&
        (r.home.moments.remortgageMonths <= 6 ||
          r.home.moments.insuranceRenewalMonths <= 6 ||
          r.home.moments.recentFloodClaim),
    )
    .slice(0, 12);
  main.querySelector("#outreach").innerHTML =
    `<div class="sectiontitle"><div><div class="eyebrow">MOMENTS THAT MATTER</div><h2>Help when a customer is ready to act.</h2></div><span class="tag">PREVIEW ONLY · NOTHING IS SENT</span></div><div class="grid three quarter-counts">${kpi("Remortgage this quarter", quarter.remortgage, "D/E homes · illustrative")}${kpi("Insurance renewal this quarter", quarter.insurance, "D/E homes · illustrative")}${kpi("Recent flood claim", quarter.claim, "D/E homes · illustrative")}</div><div class="tablewrap section"><table><thead><tr><th>Customer ID</th><th>2050 band</th><th>Top hazard</th><th>Moment</th><th>Months</th><th>Suggested message</th><th>Expected score change</th></tr></thead><tbody>${outreach
      .map((r) => {
        const m = r.home.moments,
          key = m.recentFloodClaim
            ? "claim"
            : m.remortgageMonths <= 6
              ? "remortgage"
              : "insurance",
          moment = D.moments.find((m) => m.id === key),
          months =
            key === "claim"
              ? 0
              : key === "remortgage"
                ? m.remortgageMonths
                : m.insuranceRenewalMonths;
        return `<tr><td>${r.home.id}</td><td>${pill(r.future)}</td><td>${[...r.future.rows].sort((a, b) => b.a - a.a)[0].name}</td><td>${moment.name}</td><td>${months}</td><td>${moment.nudge}</td><td>−${r.future.value - r.after.value} points</td></tr>`;
      })
      .join(
        "",
      )}</tbody></table></div><small>First ${outreach.length} matching synthetic customers with a moment in the next 6 months. Quarter counts may overlap.</small><div class="nudge-example section"><span class="tag">IN-APP NUDGE PREVIEW</span><h3>Your mortgage deal ends in 5 months.</h3><p>Fit measures before you switch: they may qualify for lender cashback. Check current terms.</p><a href="${href("plan")}">Explore practical first steps →</a></div>`;
  for (const [id, partner] of [
    ["arkra-preview", false],
    ["partner-preview", true],
  ])
    main.querySelector("#" + id).onclick = () => {
      main
        .querySelector("#white-label")
        .classList.toggle("neutral-partner", partner);
      main.querySelector("#preview-brand").textContent = partner
        ? "Your Bank · fictional"
        : "ARKRA /";
      for (const [key, on] of [
        ["arkra-preview", !partner],
        ["partner-preview", partner],
      ]) {
        const b = main.querySelector("#" + key);
        b.classList.toggle("selected", on);
        b.setAttribute("aria-pressed", on);
      }
    };
}
