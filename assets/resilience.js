import { dividend, hazards, households, loanOffer, loanRates, loanTerms, measures, verifyMonthsOptions, normalisePostcode, planCosts, postcodeRecord, resilienceGrade, sources } from "./model.js";
import { demoProperties, propertiesForPostcode, evidenceRecommendations } from "./demo-properties.js";

const panel = document.querySelector("#panel");
const householdInput = document.querySelector("#household");
const context = document.querySelector("#household-context");
const pounds = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("en-GB");
const steps = ["twin", "plan", "reward", "protect", "street"];
const horizons = ["Today", "2035", "2050"];
const shardCache = new Map();
const icon = (id) => `<svg aria-hidden="true"><use href="#i-${id}"/></svg>`;
const link = (url, title) => `<a href="${url}" target="_blank" rel="noopener">${title}</a>`;
const next = (step, text) => `<a class="button primary" href="#${step}">${text} ${icon("arrow")}</a>`;
const money = (amount) => pounds.format(amount);
const poundsExact = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const moneyExact = (amount) => poundsExact.format(amount);
const grade = (value) => `<span class="grade grade-${value?.toLowerCase() || "unknown"}">${value || "?"}</span>`;
const heading = (kicker, title, subtitle, status) => `<div class="panel-head"><div><span class="eyebrow">${kicker}</span><h3 id="step-title" tabindex="-1">${title}</h3><p>${subtitle}</p></div><span class="badge neutral">${status}</span></div>`;

let step = "twin";
let lookup = { sequence: 0, postcode: "", status: "idle" };
let data;

function startHousehold(key) {
  const household = households[key];
  const previousPropertyId = data?.propertyId || null;
  data = {
    household, selected: [...household.selected], savings: household.savings,
    grant: household.grant, cashback: household.cashback, horizon: 0, epc: "", propertyId: previousPropertyId,
    verified: false, consent: false, assisted: household.assisted,
    warning: "", claim: false, scheme: "drainage", joined: new Set(), landlord: false, loanOpen: false, loanYears: 5, loanVerifyMonths: 6,
  };
  if (lookup.status === "found") resetIllustrativePlan();
}

function currentProperty() {
  return lookup.status === "found"
    ? demoProperties.find(property => property.id === data.propertyId && property.postcode === lookup.postcode) || null
    : null;
}

function recommendedIds() {
  return evidenceRecommendations(lookup.status === "found" ? lookup.record : null, currentProperty());
}

function resetIllustrativePlan() {
  // Evidence suggests candidates for review. The visitor chooses which to fund.
  data.selected = [...data.household.selected];
  data.verified = false;
  data.loanOpen = false;
}

function ratingCards() {
  return hazards.map((hazard) => {
    const current = resilienceGrade(data.household, hazard.id, data.horizon);
    const potential = resilienceGrade(data.household, hazard.id, data.horizon, data.selected);
    const eaEvidence = hazard.id === "flood" && lookup.status === "found"
      ? `<small class="area-risk-note">EA ${lookup.postcode}: ${lookup.record.high} high, ${lookup.record.medium} medium, ${lookup.record.low} low-risk area addresses (not this home's rating)</small>`
      : "";
    return `<article class="card hazard"><div><strong>${icon(hazard.icon)} ${hazard.name}</strong><span aria-label="${current ? `Baseline grade ${current}` : "Grade unknown"}">${grade(current)}</span></div>
      <small>${current ? "Illustrative profile grade · low confidence" : "Unknown · no property evidence"}</small>
      ${eaEvidence}
      ${current ? `<small>${data.verified ? "Verified in demo" : "With selected work"}: <strong>${potential}</strong></small>` : ""}</article>`;
  }).join("");
}

