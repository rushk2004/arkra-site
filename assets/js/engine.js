import D from "./data.js";
export const band = (v) => D.model.scoreBands.find((b) => v <= b[2]);
export function multipliers(home, id, flags = home.flags) {
  let building = 1,
    measure = 1;
  const applied = [];
  for (const f of D.factors) {
    let on = ["position", "era", "floorHeight"].includes(f.kind)
      ? home[f.kind] === f.id
      : flags[f.id];
    if (f.id === "trees" && flags.treeManagement) on = false;
    if (on && f.factors[id]) {
      const v = f.factors[id];
      if (f.kind === "measure") measure *= v;
      else building *= v;
      if (v !== 1) applied.push({ id: f.id, value: v, kind: f.kind });
    }
  }
  return {
    building,
    measure: Math.max(D.model.measureFloor, measure),
    applied,
  };
}
export function score(
  home,
  scenarioId = "today",
  flags = home.flags,
  { official = false, shift = 0, calculateRange = true } = {},
) {
  const scenario =
    D.scenarios.find((s) => s.id === scenarioId) || D.scenarios[0];
  const rows = D.weights.map((w) => {
    const override =
      !official && home.overrides?.find((o) => o.hazard === w.id);
    const code = override?.band || home.hazards[w.id];
    const area = Math.min(
      1,
      Math.max(
        0,
        D.bands.find((b) => b.id === w.id).values[code] +
          (shift && home.answerSource?.[w.id] === "assumed"
            ? Math.sign(shift) * D.model.assumedUncertainty
            : shift),
      ),
    );
    const f = multipliers(home, w.id, flags);
    const r = Math.min(
      1,
      Math.min(1, area * scenario.uplifts[w.id]) * f.building * f.measure,
    );
    return { ...w, ...f, code, area, r, a: w.value * r, corrected: !!override };
  });
  const value = Math.round(
    100 *
      (D.model.worstShare * Math.max(...rows.map((r) => r.a)) +
        (D.model.meanShare * rows.reduce((s, r) => s + r.a, 0)) / rows.length),
  );
  const result = {
    value,
    band: band(value),
    rows,
    scenarioId,
    confidence: D.weights.filter(
      (w) =>
        home.answerSource?.[w.id] === "official" &&
        !home.overrides?.some((o) => o.hazard === w.id),
    ).length,
  };
  if (!shift && calculateRange) {
    result.low = score(home, scenarioId, flags, {
      official,
      shift: -D.model.uncertainty,
    }).value;
    result.high = score(home, scenarioId, flags, {
      official,
      shift: D.model.uncertainty,
    }).value;
    result.future = score(home, "high", flags, {
      official,
      calculateRange: false,
    }).value;
    result.futureLow = score(home, "high", flags, {
      official,
      shift: -D.model.uncertainty,
    }).value;
    result.futureHigh = score(home, "high", flags, {
      official,
      shift: D.model.uncertainty,
    }).value;
  }
  return result;
}
export function explain(result) {
  const rows = [...result.rows].sort((a, b) => b.a - a.a),
    top = rows[0];
  return [
    `${top.name} is the main driver (area band: ${top.code}).`,
    ...(rows[1].a >= 0.25
      ? [`${rows[1].name} is the next largest driver.`]
      : []),
    `For ${top.name.toLowerCase()}, building features ${top.building >= 1 ? "increase" : "reduce"} exposure by ${Math.round(Math.abs(top.building - 1) * 100)}%; measures reduce it by ${Math.round((1 - top.measure) * 100)}%.`,
    ...(result.future !== undefined
      ? [
          `The score in 2050 high is ${result.future} (range ${result.futureLow}–${result.futureHigh}), a change of ${result.future - result.value} points from this scenario.`,
        ]
      : []),
  ];
}
export function epc(home, flags = home.flags) {
  const sap = Math.min(
      100,
      home.sap +
        Object.entries(D.model.sapGains).reduce(
          (s, [id, g]) => s + (flags[id] && !home.flags[id] ? g : 0),
          0,
        ),
    ),
    b = D.model.epcBands.find((b) => sap >= b[1]);
  return {
    band: b[0],
    sap,
    pointsToC: Math.max(0, D.model.epcBands[2][1] - sap),
    bandsToC: Math.max(0, D.model.epcBands.indexOf(b) - 2),
    fossil:
      !flags.heatPump &&
      ["Gas boiler", "Oil boiler", "LPG boiler"].includes(home.heating),
  };
}
export function ead(home, scenarioId = "today", flags = home.flags) {
  const r = score(home, scenarioId, flags, { calculateRange: false }),
    s = D.scenarios.find((s) => s.id === scenarioId);
  const parts = r.rows
    .filter((x) => D.ead.probabilities[x.id])
    .map((x) => ({
      id: x.id,
      value:
        D.ead.probabilities[x.id][x.code] *
        D.ead.damage[x.id] *
        s.uplifts[x.id] *
        x.building *
        x.measure,
    }));
  const years =
    D.ead.coastalYears[r.rows.find((x) => x.id === "coastal").code] || null;
  return {
    value: parts.reduce((s, p) => s + p.value, 0),
    parts,
    coastalYears: years,
    valueShareAtRisk: years && years <= D.ead.mortgageYears ? 1 : 0,
    heat: ["low", "moderate", "high", "severe"][
      D.model.heatThresholds.filter(
        (t) => r.rows.find((x) => x.id === "heat").r >= t,
      ).length
    ],
  };
}
export function repayment(principal, apr, years) {
  const n = years * 12,
    i = apr / 1200;
  return i ? (principal * i) / (1 - (1 + i) ** -n) : principal / n;
}
export function applicable(home, m) {
  home = {
    ...home,
    hazards: {
      ...home.hazards,
      ...Object.fromEntries(
        (home.overrides || []).map((o) => [o.hazard, o.band]),
      ),
    },
  };
  if (home.flags[m.id]) return false;
  const flood =
    home.hazards.riverSea === "high" ||
    home.hazards.riverSea === "medium" ||
    home.hazards.surfaceWater === "high" ||
    home.hazards.surfaceWater === "medium";
  return {
    flood: flood && !["mid-flat", "top-flat"].includes(home.position),
    trees: !!home.flags.trees,
    clay: ["C", "D", "E"].includes(home.hazards.subsidence),
    heat: score(home).rows.find((r) => r.id === "heat").r >= 0.25,
    fossil: epc(home).fossil,
    house: !home.position.includes("flat"),
    epc: home.sap < 69,
  }[m.appliesWhen];
}
export function bestPlan(home, mode = "value", eligibility = []) {
  let flags = { ...home.flags },
    selected = [],
    cost = 0;
  for (let j = 0; j < D.model.maxMeasures; j++) {
    const options = D.measures
      .filter(
        (m) =>
          applicable(home, m) &&
          !selected.includes(m.id) &&
          funding(home, [...selected, m.id], eligibility).net <=
            D.model.maxPlanCost,
      )
      .map((m) => ({
        ...m,
        gain:
          mode === "score"
            ? score(home, "today", flags).value -
              score(home, "today", { ...flags, [m.id]: true }).value
            : (ead(home, "today", flags).value -
                ead(home, "today", { ...flags, [m.id]: true }).value) /
              Math.max(
                1,
                funding(home, [...selected, m.id], eligibility).net -
                  funding(home, selected, eligibility).net,
              ),
      }))
      .sort((a, b) => b.gain - a.gain);
    if (!options.length || options[0].gain <= 0) break;
    const m = options[0];
    selected.push(m.id);
    cost = funding(home, selected, eligibility).net;
    flags[m.id] = true;
  }
  return selected;
}
export function portfolio(seed = D.model.portfolioSeed) {
  let state = seed >>> 0;
  const rand = () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const pick = (a) => a[Math.floor(rand() * a.length)];
  return Array.from({ length: D.model.portfolioSize }, (_, i) => {
    const base = structuredClone(pick(D.samples));
    base.id = "synthetic-" + i;
    base.hazards.riverSea = pick(["very-low", "low", "medium", "high"]);
    base.hazards.surfaceWater = pick(["very-low", "low", "medium", "high"]);
    base.hazards.subsidence = pick(["A", "B", "C", "D", "E"]);
    base.flags = {
      trees: rand() < D.model.portfolioTreeProbability,
      glazing: rand() < D.model.portfolioGlazingProbability,
    };
    const [min, max] = D.model.regionValues[base.place];
    base.value = Math.round((min + (max - min) * rand()) / 1000) * 1000;
    base.ltv = D.model.ltvMin + rand() * (D.model.ltvMax - D.model.ltvMin);
    base.sap = Math.round(D.model.sapMin + rand() * D.model.sapSpread);
    base.moments = {
      remortgageMonths: Math.floor(rand() * (D.model.remortgageMax + 1)),
      insuranceRenewalMonths: Math.floor(rand() * (D.model.insuranceMax + 1)),
      recentFloodClaim: rand() < D.model.claimProbability,
    };
    return base;
  });
}

