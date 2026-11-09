import D from "../data.js";
import { score } from "../engine.js";
import { currentHome, updateHome, navigate } from "../state.js";
import { esc, intro, demoForm, bindDemoForms, toast } from "../ui.js";
export function guidedCheck(main) {
  let step = 0;
  const current = currentHome(),
    h = {
      ...structuredClone(current),
      id: "my-home",
      assessedOn: D.model.snapshotDate,
      household: "Your household",
      title: "Your home",
      place: D.model.checkRegions[0].name,
      story: "Your answers, ready for a clearer next step.",
      isDemo: false,
      isReal: false,
      hazards: { ...D.model.unknownHazards },
      answerSource: Object.fromEntries(D.weights.map((w) => [w.id, "assumed"])),
      flags: {},
      overrides: [],
      sap: D.model.checkDefaults.sap,
      value: D.model.checkDefaults.value,
      rebuildCost: D.model.checkDefaults.rebuildCost,
      floorArea: D.model.checkDefaults.floorArea,
      moments: {
        remortgageMonths: 12,
        insuranceRenewalMonths: 6,
        recentFloodClaim: false,
        purchase: false,
        epcYears: 5,
      },
      position: "house",
      floorHeight: "15-30",
      era: "1976-2000",
      heating: "Gas boiler",
      builtAfter2009: false,
    };
  let region = D.model.checkRegions[0].id,
    cracks = false,
    sapUnknown = true,
    coastChoice = "unknown";
  const names = [
    "Your home",
    "Flooding",
    "Ground",
    "Coast",
    "Heat",
    "Work already done",
    "Energy",
  ];
  const option = (name, value, label, selected) =>
    `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`;
  const hazardSelect = (id, label) =>
    `<label class="field">${label}<select data-hazard="${id}"><option value="unknown" ${h.answerSource[id] === "assumed" ? "selected" : ""}>I don’t know</option>${Object.keys(
      D.bands.find((b) => b.id === id).values,
    )
      .map((v) =>
        option(
          id,
          v,
          v,
          h.answerSource[id] === "assumed" ? "unknown" : h.hazards[id],
        ),
      )
      .join("")}</select></label>`;
  const choices = () => [
    `<div class="grid two"><label class="field">Region<select name="region">${D.model.checkRegions.map((r) => option("region", r.id, r.name, region)).join("")}</select></label><label class="field">Home type<select name="position">${[
      ["house", "House"],
      ["ground-flat", "Ground-floor flat"],
      ["mid-flat", "Middle-floor flat"],
      ["top-flat", "Top-floor flat"],
      ["house-basement", "House with a basement"],
    ]
      .map(([v, l]) => option("position", v, l, h.position))
      .join(
        "",
      )}</select></label><label class="field">When was it built?<select name="era">${[
      ["pre1919", "Before 1919"],
      ["1919-1975", "1919–1975"],
      ["1976-2000", "1976–2000"],
      ["post2000", "After 2000"],
    ]
      .map(([v, l]) => option("era", v, l, h.era))
      .join(
        "",
      )}</select></label><label class="field">Door threshold above ground<select name="floorHeight">${[
      ["lt15", "Below 15 cm"],
      ["15-30", "15–30 cm"],
      ["30-60", "30–60 cm"],
      ["gt60", "Above 60 cm"],
    ]
      .map(([v, l]) => option("floorHeight", v, l, h.floorHeight))
      .join(
        "",
      )}</select></label></div><label class="check"><input type="checkbox" name="builtAfter2009" ${h.builtAfter2009 ? "checked" : ""}>Built from 1 January 2009</label><label class="check"><input type="checkbox" name="purchase" ${h.moments.purchase ? "checked" : ""}>I am checking a home I may buy</label>`,
    `<p>River, sea and surface-water flooding can affect a home differently. Check both bands if you know them.</p><a href="https://check-long-term-flood-risk.service.gov.uk/" target="_blank" rel="noopener">Open the official long-term flood risk checker ↗</a><div class="grid two section">${hazardSelect("riverSea", "River & sea flood band")}${hazardSelect("surfaceWater", "Surface-water flood band")}</div><p class="callout">In the live product, public data would fill these in. An unknown answer uses a low band with a wider range.</p>`,
    `<p>Subsidence is ground movement that can affect foundations. A homebuyer environmental report may include a BGS shrink–swell class.</p>${hazardSelect("subsidence", "Subsidence class (A–E)")}<label class="check"><input type="checkbox" data-flag="trees" ${h.flags.trees ? "checked" : ""}>Large trees within 10 m</label><label class="check"><input type="checkbox" name="cracks" ${cracks ? "checked" : ""}>New cracks wider than a coin</label><div class="callout">If you have new or growing cracks, arrange a professional survey. This answer adds a note, not a change to your score.</div>`,
    `<label class="field">Which best describes your area?<select name="coastChoice">${[
      ["unknown", "I don’t know"],
      ["none", "Inland"],
      ["coast", "Coastal, outside an erosion zone"],
      ["zone", "Near an eroding cliff or shore"],
    ]
      .map(([v, l]) => option("coastChoice", v, l, coastChoice))
      .join(
        "",
      )}</select></label><div id="coastal-zone" ${coastChoice === "zone" ? "" : "hidden"}>${hazardSelect("coastal", "Projected erosion zone (if known)")}</div><p class="muted">Unknown means no erosion zone assumed, with a wider uncertainty range. It does not establish that a home is safe.</p>`,
    `<p>Large windows and the top floor can make overheating more likely. Your region sets an illustrative heat band.</p><label class="check"><input type="checkbox" data-flag="glazing" ${h.flags.glazing ? "checked" : ""}>Large south- or west-facing windows</label><label class="check"><input type="checkbox" data-flag="shading" ${h.flags.shading ? "checked" : ""}>External shading or secure night ventilation already fitted</label><label class="check"><input type="checkbox" name="topFloor" ${h.position === "top-flat" ? "checked" : ""}>This is a top-floor flat</label><label class="check"><input type="checkbox" name="unknownHeat" ${h.answerSource.heat === "assumed" ? "checked" : ""}>I don’t know how the home behaves in heat</label><p class="callout">No £ damage is assigned to heat. Comfort and health still matter.</p>`,
    `<p>Tick work already fitted. Your assessment can reflect it, but your passport will ask for evidence before recording a verified reduction.</p><div class="grid two">${D.measures.map((m) => `<label class="check"><input type="checkbox" data-flag="${m.id}" ${h.flags[m.id] ? "checked" : ""}>${m.name}</label>`).join("")}</div>`,
    `<p>SAP is the 1–100 energy score behind an EPC. Energy readiness is shown separately from physical climate risk.</p><a href="https://www.gov.uk/find-energy-certificate" target="_blank" rel="noopener">Find your energy certificate ↗</a><div class="grid two section"><label class="field">SAP score (if known)<input type="number" name="sap" min="1" max="100" value="${h.sap}"></label><label class="field">Or EPC band<select name="epcBand"><option value="">Use SAP above</option>${D.model.epcBands.map(([b, min]) => `<option value="${min}">${b}</option>`).join("")}</select></label></div><label class="check"><input type="checkbox" name="sapUnknown" ${sapUnknown ? "checked" : ""}>I don’t know my EPC or SAP (illustrative default ${D.model.checkDefaults.sap})</label><label class="field">Main heating<select name="heating">${["Gas boiler", "Oil boiler", "LPG boiler", "Electric storage heaters", "Air-source heat pump", "Communal heat network"].map((v) => option("heating", v, v, h.heating)).join("")}</select></label><div class="grid two"><label class="field">Remortgage in (months)<input type="number" name="remortgageMonths" min="0" max="60" value="${h.moments.remortgageMonths}"></label><label class="field">Insurance renewal in (months)<input type="number" name="insuranceRenewalMonths" min="0" max="11" value="${h.moments.insuranceRenewalMonths}"></label></div><label class="check"><input type="checkbox" name="recentFloodClaim" ${h.moments.recentFloodClaim ? "checked" : ""}>Recent flood claim</label>`,
  ];
  function capture() {
    const form = main.querySelector("#check-form");
    if (!form) return;
    const f = new FormData(form);
    for (const key of ["position", "era", "floorHeight", "heating"])
      if (f.has(key)) h[key] = f.get(key);
    if (f.has("region")) {
      region = f.get("region");
      const r = D.model.checkRegions.find((r) => r.id === region);
      h.place = r.name;
      h.hazards.heat = r.heat;
    }
    form.querySelectorAll("[data-hazard]").forEach((el) => {
      const id = el.dataset.hazard;
      h.hazards[id] =
        el.value === "unknown" ? D.model.unknownHazards[id] : el.value;
      h.answerSource[id] = el.value === "unknown" ? "assumed" : "owner";
    });
    form
      .querySelectorAll("[data-flag]")
      .forEach((el) => (h.flags[el.dataset.flag] = el.checked));
    if (step === 0) {
      h.builtAfter2009 = f.has("builtAfter2009");
      h.moments.purchase = f.has("purchase");
    }
    if (step === 2) cracks = f.has("cracks");
    if (step === 3) {
      coastChoice = f.get("coastChoice");
      if (coastChoice !== "zone") {
        h.hazards.coastal = coastChoice === "unknown" ? "none" : coastChoice;
        h.answerSource.coastal =
          coastChoice === "unknown" ? "assumed" : "owner";
      }
    }
    if (step === 4) {
      if (f.has("topFloor")) h.position = "top-flat";
      else if (h.position === "top-flat") h.position = "house";
      h.answerSource.heat = f.has("unknownHeat") ? "assumed" : "owner";
    }
    if (step === 6) {
      sapUnknown = f.has("sapUnknown");
      h.sap = sapUnknown
        ? D.model.checkDefaults.sap
        : Math.max(1, Math.min(100, +(f.get("epcBand") || f.get("sap"))));
      for (const key of ["remortgageMonths", "insuranceRenewalMonths"])
        h.moments[key] = Math.max(0, +f.get(key));
      h.moments.recentFloodClaim = f.has("recentFloodClaim");
      h.sapAssumed = sapUnknown;
    }
    if (cracks)
      h.notes =
        "New cracks reported: arrange a professional survey; no score change.";
    else delete h.notes;
  }
  function draw() {
    main.innerHTML =
      intro(
        "A few answers. A useful next step.",
        "Let’s get to know your home.",
        "In the live product ARKRA fills most of this automatically from public data. You just confirm it.",
        "GUIDED HOME CHECK",
      ) +
      `<div class="check-layout grid"><aside class="card check-steps"><h3>Your home check</h3><ol>${names.map((n, i) => `<li class="${i === step ? "current" : i < step ? "done" : ""}"><span>${i < step ? "✓" : i + 1}</span>${n}</li>`).join("")}</ol><small>You can choose “I don’t know”. We will make the uncertainty visible.</small></aside><section class="card check-card"><div class="check-progress"><span>Step ${step + 1} of ${names.length}</span><strong>${Math.round(((step + 1) / names.length) * 100)}%</strong></div><progress max="7" value="${step + 1}" aria-label="Check progress"></progress><h2 tabindex="-1" id="step-title">${names[step]}</h2><form id="check-form">${choices()[step]}<div class="wizard-actions"><button type="button" id="back" ${step === 0 ? "disabled" : ""}>← Back</button><button class="primary" type="submit">${step === 6 ? "See your home’s outlook" : "Next step →"}</button></div></form><small>Demo: your answers stay in your browser. Nothing is sent.</small></section></div><details class="card assisted section"><summary>I’d rather talk to someone</summary><div class="section">${demoForm("Request a callback")}</div></details>`;
    main.querySelector("#check-form").onsubmit = (e) => {
      e.preventDefault();
      capture();
      if (step < 6) {
        step++;
        draw();
        main.querySelector("#step-title").focus();
      } else {
        updateHome(h);
        navigate("home", { checked: "1" });
      }
    };
    main.querySelector("#back").onclick = () => {
      capture();
      step--;
      draw();
      main.querySelector("#step-title").focus();
    };
    main
      .querySelector('[name="coastChoice"]')
      ?.addEventListener("change", (e) => {
        main.querySelector("#coastal-zone").hidden = e.target.value !== "zone";
      });
    if (step === 6) {
      for (const name of ["sap", "epcBand"])
        main.querySelector(`[name="${name}"]`).addEventListener("input", () => {
          main.querySelector('[name="sapUnknown"]').checked = false;
        });
    }
    bindDemoForms(main);
  }
  draw();
}