function twinPanel() {
  return heading("01 / KNOW", "Home climate twin", "Connect official postcode flood exposure to an address-level EPC example, then review what still needs a property survey.", "Evidence-led demo")
    + `<section class="card lookup"><h4>Check a real postcode</h4><p>Published Environment Agency postcode counts. The result describes the area around addresses.</p>
      <form class="lookup-row" id="lookup-form">
        <label class="field">Postcode<input name="postcode" placeholder="e.g. HX7 8AD" maxlength="10" autocomplete="postal-code" required></label>
        <button class="button primary" type="submit">Check postcode ${icon("arrow")}</button>
        <button class="button plain" type="button" data-action="example">Use HX7 8AD</button>
      </form>
      <div class="lookup-result" id="lookup-result" role="status"></div>
    </section>
    ${propertyAssessment()}
    <div class="section-row"><strong>Resilience rating <span class="badge neutral">Illustrative profile only</span></strong><div class="segments" role="group" aria-label="Scenario year">${horizons.map((year, index) => `<button data-horizon="${index}" aria-pressed="${data.horizon === index}">${year}</button>`).join("")}</div></div>
    <div id="hazards" class="hazard-grid">${ratingCards()}</div>
    <div class="panel-foot"><p class="small">A is the most resilient grade in ARKRA’s hypothetical model. These grades are not calculated from the EA counts or EPC and must not be interpreted as actual property risk. The 2035 and 2050 scenarios are illustrative.</p>${next("plan", "See the evidence-linked plan")}</div>`;
}

function propertyAssessment() {
  if (lookup.status !== "found") {
    return `<section class="card assessment"><h4>Property assessment</h4><p>Check a postcode above to connect its official area evidence to a selected demonstration property. An individual building's flood risk remains unassessed.</p></section>`;
  }
  const property = currentProperty();
  const matches = propertiesForPostcode(lookup.postcode);
  const hasExposedAddresses = lookup.record.high + lookup.record.medium + lookup.record.low > 0;
  const epcDetail = property
    ? `<div class="epc-facts"><span class="epc-letter">${property.epc}</span><div><strong>Current ${property.epc} (${property.epcScore}) · potential ${property.potentialEpc} (${property.potentialScore})</strong><p>${property.type} · ${property.floorArea} m² · valid until ${property.validUntil}</p><p>Walls: ${property.wall}. Roof: ${property.roof}.</p><p>Assessed ${property.assessmentDate}. ${link(property.certificate, "View this actual GOV.UK certificate ↗")}</p></div></div>`
    : `<p>No EPC was retrieved for an address in this postcode. ARKRA does not automatically search the EPC register; ${link(sources.epc, "look up a certificate on GOV.UK ↗")}.</p><label class="field manual-epc">Optional EPC band from your own certificate (self-reported, not verified)<select id="epc"><option value="">Unknown</option>${[..."ABCDEFG"].map(value => `<option value="${value}" ${data.epc === value ? "selected" : ""}>${value}</option>`).join("")}</select></label>`;

  return `<section class="card assessment" aria-label="Property assessment">
    <div class="assessment-title"><h4>Property assessment</h4><span class="badge neutral">Evidence & confidence</span></div>
    <label class="field address-select">Choose an address or demonstration property
      <select id="property-select"><option value="" ${!property ? "selected" : ""}>Illustrative property · no verified EPC</option>${matches.map(item => `<option value="${item.id}" ${item.id === property?.id ? "selected" : ""}>${item.address} · EPC ${item.epc}</option>`).join("")}</select>
    </label>
    <p class="small">${matches.length ? "These three real certificate records are curated for this postcode; other addresses require the government lookup." : "Only an illustrative property is available for this postcode in this static MVP; search GOV.UK for a real address."} The example household and its finances are fictional and are not the occupants of any listed address.</p>
    <div class="assessment-facts">
      <div><span>EA postcode exposure</span><strong>${hasExposedAddresses ? `${number.format(lookup.record.high + lookup.record.medium + lookup.record.low)} addresses in listed bands` : "No addresses in listed bands"}</strong><small>Official area-level counts · not the building's flood risk</small></div>
      <div><span>Property EPC</span><strong>${property ? `Band ${property.epc}` : data.epc ? `Band ${data.epc}` : "Unknown"}</strong><small>${property ? "Verified public certificate snapshot" : data.epc ? "Self-reported only" : "Not retrieved"}</small></div>
    </div>
    <div class="epc-detail"><h5>Energy performance</h5>${epcDetail}</div>
    <h5>Data confidence</h5>
    <dl class="confidence-list">
      <div><dt>Postcode exposure</dt><dd><span class="badge">Official · area level</span><small>Environment Agency published counts</small></dd></div>
      <div><dt>EPC information</dt><dd><span class="badge ${property ? "" : "neutral"}">${property ? "Official certificate" : data.epc ? "Self-reported" : "Unverified"}</span><small>${property ? "Property-specific energy evidence" : "Property-specific certificate not retrieved"}</small></dd></div>
      <div><dt>Building flood risk</dt><dd><span class="badge neutral">Survey required</span><small>No property-level flood assessment</small></dd></div>
      <div><dt>2050 scenario</dt><dd><span class="badge neutral">Illustrative model</span><small>Not an official property forecast</small></dd></div>
    </dl>
    <p class="small assessment-source">EA dataset: ${link(sources.flood, "source and methodology ↗")} · ${link(sources.risk, "Check a specific property's surrounding flood risk ↗")}</p>
  </section>`;
}