export function funding(home, ids, eligibility = []) {
  const confirmed = new Set(eligibility),
    measures = D.measures.filter(
      (m) => ids.includes(m.id) && applicable(home, m),
    ),
    cost = measures.reduce((s, m) => s + m.costCentral, 0),
    lines = [];
  let remaining = cost;
  const add = (name, amount, cap = remaining) => {
    const v = Math.min(remaining, amount, cap);
    if (v > 0) {
      lines.push([name, v]);
      remaining -= v;
    }
  };
  if (confirmed.has("bus") && ids.includes("heatPump") && epc(home).fossil)
    add(
      "Boiler Upgrade Scheme",
      confirmed.has("offgrid") &&
        ["Oil boiler", "LPG boiler"].includes(home.heating)
        ? D.finance[0].oilLpgAmount
        : D.finance[0].amount,
    );
  if (confirmed.has("halifax") && confirmed.has("compatible")) {
    const reward = measures.some((m) => m.id === "heatPump")
      ? D.finance[1].amount
      : measures.some((m) => m.id === "solarBattery")
        ? D.finance[1].solarAmount
        : measures.some((m) => D.finance[1].applies_to.includes(m.id))
          ? D.finance[1].otherAmount
          : 0;
    add(
      "Halifax reward · check current terms",
      reward,
      measures
        .filter((m) => D.finance[1].applies_to.includes(m.id))
        .reduce((s, m) => s + m.costCentral, 0),
    );
  }
  if (confirmed.has("bbb"))
    add(
      "Conditional insurer support after claim",
      D.finance[2].amount,
      measures
        .filter((m) => m.hazards.includes("riverSea"))
        .reduce((s, m) => s + m.costCentral, 0),
    );
  return { cost, grants: cost - remaining, net: remaining, lines, measures };
}
