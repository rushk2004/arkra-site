import D from "./data.js";
import { score, ead, epc, bestPlan, funding, applicable } from "./engine.js";
export const measureIds = D.factors
  .filter((f) => f.kind === "measure")
  .map((f) => f.id);
export function baseFlags(home) {
  return Object.fromEntries(
    Object.entries(home.flags || {}).filter(([id]) => !measureIds.includes(id)),
  );
}
export function hasEvidence(entry) {
  return (
    (entry.evidence || []).some((e) =>
      ["invoice", "certificate"].includes(e.kind),
    ) && (entry.evidence || []).some((e) => e.kind === "photo")
  );
}
export function normaliseEntry(entry) {
  const ready = hasEvidence(entry);
  return {
    ...entry,
    status: ready
      ? "verified"
      : entry.status === "verified"
        ? "installed"
        : entry.status,
  };
}
export function passportScores(home, entries = [], scenario = "today") {
  const flags = { ...baseFlags(home) };
  for (const entry of entries)
    if (entry.status === "verified" && hasEvidence(entry))
      flags[entry.measureId] = true;
  return {
    assessed: score(home, scenario),
    verified: score(home, scenario, flags),
    baseline: score(home, scenario, baseFlags(home)),
    flags,
  };
}
export function seededStreet(home) {
  let seed =
    D.model.streetSeed + [...home.id].reduce((s, c) => s + c.charCodeAt(0), 0);
  const rand = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  return Array.from({ length: D.model.streetSize }, (_, i) => {
    const h = structuredClone(home);
    h.id = "street-" + i;
    if (i) {
      h.flags = { trees: rand() < D.model.portfolioTreeProbability };
      h.hazards.riverSea =
        i < D.model.streetSharedHighCount
          ? home.hazards.riverSea
          : rand() < 0.5
            ? "low"
            : "medium";
      h.hazards.surfaceWater = rand() < 0.5 ? home.hazards.surfaceWater : "low";
    }
    return { id: h.id, home: h, score: score(h), yours: i === 0 };
  });
}
let cachedBook;
export function portfolioModel(book) {
  if (!cachedBook || book)
    cachedBook = (book || []).map((home) => {
      const today = score(home),
        future = score(home, "high"),
        ids = future.value >= 60 ? bestPlan(home) : [],
        plan = funding(home, ids),
        flags = {
          ...home.flags,
          ...Object.fromEntries(ids.map((id) => [id, true])),
        };
      return {
        home,
        today,
        future,
        after: score(home, "high", flags),
        ids,
        net: plan.net,
        grants: plan.grants,
        eadBefore: ead(home, "high").value,
        eadAfter: ead(home, "high", flags).value,
        epcBefore: epc(home),
        epcAfter: epc(home, flags),
      };
    });
  return cachedBook;
}
export function portfolioImpact(rows, uptake, verification) {
  const eligible = rows.filter((r) => r.future.value >= 60),
    adopters = new Set(
      eligible.slice(0, Math.round((eligible.length * uptake) / 100)),
    ),
    verified = new Set(
      [...adopters].slice(0, Math.round((adopters.size * verification) / 100)),
    );
  let reduced = 0,
    verifiedReduced = 0,
    moved = 0,
    avoided = 0,
    net = 0,
    grants = 0,
    epcC = 0;
  for (const r of adopters) {
    if (r.after.value < r.future.value) {
      reduced++;
      if (verified.has(r)) verifiedReduced++;
    }
    if (r.after.value < 60) moved++;
    avoided += r.eadBefore - r.eadAfter;
    net += r.net;
    grants += r.grants;
    if (r.epcBefore.pointsToC > 0 && r.epcAfter.pointsToC === 0) epcC++;
  }
  return {
    eligible,
    adopters,
    verified,
    reduced,
    verifiedReduced,
    moved,
    avoided,
    net,
    grants,
    epcC,
  };
}
export function momentMatches(home) {
  const m = home.moments || {};
  return D.moments.filter(
    (row) =>
      ({
        remortgage: m.remortgageMonths <= D.moments[0].threshold,
        buying: !!m.purchase,
        insurance: m.insuranceRenewalMonths <= D.moments[2].threshold,
        claim: !!m.recentFloodClaim,
        warning: !!m.warning,
        epc: m.epcYears > D.moments[5].threshold,
      })[row.id],
  );
}
export function energyPlan(home) {
  return D.measures
    .filter(
      (m) => D.model.sapGains[m.id] && !home.flags[m.id] && applicable(home, m),
    )
    .sort(
      (a, b) =>
        D.model.sapGains[b.id] / b.costCentral -
        D.model.sapGains[a.id] / a.costCentral,
    )
    .slice(0, D.model.maxMeasures)
    .map((m) => m.id);
}
// Apply new evidence-backed work without mutating the original assessment.
export function homeWithVerified(home, entries = []) {
  const flags = { ...home.flags };
  for (const entry of entries)
    if (entry.status === "verified" && hasEvidence(entry))
      flags[entry.measureId] = true;
  return {
    ...home,
    flags,
    sap: epc(home, flags).sap,
    heating: flags.heatPump ? "Air-source heat pump" : home.heating,
  };
}