function showLookup() {
  const output = panel.querySelector("#lookup-result");
  if (!output) return;
  const form = panel.querySelector("#lookup-form");
  form.elements.postcode.value = lookup.postcode;
  form.querySelector('[type="submit"]').disabled = lookup.status === "loading";
  if (lookup.status === "idle") return;
  const source = `<p>${link(sources.flood, "Environment Agency dataset ↗")} · ${link(sources.risk, "Check an individual address on GOV.UK ↗")}</p>`;
  if (lookup.status === "loading") {
    output.textContent = "Checking the published postcode dataset…";
  } else if (lookup.status === "invalid") {
    output.textContent = "Enter a full UK postcode, for example HX7 8AD.";
  } else if (lookup.status === "unavailable") {
    output.innerHTML = "<p>The dataset could not be loaded. Try again or use the official service.</p>" + source;
  } else if (lookup.status === "missing") {
    output.innerHTML = `<strong>No published match for ${lookup.postcode}</strong><p>This dataset covers England. A missing result leaves exposure unknown.</p>` + source;
  } else {
    const { high, medium, low, groundwater } = lookup.record;
    output.innerHTML = `<strong>${lookup.postcode}</strong> <span class="badge">Official area data · bundled snapshot</span>
      <div class="lookup-counts">${[["High", high], ["Medium", medium], ["Low", low]].map(([band, count]) => `<div><b>${number.format(count)}</b><small>${band} risk addresses</small></div>`).join("")}</div>
      <p>Groundwater indicator: ${groundwater.toLowerCase()}. Counts use the highest risk category from rivers, sea or surface water for the area surrounding each address. Very-low risk addresses are not counted; do not treat these counts as a property-specific assessment or a denominator.</p>
      <p>© Environment Agency copyright and/or database right 2025. All rights reserved. Dataset published under the Open Government Licence.</p>` + source;
  }
}

async function checkPostcode(input) {
  const postcode = normalisePostcode(input);
  const sequence = lookup.sequence + 1;
  lookup = { sequence, postcode: postcode?.display || input, status: postcode ? "loading" : "invalid" };
  data.propertyId = null;
  data.epc = "";
  resetIllustrativePlan();
  showLookup();
  if (!postcode) {
    render();
    return;
  }
  let record;
  let status;
  try {
    let shard = shardCache.get(postcode.area);
    if (shard === undefined) {
      const response = await fetch(new URL(`./postcodes/${postcode.area}.txt`, import.meta.url), { signal: AbortSignal.timeout(12000) });
      if (!response.ok && response.status !== 404) throw new Error("Postcode data unavailable");
      shard = response.ok ? await response.text() : "";
      shardCache.set(postcode.area, shard);
    }
    record = postcodeRecord(shard, postcode.compact);
    status = record ? "found" : "missing";
  } catch {
    status = "unavailable";
  }
  if (lookup.sequence !== sequence) return;
  lookup = { sequence, postcode: postcode.display, status, record };
  resetIllustrativePlan();
  render();
}

