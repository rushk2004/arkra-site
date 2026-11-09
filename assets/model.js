export const sources = {
  flood: "https://www.data.gov.uk/dataset/87b9fa90-86c8-45f1-9211-9496d66b7168/flood-risk-postcode-search-tool-data",
  risk: "https://www.gov.uk/check-long-term-flood-risk",
  epc: "https://www.gov.uk/find-energy-certificate",
  grant: "https://www.gov.uk/apply-boiler-upgrade-scheme/what-you-can-get",
  quote: "https://www.ofgem.gov.uk/environmental-and-social-schemes/boiler-upgrade-scheme-bus/installers",
  cashback: "https://www.lloydsbank.com/mortgages/help-and-guidance/eco-home-hub/eco-home-offers.html",
  floodRe: "https://www.floodre.co.uk/our-future/",
  recovery: "https://www.floodre.co.uk/media/",
  warning: "https://check-for-flooding.service.gov.uk/",
  weather: "https://weather.metoffice.gov.uk/warnings-and-advice/uk-warnings",
};

export const hazards = [
  { id: "flood", name: "Flooding", icon: "wave" },
  { id: "heat", name: "Overheating", icon: "sun" },
  { id: "ground", name: "Subsidence", icon: "ground" },
  { id: "storm", name: "Storm damage", icon: "wind" },
  { id: "coast", name: "Coastal risk", icon: "coast" },
  { id: "drought", name: "Drought", icon: "drop" },
];

export const measures = {
  flood: { title: "Flood doors and raised sockets", icon: "wave", tag: "Flood resilience", cost: 6000, reduction: 2, loss: 250, carbon: null, why: "Reduce water entry and put electrics above likely floodwater. A survey should confirm the protection level." },
  pump: { title: "Air-source heat pump", icon: "bolt", tag: "Low-carbon heating", cost: 13000, reduction: 0, loss: 0, carbon: 1200, why: "Coordinate heating and electrical work in one plan. A heat-loss survey should confirm suitability." },
  shade: { title: "External shading", icon: "sun", tag: "Heat resilience", cost: 1600, reduction: 1, loss: 65, carbon: null, why: "Block direct sunlight before it reaches exposed windows and reduce indoor heat build-up." },
  airbrick: { title: "Flood-resistant airbricks", icon: "grid", tag: "Flood resilience", cost: 450, reduction: 1, loss: 35, carbon: null, why: "Reduce water entry through low vents while keeping everyday ventilation. Ask a surveyor about fit." },
  warning: { title: "Warning and preparation plan", icon: "shield", tag: "Low-cost protection", cost: 0, reduction: 0, loss: 0, carbon: null, why: "Agree who can help, where barriers are kept and which alerts to follow before a warning arrives." },
};

export const households = {
  sam: {
    name: "Sam & Leah", role: "Remortgaging", home: "1930s semi near a river", icon: "home", epc: "D", savings: 3000,
    narrative: "They want to protect their home without finding the full cost of improvements upfront.",
    grades: { flood: [4, 4, 5], heat: [3, 4, 4], ground: [2, 2, 3], storm: [2, 3, 3], coast: null, drought: null },
    options: ["flood", "pump", "shade", "airbrick"], selected: ["flood", "pump"], grant: true, cashback: true, assisted: false, expectedLoss: 520, balance: 190000,
  },
  priya: {
    name: "Priya", role: "Renting", home: "Top-floor flat", icon: "grid", epc: "D", savings: 0,
    narrative: "Her flat overheats in summer. She can show her landlord a costed plan and ask for a review.",
    grades: { flood: [2, 2, 3], heat: [4, 4, 5], ground: null, storm: [2, 2, 3], coast: null, drought: null },
    options: ["shade", "warning"], selected: ["shade"], grant: false, cashback: false, assisted: false, expectedLoss: 190, balance: 0,
  },
  margaret: {
    name: "Margaret", role: "Owns outright", home: "Single-storey home near a river", icon: "heart", epc: "E", savings: 500,
    narrative: "She prefers a phone call and home visit, with affordable measures and a street scheme before borrowing.",
    grades: { flood: [4, 4, 5], heat: [2, 3, 4], ground: [2, 2, 2], storm: [3, 3, 4], coast: null, drought: null },
    options: ["airbrick", "warning", "flood", "shade"], selected: ["airbrick", "warning"], grant: false, cashback: false, assisted: true, expectedLoss: 310, balance: 0,
  },
};

export function planCosts(selected, { grant, cashback, savings }) {
  const total = selected.reduce((sum, id) => sum + measures[id].cost, 0);
  const upfrontGrant = selected.includes("pump") && grant ? 7500 : 0;
  const availableSavings = Math.min(Math.max(0, Number(savings) || 0), total - upfrontGrant);
  const gap = total - upfrontGrant - availableSavings;
  const laterCashback = selected.includes("pump") && cashback ? 2000 : 0;
  return { total, upfrontGrant, availableSavings, gap, laterCashback, afterCashback: Math.max(0, gap - laterCashback) };
}

export function resilienceGrade(household, hazard, horizon, selected = []) {
  const base = household.grades[hazard]?.[horizon];
  if (!base) return null;
  let reduction = 0;
  if (hazard === "flood") reduction = Math.max(0, ...selected.filter(id => ["flood", "airbrick"].includes(id)).map(id => measures[id].reduction));
  if (hazard === "heat" && selected.includes("shade")) reduction = measures.shade.reduction;
  return "ABCDE"[Math.max(1, base - reduction) - 1];
}

function annualRepayment(balance, rate, years) {
  const monthly = rate / 1200;
  return 12 * balance * monthly / (1 - (1 + monthly) ** (-12 * years));
}

export function dividend(household, selected, verified) {
  const before = household.expectedLoss;
  const floodSaving = Math.max(0, ...selected.filter(id => ["flood", "airbrick"].includes(id)).map(id => measures[id].loss));
  const avoided = verified ? Math.min(before, floodSaving + (selected.includes("shade") ? measures.shade.loss : 0)) : 0;
  const eligible = avoided > 0 && household.role !== "Renting";
  const stepDownSaving = household.balance ? Math.floor(annualRepayment(household.balance, 4.5, 25) - annualRepayment(household.balance, 4.4, 25)) : 0;
  const mortgage = eligible && stepDownSaving <= avoided ? stepDownSaving : 0;
  const insurance = eligible ? Math.min(36, avoided - mortgage) : 0;
  const excessReduction = eligible && floodSaving ? 250 : 0;
  return { before, after: before - avoided, avoided, mortgage, insurance, excessReduction, total: mortgage + insurance };
}

export function normalisePostcode(input) {
  const compact = input.toUpperCase().replace(/\s/g, "");
  const match = compact.match(/^([A-Z]{1,2})\d[A-Z\d]?\d[A-Z]{2}$/);
  return match ? { compact, area: match[1], display: compact.slice(0, -3) + " " + compact.slice(-3) } : null;
}

export function postcodeRecord(shard, compact) {
  const prefix = compact + ",";
  const row = shard.split("\n").find(line => line.startsWith(prefix));
  if (!row) return null;
  const [, high, medium, low, groundwater] = row.split(",");
  return { high: Number(high), medium: Number(medium), low: Number(low), groundwater: { P: "Possible", U: "Unlikely" }[groundwater] || "Unknown" };
}
