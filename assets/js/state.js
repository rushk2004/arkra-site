import D from "./data.js";
export const page = document.body.dataset.page;
export const root = page === "overview" ? "./" : "../";
export const params = new URLSearchParams(location.search);
const storageKey = "arkra-product-v2";
export let persistent = true;
let stored = {};
try {
  localStorage.setItem("arkra-test", "1");
  localStorage.removeItem("arkra-test");
  stored = JSON.parse(localStorage.getItem(storageKey) || "{}");
} catch {
  persistent = false;
}
export const state = {
  currentId: "calder",
  ownHomes: {},
  plans: {},
  passports: {},
  interests: {},
  ...stored,
};
const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);
for (const key of ["ownHomes", "plans", "passports", "interests"])
  if (!isObject(state[key])) state[key] = {};
export const homes = () => [
  ...new Map(
    [...D.personas, ...D.realExamples, ...Object.values(state.ownHomes)].map(
      (h) => [h.id, h],
    ),
  ).values(),
];
let own;
try {
  own = JSON.parse(params.get("profile") || "null");
  if (
    (own?.id === "my-home" ||
      D.personas.some((h) => h.id === own?.id) ||
      D.realExamples.some((h) => h.id === own?.id)) &&
    isObject(own.flags) &&
    isObject(own.answerSource) &&
    D.weights.every((w) =>
      ["official", "owner", "assumed"].includes(own.answerSource[w.id]),
    ) &&
    D.weights.every(
      (w) =>
        D.bands.find((b) => b.id === w.id).values[own.hazards?.[w.id]] !==
        undefined,
    ) &&
    typeof own.sap === "number" &&
    own.sap >= 1 &&
    own.sap <= 100
  ) {
    state.ownHomes[own.id] = own;
  } else own = null;
} catch {}
state.currentId = params.get("home") || own?.id || state.currentId;
if (!homes().some((h) => h.id === state.currentId)) state.currentId = "calder";
export function currentHome() {
  return homes().find((h) => h.id === state.currentId) || D.personas[0];
}
// Accept legacy shareable edits while keeping arbitrary fields out of the profile.
try {
  const edits = JSON.parse(params.get("edits") || "null");
  if (edits) {
    const h = structuredClone(currentHome());
    for (const key of ["position", "floorHeight", "era"])
      if (D.factors.some((f) => f.kind === key && f.id === edits[key]))
        h[key] = edits[key];
    if (Number.isFinite(edits.sap) && edits.sap >= 1 && edits.sap <= 100)
      h.sap = edits.sap;
    if (isObject(edits.flags))
      for (const f of D.factors)
        if (typeof edits.flags[f.id] === "boolean")
          h.flags[f.id] = edits.flags[f.id];
    if (Array.isArray(edits.overrides))
      h.overrides = edits.overrides
        .filter(
          (o) =>
            D.bands.find((b) => b.id === o.hazard)?.values[o.band] !==
            undefined,
        )
        .map((o) => ({ ...o, note: String(o.note || "").slice(0, 500) }));
    state.ownHomes[h.id] = h;
  }
} catch {}
if (params.has("plan") || params.has("measures"))
  state.plans[state.currentId] = (
    params.get("plan") ||
    params.get("measures") ||
    ""
  )
    .split(",")
    .filter((id) => D.measures.some((m) => m.id === id));
try {
  if (!persistent && params.has("record"))
    state.passports[state.currentId] = JSON.parse(params.get("record"));
} catch {}
export function save() {
  try {
    if (persistent) localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    persistent = false;
  }
}
export function updateHome(h) {
  state.ownHomes[h.id] = h;
  state.currentId = h.id;
  save();
}
export function planIds() {
  return (state.plans[state.currentId] || []).filter((id) =>
    D.measures.some((m) => m.id === id),
  );
}
export function setPlan(ids) {
  state.plans[state.currentId] = ids;
  save();
}
export function passport() {
  const h = currentHome();
  if (!state.passports[h.id]) {
    const seed = D.passportSeed.find((s) => s.homeId === h.id);
    state.passports[h.id] = {
      id: "ARK-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
      updated: D.model.snapshotDate,
      entries: seed
        ? structuredClone(seed.entries)
        : D.measures
            .filter((m) => h.flags[m.id])
            .map((m) => ({
              measureId: m.id,
              status: "installed",
              date: D.model.snapshotDate,
              cost: m.costCentral,
              installer: "Not recorded",
              evidence: [],
            })),
    };
    save();
  }
  return state.passports[h.id];
}
export function href(path, extra = {}) {
  const h = currentHome(),
    q = new URLSearchParams({ home: h.id });
  const plan = planIds();
  if (plan.length) q.set("plan", plan.join(","));
  if (state.ownHomes[h.id]) q.set("profile", JSON.stringify(h));
  if (!persistent && state.passports[h.id])
    q.set("record", JSON.stringify(state.passports[h.id]));
  if (params.get("present") === "1") q.set("present", "1");
  for (const [key, value] of Object.entries(extra)) q.set(key, value);
  return root + (path === "overview" ? "" : path + "/") + "?" + q.toString();
}
export function navigate(path, extra = {}) {
  location.href = href(path, extra);
}
export function selectPersona(id) {
  state.currentId = id;
  save();
  const path = page === "overview" ? "home" : page === "check" ? "home" : page;
  location.href = href(path);
}
save();