function planPanel() {
  const hasPump = data.selected.includes("pump");
  const suggested = recommendedIds();
  const property = currentProperty();
  const options = [...new Set([...suggested, ...data.household.options, ...data.selected])].sort((a, b) => {
    const priority = id => suggested.includes(id) ? 1 : 0;
    const value = (id) => measures[id].loss / Math.max(1, measures[id].cost);
    return priority(b) - priority(a) || Number(data.selected.includes(b)) - Number(data.selected.includes(a)) || value(b) - value(a);
  });
  const evidenceIntro = lookup.status === "found"
    ? `<div class="card plan-evidence"><strong>Connected evidence: ${lookup.postcode}${property ? ` · ${property.address}` : " · illustrative property"}</strong><p>${suggested.length ? `ARKRA suggests ${suggested.map(id => measures[id].title.toLowerCase()).join(", ")} for review. Select a measure below to include its cost in your plan.` : "No specific retrofit recommendation is justified by the available evidence."} ${property ? `The public EPC is ${property.epc};` : "No verified EPC is attached;"} a building-level flood survey is still needed before deciding on flood barriers. Existing profile choices below are fictional.</p><p><a href="#twin">Review the evidence and confidence levels ↗</a></p></div>`
    : `<div class="notice">No connected postcode evidence yet. <a href="#twin">Check a postcode in the Climate Twin ↗</a> to add evidence-informed suggestions. All current choices are illustrative.</div>`;
  return heading("02 / PLAN & PAY", "One plan, one funding gap", "Evidence-informed suggestions feed into an editable demonstration plan and financing example.", "Illustrative quotes")
    + evidenceIntro
    + `<div class="plan-grid"><section aria-label="Recommended measures" class="measure-list">${options.map((id) => {
      const measure = measures[id];
      const result = measure.loss ? `${money(measure.loss)}/yr modelled loss avoided` : "No direct physical-risk saving modelled";
      return `<article class="card measure"><div class="cost-row"><label><input id="measure-${id}" type="checkbox" data-measure="${id}" ${data.selected.includes(id) ? "checked" : ""}><span><strong>${measure.title}</strong><small>${suggested.includes(id) ? "Evidence-informed candidate · " : "Illustrative profile choice · "}${measure.tag}</small></span></label><span class="measure-cost">${measure.cost ? money(measure.cost) : "£0"}</span></div><p>${measure.why}</p><span class="small">${result} · ${measure.carbon === null ? "carbon impact not modelled" : `~${number.format(measure.carbon)} kg CO₂e/yr assumed savings`}</span></article>`;
    }).join("")}</section>
      <section class="card money-card" aria-label="Funding calculator"><h4>Cash flow at a glance</h4><div id="funding-result" aria-live="polite"></div>
        <div class="funding-controls">
          <label class="toggle"><input id="grant" type="checkbox" ${data.grant && hasPump ? "checked" : ""} ${hasPump ? "" : "disabled"}> £7,500 grant deducted on the heat-pump quote</label>
          <label class="field">Savings available (£)<input id="savings" type="number" min="0" max="1000000" step="1" value="${data.savings}"></label>
          <label class="toggle"><input id="cashback" type="checkbox" ${data.cashback && hasPump ? "checked" : ""} ${hasPump && data.household.balance ? "" : "disabled"}> £2,000 Eco Home Reward after completion</label>
        </div>
        <div class="grant-sources">${link(sources.grant, "Grant amounts ↗")} ${link(sources.quote, "Quote timing ↗")} ${link(sources.cashback, "Cashback terms ↗")}</div>
        <div id="loan-cta"></div>
      </section></div>
    <div id="loan-offer" aria-live="polite"></div>
    <div class="notice">${data.household.role === "Renting" ? "<strong>For renters.</strong> Send the plan to the landlord for a decision on installation, funding and permissions." : "<strong>One proposed application.</strong> A further advance or retrofit loan could bridge the gap, subject to affordability. A pilot would use vetted installers and independent checks."}</div>
    ${data.household.role === "Renting" ? `<div class="panel-foot"><button type="button" class="button plain" data-action="landlord">Prepare landlord request</button></div>${data.landlord ? '<p class="notice">Request draft: Could we review the overheating in my flat and get a quote for external shading? The example plan also suggests agreeing a heat-warning routine. This is ready for you to copy and send.</p>' : ""}` : ""}
    <div class="panel-foot"><p class="small">New survey/insulation costs are indicative, not official quotes or EPC cost estimates. Installation, eligibility and savings require independent checks. The original household's financial and resilience assumptions remain separate from the official data.</p>${next("reward", "See the Dividend")}</div>`;
}

