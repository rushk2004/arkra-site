import D from "../data.js";
import { score } from "../engine.js";
import { portfolioImpact } from "../product-model.js";
import { getBook } from "./lender.js";
import { root, href } from "../state.js";
import { esc, money, intro, button, kpi, pill, journey, date } from "../ui.js";
export function overview(main) {
  const impact = portfolioImpact(
    getBook(),
    D.model.defaultUptake,
    D.model.defaultVerification,
  );
  main.innerHTML = `<section class="card product-hero"><div class="product-hero-copy"><span class="eyebrow">A BETTER-PREPARED HOME STARTS HERE</span><h1>Your home has a future.<br>Let’s help it get ready.</h1><p>ARKRA shows you how climate change could affect your home, and what to do about it. It turns your home’s flood, ground, coastal, heat and energy risks into a costed, funded plan, then records the work so your lender and insurer can see your home is safer.</p><div class="actions">${button("check", "Check your home →")}${button("home", "See a demo home", "")}</div><div class="hero-trust"><span>✓ Your data stays with you</span><span>✓ Every rating explained</span><span>✓ Practical first steps</span></div></div><div class="product-hero-art"><img src="${root}assets/house.svg?v=3" alt="Illustration of a home with flood protection, external shading and solar panels"><div class="hero-note"><span class="demo-dot"></span>FROM CLIMATE INSIGHT TO A SAFER HOME</div></div></section><section class="journey-section"><div class="sectiontitle"><h2>One connected journey.</h2><small>From your first question to proof of progress.</small></div>${journey()}</section><section class="section"><div class="sectiontitle"><div><div class="eyebrow">SMALL STEPS. A MEASURABLE DIFFERENCE.</div><h2>What action could add up to.</h2></div><a href="${href("lender")}">Explore the lender view →</a></div><div class="grid three">${kpi("Homes reduced in risk", impact.reduced, `At ${D.model.defaultUptake}% uptake · synthetic 1,000-home book`, "featured-kpi")}${kpi("Of which verified", impact.verifiedReduced, `At ${D.model.defaultVerification}% verification · illustrative scenario`)}${kpi("Annual damage avoided", money(impact.avoided), "2050 high emissions · illustrative model")}</div></section><section class="section"><div class="sectiontitle"><div><div class="eyebrow">REAL CONCERNS. FICTIONAL HOMES.</div><h2>A home like yours.</h2></div><small>Choose a household to explore its journey.</small></div><div class="grid three persona-cards">${D.personas
    .slice(0, 6)
    .map((h, i) => {
      const r = score(h);
      return `<a class="card persona-card" href="${root}home/?home=${h.id}"><div class="persona-card-top"><span class="avatar">${esc(
        h.household
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join(""),
      )}</span>${pill(r)}</div><h3>${esc(h.household)}</h3><strong>${esc(h.title)}</strong><small>${esc(h.place)}</small><p>“${esc(h.story)}”</p><span class="persona-cta">See their home <span>→</span></span><small>Illustrative score ${r.value} · likely ${r.low}–${r.high}</small></a>`;
    })
    .join(
      "",
    )}</div></section><section class="section"><div class="sectiontitle"><h2>Why start now?</h2><small>Public sources, with context.</small></div><div class="grid three">${D.facts.map((f) => `<article class="card fact"><span class="eyebrow">${esc(f.label)}</span><div class="metric">${esc(f.value)}</div><h3>${esc(f.title)}</h3><p>${esc(f.text)}</p><a href="${f.source}" target="_blank" rel="noopener">${esc(f.sourceName)} ↗</a></article>`).join("")}</div></section><section class="card section audience"><h2>Built around the people who can make change happen.</h2><div class="grid three"><div><span class="audience-icon">⌂</span><h3>For homeowners</h3><p>Understand the risk, make a practical plan and keep a record you can share.</p></div><div><span class="audience-icon">▥</span><h3>For lenders</h3><p>Support customers at the right moment and count evidence-backed progress.</p></div><div><span class="audience-icon">◇</span><h3>For insurers · future</h3><p>With your consent, see what changed and the evidence behind it.</p></div></div></section><div class="callout section"><strong>Practical first steps, not the perfect expensive retrofit.</strong> Start with affordable improvements that make sense for your home. ARKRA joins risk, cost, funding and evidence in one place.</div>`;
}
export function aboutPage(main) {
  const cols = [
    ["buildingRisk", "Building-specific risk"],
    ["scenarios2050", "2050 scenarios"],
    ["costedPlan", "Costed plan"],
    ["financeLink", "Finance link"],
    ["verifiedRecord", "Verified record"],
    ["lenderView", "Lender view"],
    ["communityView", "Community view"],
  ];
  main.innerHTML =
    intro(
      "Why ARKRA",
      "Join the steps. Close the gap.",
      "Climate risk information is useful when it leads to practical action—and a record people can trust.",
      "TCS SUSTAINATHON 2026",
    ) +
    `<section class="card about-intro"><h2>Better-prepared homes, for decades to come.</h2><p>Homeowners face flooding, heat stress, drought, coastal erosion and subsidence, but the next step is often costly, complicated or inconvenient. Those risks can affect affordability, insurability and the value of a home. Lenders need a way to support change and see which homes have become safer.</p><p>ARKRA shows you how climate change could affect your home, and what to do about it. It turns your home’s flood, ground, coastal, heat and energy risks into a costed, funded plan, then records the work so your lender and insurer can see your home is safer.</p>${journey()}<div class="callout"><strong>Our measure of success:</strong> the number of homes on a lender’s mortgage book whose physical-climate risk has been reduced.</div></section><section class="card section"><h2>How ARKRA compares</h2><p>Risk scores, retrofit guidance and funding already exist. ARKRA’s demonstration joins them into one homeowner journey. A “to check” cell means the source does not establish that capability; it does not mean a competitor lacks it.</p><div class="tablewrap"><table class="competitor-table"><thead><tr><th>Product or service</th>${cols.map(([, n]) => `<th>${n}</th>`).join("")}</tr></thead><tbody>${D.competitors
      .map(
        (r) =>
          `<tr><td><strong>${esc(r.name)}</strong><p>${esc(r.description)}</p></td>${cols
            .map(([key]) => {
              const c = r.cells[key];
              return `<td><details><summary>${esc(c.status)}</summary><p>${esc(c.note)}</p><a href="${/^https?:/.test(c.source) ? c.source : href("how-it-works")}" target="_blank" rel="noopener">Source ↗</a><small>Checked ${date(c.checked)} · ${c.verified ? "source supported" : "team to check"}</small></details></td>`;
            })
            .join("")}</tr>`,
      )
      .join(
        "",
      )}</tbody></table></div><small>ARKRA capabilities are demo behaviours, not a launched or independently validated service.</small></section><section class="section"><div class="sectiontitle"><h2>A focused route to a real product.</h2><span class="tag">PROPOSED ROADMAP</span></div><ol class="roadmap grid three">${[
      [
        "Start with flooding",
        "Pilot in England with Lloyds customers, subject to a partnership and validation.",
      ],
      [
        "Broaden the hazards",
        "Validate flood, heat, ground, drought and coastal modelling.",
      ],
      [
        "Fill data automatically",
        "Use public and appropriately licensed datasets, with homeowner corrections.",
      ],
      [
        "Make evidence useful",
        "With consent, share the passport with insurers and other trusted parties.",
      ],
      [
        "Extend across the UK",
        "Adapt to data and policy in Wales, Scotland and Northern Ireland.",
      ],
      [
        "Work with more partners",
        "Offer the same journey inside other lenders’ and insurers’ apps.",
      ],
    ]
      .map(
        ([t, d], i) =>
          `<li class="card"><span class="stepnum">${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`,
      )
      .join(
        "",
      )}</ol></section><section class="card section"><div class="eyebrow">SUSTAINABLE DEVELOPMENT GOAL 11</div><h2>Resilient homes support resilient communities.</h2><div class="grid two"><article><h3>Target 11.5</h3><p>Reduce disaster impacts and direct economic losses, including from water-related disasters. ARKRA’s illustrative EAD model makes avoided damage visible.</p></article><article><h3>Target 11.b</h3><p>Support climate adaptation, disaster resilience and integrated risk planning. The street concept extends action beyond an individual home.</p></article></div><a href="https://sdgs.un.org/goals/goal11" target="_blank" rel="noopener">UN Sustainable Development Goal 11 ↗</a></section><section class="section"><div class="sectiontitle"><h2>The team behind ARKRA</h2><small>Team to complete before submission.</small></div><div class="grid three">${["Product & homeowner research", "Climate risk & validation", "Engineering & partnerships"].map((role) => `<article class="card team-card"><span class="avatar">+</span><h3>Team member name</h3><p>${role}</p><small>Placeholder · add team details</small></article>`).join("")}</div></section>`;
}
export function methodologyPage(main) {
  main.innerHTML =
    intro(
      "How it works",
      "Every rating has a reason.",
      "See the model, its data and its limits. ARKRA makes assumptions visible so they can be challenged and improved.",
      "TRANSPARENT BY DESIGN",
    ) +
    `<section class="card"><div class="eyebrow">PHYSICAL RISK, SEPARATE FROM ENERGY</div><h2>From area conditions to your home.</h2><p>Each hazard starts with an area band. The model applies a scenario uplift, caps it at 1, and then applies building features and measures. The worst weighted hazard drives most of the result so a severe risk cannot be averaged away.</p><pre>rᵢ = min(1, min(1, hᵢ × upliftᵢ) × buildingᵢ × max(0.40, measuresᵢ))
aᵢ = weightᵢ × rᵢ
score = round(100 × (0.7 × max(aᵢ) + 0.3 × mean(aᵢ)))</pre><p>Assumed hazard answers use ±${D.model.assumedUncertainty} sensitivity; other answers use ±${D.model.uncertainty}, clipped to 0–1. The displayed “likely range” is a sensitivity range, not a calibrated probability interval. Confidence is the number of original hazard answers labelled official, out of five. Demo official labels illustrate the data journey; no sample address was assessed.</p><p>The supplied scenario table requires a cap on h × uplift before building factors. We retain this interpretation because it reproduces every required reference score, including the protected Severn home’s 43 today and 55 in 2050 high. The shorter formula in the brief omits that intermediate cap.</p><p>Measure factors have a combined floor of 0.40 per hazard. Tree management cancels the trees increase; shading also covers night ventilation and is counted once. Drought is represented through future clay-soil movement rather than an invented sixth score.</p></section><div class="grid two section"><section class="card"><h2>What is known, and what is assumed?</h2><p><span class="source-badge official">Official source</span> A band backed by a public dataset or report. Fictional persona labels say “Official source (demo)”.</p><p><span class="source-badge owner">Your answer</span> A homeowner-entered answer or correction. Corrections remain unverified and preserve the original area bands for comparison.</p><p><span class="source-badge assumed">Assumed</span> A default where you chose “I don’t know”. The wider range makes the gap visible.</p><p>Area maps describe the land around a home, rather than the building itself. Building factors are transparent assumptions, not yet calibrated against claims. This pilot uses England as its worked-example geography. All personal data and evidence filenames stay on this device and are never sold.</p></section><section class="card"><h2>Expected annual damage</h2><pre>EAD = annual probability × event damage
    × scenario uplift × building × measures</pre><p>Flood and subsidence use the probabilities and event damage in ead.json. The two flood pathways are added separately; correlation can overstate losses. Costs exclude inflation, deductibles, downtime and maintenance. Avoided damage is a long-run expectation, not a recurring household saving or an insurance quote.</p><p>Heat has a qualitative exposure level and health note, with no £ damage. Coastal erosion uses the zone horizon and whether it falls within a ${D.ead.mortgageYears}-year mortgage term, without calculating a valuation loss. EPC/SAP stays separate from physical risk.</p><p>Plan finance uses the amortisation formula M = P·i / (1 − (1+i)<sup>−n</sup>). Unconfirmed grant eligibility never reduces net cost. Payback excludes energy savings and may exceed a measure’s life.</p></section></div><section class="card section"><h2>How we would validate it</h2><ol><li>Back-test against anonymised insurer claims with an appropriate partner.</li><li>Compare results with commercial scores on a checked sample of homes.</li><li>Ask surveyors and resilience specialists to test the building factors and measure interactions.</li><li>Validate ranges out of sample and assess correlated hazards and future damage assumptions.</li><li>Publish calibration results and any weight changes; preserve the history in each passport.</li></ol><p>The passport only changes its verified score for measures with an invoice or certificate plus a photo. This demo checks file types recorded, not file contents. A live service would require independent evidence review and reassessment.</p><p>The portfolio is a seeded synthetic book, not Lloyds data. Adoption is applied to D/E homes in 2050 high; verification is a separate scenario rate. Moment counts may overlap. Street houses and pooled costs are illustrative, and community interest never sends a message.</p></section><section class="card section"><h2>Official tools & source references</h2><div class="official-links">${[
      [
        "https://check-long-term-flood-risk.service.gov.uk/",
        "Check long-term flood risk",
      ],
      [
        "https://www.gov.uk/find-energy-certificate",
        "Find an energy certificate",
      ],
      ["https://www.bgs.ac.uk/datasets/geosure/", "BGS GeoSure (licensed)"],
      [
        "https://www.gov.uk/check-coastal-erosion-management-in-your-area",
        "Coastal erosion guidance",
      ],
      ["https://www.floodre.co.uk/", "Flood Re"],
      [
        "https://www.gov.uk/apply-boiler-upgrade-scheme",
        "Boiler Upgrade Scheme",
      ],
    ]
      .map(
        ([url, name]) =>
          `<a href="${url}" target="_blank" rel="noopener">${name} ↗</a>`,
      )
      .join(
        "",
      )}</div><small>References only; ARKRA makes no live data calls. Re-check finance terms before 15 November 2026.</small></section><section class="section"><div class="sectiontitle"><h2>The complete assumption register</h2><small>Rendered from the same local JSON used by the engine.</small></div>${Object.entries(
      D,
    )
      .map(([name, data]) => {
        const rows = Array.isArray(data) ? data : [data],
          keys = [...new Set(rows.flatMap((r) => Object.keys(r)))];
        return `<details class="card data-register" ${["weights", "bands"].includes(name) ? "open" : ""}><summary>${esc(name.replace(/([A-Z])/g, " $1"))} <span class="tag">${rows.length} RECORD${rows.length === 1 ? "" : "S"}</span></summary>${!rows.length ? "<p>No real examples yet. The README provides a checked-example template.</p>" : `<div class="tablewrap section"><table class="method-table"><thead><tr>${keys.map((k) => `<th>${esc(k)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${keys.map((k) => `<td>${typeof r[k] === "object" ? `<pre>${esc(JSON.stringify(r[k], null, 2))}</pre>` : esc(r[k] ?? "—")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`}</details>`;
      })
      .join("")}</section>`;
}