function showFunding() {
  const output = panel.querySelector("#funding-result");
  if (!output) return;
  const costs = planCosts(data.selected, data);
  output.innerHTML = `<dl>
    <div><dt>Combined quote</dt><dd>${money(costs.total)}</dd></div>
    <div><dt>Grant on quote</dt><dd>−${money(costs.upfrontGrant)}</dd></div>
    <div><dt>Savings used</dt><dd>−${money(costs.availableSavings)}</dd></div>
    <div class="gap"><dt>Cash needed upfront</dt><dd>${money(costs.gap)}</dd></div>
    <div><dt>Cashback after work</dt><dd>${money(costs.laterCashback)}</dd></div>
    <div><dt>Net gap after cashback</dt><dd>${money(costs.afterCashback)}</dd></div>
  </dl>`;
  showLoan();
}

function showLoan(focusSelector) {
  const cta = panel.querySelector("#loan-cta");
  const slot = panel.querySelector("#loan-offer");
  if (!cta || !slot) return;
  const { gap, laterCashback } = planCosts(data.selected, data);
  const renting = data.household.role === "Renting";
  if (renting || gap <= 0) {
    cta.innerHTML = "";
    slot.innerHTML = "";
    return;
  }
  cta.innerHTML = `<button type="button" class="button primary" data-action="loan" aria-expanded="${data.loanOpen}" style="width:100%;margin-top:13px">${data.loanOpen ? "Hide loan offer" : `Finance this plan · ${money(gap)}`} ${icon(data.loanOpen ? "lock" : "arrow")}</button>`;
  if (!data.loanOpen) {
    slot.innerHTML = "";
    return;
  }
  const offer = loanOffer(gap, data.loanYears, data.loanVerifyMonths);
  const verified = data.verified;
  slot.innerHTML = `<section class="card loan-card" aria-label="ARKRA Loan Offer">
    <div class="panel-head"><div><span class="eyebrow">PROPOSED FINANCING</span><h4>Your ARKRA Loan Offer</h4><p>Bridge the upfront gap. Verified improvements could unlock a lower rate.</p></div><span class="badge neutral">Demo</span></div>
    <div class="section-row"><div class="stat"><span>Amount to finance</span><strong>${money(gap)}</strong></div>
      <div class="loan-term"><span class="small" id="loan-term-label">Loan duration</span><div class="segments" role="group" aria-labelledby="loan-term-label">${loanTerms.map((years) => `<button type="button" data-term="${years}" aria-pressed="${data.loanYears === years}">${years} years</button>`).join("")}</div></div>
      <div class="loan-term"><span class="small" id="loan-vm-label">Verified after</span><div class="segments" role="group" aria-labelledby="loan-vm-label">${verifyMonthsOptions.map((months) => `<button type="button" data-vm="${months}" aria-pressed="${data.loanVerifyMonths === months}">${months} months</button>`).join("")}</div></div></div>
    <div class="loan-compare">
      <div class="loan-option ${verified ? "" : "current"}"><span class="eyebrow">STANDARD RATE</span><strong>${moneyExact(offer.before)}<small> per month</small></strong><p>${loanRates.standard.toFixed(1)}% · ${money(offer.interestBefore)} total interest</p></div>
      <div class="loan-option ${verified ? "current" : ""}"><span class="eyebrow">${verified ? "VERIFIED IN THIS DEMO" : "AFTER VERIFICATION"}</span><strong>${moneyExact(offer.after)}<small> per month</small></strong><p>${loanRates.verified.toFixed(1)}% from month ${offer.verifyMonths + 1} · ${money(offer.interestAfter)} total interest</p></div>
    </div>
    <p class="loan-summary">${verified ? `Rate unlocked. You pay the standard rate for ${offer.verifyMonths} months, then <strong>${moneyExact(offer.monthlySaving)} less each month</strong> on the ${money(offer.balanceAtVerification)} still owed.` : `Complete and verify your improvements to unlock the lower rate. If verified after ${offer.verifyMonths} months, payments on the ${money(offer.balanceAtVerification)} still owed fall by <strong>${moneyExact(offer.monthlySaving)} a month</strong>.`}</p>
    <p><strong>Total loan interest saved: ${money(offer.interestSaving)}</strong> over the ${offer.years}-year loan.</p>
    ${laterCashback ? `<p class="small">The ${money(laterCashback)} reward arrives after completion and could be used to repay part of the loan early.</p>` : ""}
    <div class="panel-foot"><button type="button" class="button ${verified ? "plain" : "primary"}" data-action="verify">${verified ? "Reset demo verification" : "Simulate verified work"} ${icon(verified ? "lock" : "check")}</button><p class="small">Hypothetical rates and payments for demonstration only. The lower rate applies only from the month after verification, to the balance then outstanding. Subject to status and affordability. The standard rate is not a risk surcharge, and a pilot would test any reward.</p></div>
  </section>`;
  if (focusSelector) slot.querySelector(focusSelector)?.focus();
}

function rewardPanel() {
  const model = dividend(data.household, data.selected, data.verified);
  const possible = dividend(data.household, data.selected, true);
  const before = resilienceGrade(data.household, "flood", 0);
  const after = resilienceGrade(data.household, "flood", 0, data.verified ? data.selected : []);
  const heatBefore = resilienceGrade(data.household, "heat", 0);
  const heatAfter = resilienceGrade(data.household, "heat", 0, data.verified ? data.selected : []);
  const verified = data.verified;
  const floodChanged = before !== after;
  const heatChanged = heatBefore !== heatAfter;
  return heading("03 / REWARD", "The Resilience Dividend", "See what changes when completed work is verified and the modelled loss falls.", "Proposed reward")
    + `<div class="reward-hero"><div><span class="eyebrow">${verified ? "VERIFIED IN THIS DEMO" : "AWAITING DEMO VERIFICATION"}</span><strong>${verified ? `${money(model.total)} / year` : `${money(possible.total)} / year potential`}</strong><p>${data.household.role === "Renting" ? "A tenant can record safer conditions. Mortgage or insurance rewards depend on the policyholder and product." : "Annual Dividend savings on mortgage repayments and insurance premiums."}</p></div>${icon(verified ? "shield" : "lock")}</div>
    <div class="split">
      <article class="card stat"><span>${heatChanged && !floodChanged ? "Overheating grade" : "Flood resilience"}</span><strong>${grade(heatChanged && !floodChanged ? heatBefore : before)} → ${grade(heatChanged && !floodChanged ? heatAfter : after)}</strong><p>${floodChanged || heatChanged ? "Grade updated after demo evidence check." : "Current modelled rating."}</p></article>
      <article class="card stat"><span>Next mortgage deal</span><strong>${!data.household.balance ? "Not applicable" : model.mortgage ? "4.50% → 4.40%" : "4.50%"}</strong><p>${model.mortgage ? `${money(model.mortgage)}/yr example repayment saving.` : "A lower rate would only apply to a qualifying next deal."}</p></article>
      <article class="card stat"><span>Flood excess</span><strong>${model.excessReduction ? "£500 → £250" : "£500"}</strong><p>${model.excessReduction ? "Illustrative reduction when a qualifying claim occurs." : "Illustrative baseline excess."}</p></article>
    </div>
    <details class="card dividend-details" ${verified ? "open" : ""}><summary>How the example pays for the reward</summary><p>Modelled annual losses fall from ${money(model.before)} to ${money(model.after)}. The example shares ${money(model.total)} of ${money(model.avoided)} in modelled avoided losses through repayments and premiums. The excess reduction is shown separately because it only matters if there is a claim.</p><p>Mortgage example: £190,000 repayment balance, 25 years remaining, a 0.10 percentage-point reduction at the next deal. Insurance uses an illustrative annual credit of up to £36. A pilot would need to test claims, credit losses, retention and delivery costs before setting any reward.</p></details>
    <div class="notice"><strong>Evidence for the resilience record.</strong> The pilot would check an installer certificate, dated photos and a completion audit. This control simulates that completed check.</div>
    <div class="panel-foot"><button type="button" class="button ${verified ? "plain" : "primary"}" data-action="verify" ${data.selected.length ? "" : "disabled"}>${verified ? "Reset demo verification" : "Simulate verified work"} ${icon(verified ? "lock" : "check")}</button>${next("protect", "Try Storm Mode")}</div>`;
}

function stormPanel() {
  const active = Boolean(data.warning);
  const flood = data.warning === "flood";
  const title = active ? (flood ? "Flood warning simulation" : "Heat warning simulation") : "Ready for a warning";
  const actions = active ? [
    [flood ? "Flood barrier reminder" : "Close blinds before peak heat", flood ? "Send the household its pre-agreed preparation checklist." : "Remind the household to shade sun-facing rooms early."],
    [flood ? "Sump pump check" : "Indoor temperature check", data.consent ? (flood ? "Simulated: compatible sump pump status checked." : "Simulated: sensor confirms indoor temperature is being monitored.") : "Sensor actions paused. Optional consent is off."],
    ["Priority callback", data.assisted ? `${data.household.name} added to the simulated priority call list.` : "Assisted support is available to households who opt in."],
    ["Recovery pathway", flood ? "If damage occurs, guide the household to the insurer and resilient repair." : "Show household support and official heat guidance during the warning."],
  ] : [];
  return heading("04 / PROTECT", "Storm Mode", "See what happens when a flood or heat warning reaches an opted-in household.", "Simulation")
    + `<div class="storm-status ${active ? "active" : ""}"><span class="icon-box">${icon(flood ? "wave" : active ? "sun" : "shield")}</span><div><strong>${title}</strong><p>${active ? "Simulated actions for " + data.household.name + "." : "Choose a scenario to preview preparation, assisted support and recovery."}</p></div></div>
    <div class="settings"><label class="toggle"><input id="consent" type="checkbox" ${data.consent ? "checked" : ""}> Allow simulated sensor actions</label><label class="toggle"><input id="assisted" type="checkbox" ${data.assisted ? "checked" : ""}> Opt into a priority callback</label></div>
    <div class="actions"><button class="button primary" data-warning="flood">Simulate flood warning</button><button class="button plain" data-warning="heat">Simulate heat warning</button>${active ? '<button class="button plain" data-warning="">End simulation</button>' : ""}</div>
    ${active ? `<div class="storm-actions">${actions.map(([label, text]) => `<article class="card"><h4>${label}</h4><p>${text}</p></article>`).join("")}</div>` : ""}
    ${flood ? `<div class="panel-foot"><button class="button plain" data-action="claim">${data.claim ? "Hide recovery route" : "Preview flood claim route"}</button></div>` : ""}
    ${data.claim ? `<div class="notice"><strong>Build Back Better.</strong> After an eligible flood claim, participating insurers can fund up to £10,000 of resilience measures in addition to standard repairs. A pilot could also route eligible households to financial support for remaining costs. ${link(sources.recovery, "Flood Re details ↗")}</div>` : ""}
    <div class="panel-foot"><p class="small">For current warnings use ${link(sources.warning, "Environment Agency flood warnings")} or ${link(sources.weather, "Met Office weather warnings")}.</p>${next("street", "Explore street schemes")}</div>`;
}

const schemes = {
  drainage: { title: "Shared surface water scheme", cost: 18000, base: 7, goal: 10, action: "A joint survey and shared drainage or barriers, coordinated with the local authority." },
  heating: { title: "Group heat-pump purchase", cost: 72000, base: 5, goal: 8, action: "Pool surveys and installation quotes so neighbours can compare one group offer." },
  energy: { title: "Community energy", cost: 30000, base: 8, goal: 12, action: "Explore a jointly funded local energy project with a community partner." },
};

function streetPanel() {
  const scheme = schemes[data.scheme];
  const joined = data.joined.has(data.scheme);
  const count = scheme.base + Number(joined);
  return heading("05 / TOGETHER", "Street schemes", "Some risks need neighbours, local authorities and installers to act together.", "Fictional street")
    + `<div class="section-row"><label class="field">Example scheme<select id="scheme">${Object.entries(schemes).map(([key, value]) => `<option value="${key}" ${data.scheme === key ? "selected" : ""}>${value.title}</option>`).join("")}</select></label></div>
    <article class="card"><h4>${scheme.title}</h4><p>${scheme.action}</p><div class="street-visual" aria-hidden="true">${Array.from({ length: scheme.goal }, (_, index) => `<span class="${index < count ? "in" : ""}">${icon("home")}</span>`).join("")}</div>
    <div class="split"><div class="stat"><span>Households interested</span><strong>${count} of ${scheme.goal}</strong></div><div class="stat"><span>Indicative pooled cost</span><strong>${money(scheme.cost)}</strong></div><div class="stat"><span>Per home at target</span><strong>${money(scheme.cost / scheme.goal)}</strong></div></div></article>
    <div class="notice"><strong>Pool the work first.</strong> The scheme would need local authority and surveyor approval. A shared funding proposal could follow, with individual consent and affordability checks.</div>
    <div class="panel-foot"><button class="button ${joined ? "plain" : "primary"}" data-action="join">${joined ? "Withdraw demo interest" : "Register demo interest"}</button><p class="small">${joined ? "Interest recorded in this browser session." : "The street and costs are examples. Try opting in to see the interest count change."}</p></div>`;
}

const panels = { twin: twinPanel, plan: planPanel, reward: rewardPanel, protect: stormPanel, street: streetPanel };

function render(focusSelector) {
  context.innerHTML = `<strong>${data.household.role}</strong> · ${data.household.home}<p>${data.household.narrative}</p>`;
  document.querySelectorAll("[data-step]").forEach((element) => {
    if (element.dataset.step === step) element.setAttribute("aria-current", "step");
    else element.removeAttribute("aria-current");
  });
  panel.innerHTML = panels[step]();
  if (step === "twin") showLookup();
  if (step === "plan") showFunding();
  if (focusSelector) panel.querySelector(focusSelector)?.focus({ preventScroll: true });
}

function route(navigate = false) {
  const hash = location.hash.slice(1);
  if (steps.includes(hash)) {
    step = hash;
    render(navigate ? "#step-title" : undefined);
    document.querySelector("#demo").scrollIntoView();
  } else if (hash === "demo") {
    step = "twin";
    render();
  }
}

householdInput.addEventListener("change", () => {
  startHousehold(householdInput.value);
  render();
});
window.addEventListener("hashchange", () => route(true));

panel.addEventListener("submit", (event) => {
  if (event.target.id !== "lookup-form") return;
  event.preventDefault();
  checkPostcode(event.target.elements.postcode.value);
});

panel.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const { action, horizon, warning, term, vm } = button.dataset;
  if (horizon !== undefined) {
    data.horizon = Number(horizon);
    panel.querySelector("#hazards").innerHTML = ratingCards();
    panel.querySelectorAll("[data-horizon]").forEach(control => control.setAttribute("aria-pressed", String(control === button)));
    return;
  }
  if (term !== undefined) {
    data.loanYears = Number(term);
    showLoan(`[data-term="${term}"]`);
    return;
  }
  if (vm !== undefined) {
    data.loanVerifyMonths = Number(vm);
    showLoan(`[data-vm="${vm}"]`);
    return;
  }
  if (warning !== undefined) {
    data.warning = warning;
    data.claim = false;
    render(`[data-warning="${warning || "flood"}"]`);
    return;
  }
  if (action === "example") {
    checkPostcode("HX7 8AD");
    return;
  }
  if (action === "verify") data.verified = !data.verified;
  else if (action === "claim") data.claim = !data.claim;
  else if (action === "landlord") data.landlord = !data.landlord;
  else if (action === "loan") data.loanOpen = !data.loanOpen;
  else if (action === "join") {
    if (data.joined.has(data.scheme)) data.joined.delete(data.scheme);
    else data.joined.add(data.scheme);
  } else return;
  render(`[data-action="${action}"]`);
});

panel.addEventListener("change", (event) => {
  const control = event.target;
  if (control.id === "property-select") {
    const chosen = demoProperties.find(property => property.id === control.value && property.postcode === lookup.postcode);
    data.propertyId = chosen?.id || null;
    data.epc = "";
    resetIllustrativePlan();
    render("#property-select");
    return;
  }
  const measure = control.dataset.measure;
  if (measure) {
    if (control.checked) data.selected.push(measure);
    else data.selected = data.selected.filter(id => id !== measure);
    data.verified = false;
    render(`#${control.id}`);
    return;
  }
  if (control.id === "epc") {
    data.epc = control.value;
    render("#epc");
    return;
  }
  if (control.id === "grant" || control.id === "cashback") {
    data[control.id] = control.checked;
    showFunding();
  }
  if (control.id === "consent" || control.id === "assisted") {
    data[control.id] = control.checked;
    render(`#${control.id}`);
  }
  if (control.id === "scheme") {
    data.scheme = control.value;
    render("#scheme");
  }
});

panel.addEventListener("input", (event) => {
  if (event.target.id !== "savings") return;
  data.savings = Math.min(1_000_000, Math.max(0, Number(event.target.value) || 0));
  showFunding();
});

householdInput.value = "sam";
startHousehold("sam");
render();
route();
// available for any other postcode in the published England dataset.
checkPostcode("HX7 8AD");
