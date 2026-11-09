import D from "../data.js";
import { score } from "../engine.js";
import { currentHome, passport, save, href } from "../state.js";
import {
  baseFlags,
  passportScores,
  normaliseEntry,
  hasEvidence,
} from "../product-model.js";
import {
  esc,
  money,
  date,
  rating,
  pill,
  kpi,
  intro,
  button,
  toast,
  shell,
} from "../ui.js";
export function passportPage(main) {
  const h = currentHome(),
    record = passport();
  function draw() {
    shell();
    const scores = passportScores(h, record.entries),
      verified = record.entries.filter(
        (e) => e.status === "verified" && hasEvidence(e),
      ),
      pending = record.entries.filter((e) => e.status === "installed"),
      base = score({ ...h, overrides: [] }, "today", baseFlags(h));
    const events = [
      {
        label: "Assessment",
        ...base,
        date: h.assessedOn || D.model.snapshotDate,
      },
      ...(h.overrides || []).map((o, i) => ({
        label: "Owner correction",
        ...score(
          { ...h, overrides: h.overrides.slice(0, i + 1) },
          "today",
          baseFlags(h),
        ),
        date: o.date || D.model.snapshotDate,
      })),
      ...record.entries.map((e, i) => {
        const flags = {
          ...baseFlags(h),
          ...Object.fromEntries(
            record.entries
              .slice(0, i + 1)
              .filter((x) => x.status === "verified" && hasEvidence(x))
              .map((x) => [x.measureId, true]),
          ),
        };
        return {
          label: e.status === "verified" ? "Verified (demo)" : e.status,
          ...score(h, "today", flags),
          date: e.date,
        };
      }),
    ];
    const chartPoints = events
      .map(
        (e, i) =>
          `${55 + i * (560 / Math.max(1, events.length - 1))},${170 - e.value * 1.25}`,
      )
      .join(" ");
    main.innerHTML =
      intro(
        "Your home’s record, made useful.",
        "Home Resilience Passport",
        "Like a service history for your home’s climate resilience. You choose who sees your passport.",
        "PRIVATE TO THIS BROWSER",
      ) +
      `<section class="card passport-cover"><div><div class="eyebrow">${esc(h.place)}</div><h2>${esc(h.title)}</h2><p>${esc(h.household || "Your household")} · ${h.isDemo ? "Fictional household" : "Your saved profile"}</p><div class="actions"><span class="tag">${esc(record.id)} · DEMO ID</span><span class="muted">Last updated ${date(record.updated)}</span></div><p class="passport-reduction">Before recorded work: <strong>${base.value} · likely ${base.low}–${base.high}</strong> → verified (demo): <strong>${scores.verified.value} · likely ${scores.verified.low}–${scores.verified.high}</strong></p></div><div class="passport-stamp"><span aria-hidden="true">⌂</span><strong>HOME RESILIENCE<br>PASSPORT</strong></div></section><div class="grid four section">${kpi("Verified score (demo)", `${scores.verified.value}<small> · likely ${scores.verified.low}–${scores.verified.high}</small>`, `${scores.verified.band[0]} · only evidence-backed measures`)}${kpi("Assessed score", `${scores.assessed.value}<small> · likely ${scores.assessed.low}–${scores.assessed.high}</small>`, "Includes fitted work reported in the profile")}${kpi("Verified measures", verified.length, "Invoice or certificate + installation photo")}${kpi("Awaiting evidence", pending.length, "Installed, but no verified reduction yet")}</div><div class="callout section">“Verified (demo)” means this demo has the required file types recorded. It is not an independent inspection or validation of file contents. Planned, booked and installed work does not change the verified score.</div><div class="grid passport-layout section"><section class="card"><h2>Your home’s progress</h2><small>Illustrative score history · y-axis 0–100 · dates below. Corrections update inputs; only verified work changes the measure effect.</small><svg class="history-chart" viewBox="0 0 670 215" role="img" aria-label="Score history ${events.map((e) => e.label + " " + e.value).join(", ")}"><path d="M40 40V175H630" fill="none" stroke="var(--line)"/>${[0, 50, 100].map((v) => `<text x="5" y="${175 - v * 1.25}" class="chart-label">${v}</text><path d="M40 ${170 - v * 1.25}H630" stroke="var(--line)" stroke-dasharray="3 5"/>`).join("")}<polyline points="${chartPoints}" fill="none" stroke="var(--accent)" stroke-width="3"/>${events.map((e, i) => `<circle cx="${55 + i * (560 / Math.max(1, events.length - 1))}" cy="${170 - e.value * 1.25}" r="5" fill="var(--accent)"/><text x="${55 + i * (560 / Math.max(1, events.length - 1))}" y="${155 - e.value * 1.25}" text-anchor="middle" class="chart-caption">${e.value} (${e.low}–${e.high})</text><text x="${55 + i * (560 / Math.max(1, events.length - 1))}" y="200" text-anchor="middle" class="chart-caption">${i === 0 ? "Assessed" : "Step " + i}</text>`).join("")}</svg><ol class="passport-timeline"><li><strong>Assessment recorded</strong><small>${date(h.assessedOn || D.model.snapshotDate)} · ${base.value} · likely ${base.low}–${base.high} before evidence-backed work</small></li>${(h.overrides || []).map((o) => `<li><strong>Owner correction · ${esc(D.weights.find((w) => w.id === o.hazard)?.name)}</strong><p>Band ${esc(o.band)} · ${esc(o.reason)}. ${esc(o.note)}</p><small>Owner-provided, not independently checked.</small></li>`).join("")}${record.entries.map((e, i) => `<li class="${e.status === "verified" ? "complete" : ""}"><strong>${esc(D.measures.find((m) => m.id === e.measureId)?.name)} <span class="status ${e.status}">${e.status === "verified" ? "Verified (demo)" : e.status}</span></strong><small>${date(e.date)} · ${e.status === "verified" ? "Evidence types recorded" : "No verified score change"} · score ${events[i + 1 + (h.overrides?.length || 0)].value}, likely ${events[i + 1 + (h.overrides?.length || 0)].low}–${events[i + 1 + (h.overrides?.length || 0)].high}</small></li>`).join("")}</ol></section><aside class="card share-card"><div class="eyebrow">A RECORD THAT TRAVELS</div><h2>Share on your terms.</h2><p>Bring the summary to a buyer, lender or insurer. No sharing happens automatically.</p><button class="primary full" id="copy-summary">Copy summary</button><button class="full section" id="print-passport">Print passport</button><textarea id="copy-fallback" readonly hidden aria-label="Passport summary for copying"></textarea><small class="block section">You choose who sees your passport. Evidence filenames stay in your browser. No file is uploaded, opened or analysed.</small>${button("plan", "Add to your plan →", "")}</aside></div><section class="card section"><div class="sectiontitle"><h2>Work & evidence</h2><small>${record.entries.length} recorded measures</small></div>${record.entries.length ? record.entries.map((e) => `<article class="passport-entry"><div class="measuretop"><div><h3>${esc(D.measures.find((m) => m.id === e.measureId)?.name || e.measureId)}</h3><span class="status ${e.status}">${e.status === "verified" ? "Verified (demo)" : e.status}</span></div><strong>${money(e.cost)} <small>illustrative</small></strong></div><div class="grid three section"><label class="field">Status<select data-status="${e.measureId}">${D.model.passportStatuses.map((s) => `<option value="${s}" ${e.status === s ? "selected" : ""}>${s === "verified" ? "Verified (demo)" : s[0].toUpperCase() + s.slice(1)}</option>`).join("")}</select></label><label class="field">Date<input type="date" data-date="${e.measureId}" value="${e.date}" required></label><label class="field">Installer<input data-installer="${e.measureId}" value="${esc(e.installer)}" maxlength="100"></label></div><div class="evidence-list">${e.evidence.map((f, i) => `<span class="evidence-file">${esc(f.kind)} · ${esc(f.name)} <button data-remove-evidence="${e.measureId}:${i}" aria-label="Remove ${esc(f.name)}">×</button></span>`).join("") || "<small>No evidence yet. Add an invoice or certificate and an installation photo.</small>"}</div><label class="field section">Add evidence (filenames only)<input type="file" data-evidence="${e.measureId}" accept="image/*,.pdf" multiple></label><small>JPG, PNG and other images are recorded as photos; PDFs as invoices. Change the recorded type below if needed. File contents never leave your browser.</small>${e.evidence.map((f, i) => `<label class="field evidence-kind">Type for ${esc(f.name)}<select data-kind="${e.measureId}:${i}">${["invoice", "photo", "certificate"].map((k) => `<option ${f.kind === k ? "selected" : ""}>${k}</option>`).join("")}</select></label>`).join("")}</article>`).join("") : `<div class="empty-state"><h3>Your record starts with a plan.</h3><p>Save a measure from My plan, then record booking, installation and evidence here.</p>${button("plan", "Build your plan →")}</div>`}</section>`;
    const changed = () => {
      const active = document.activeElement;
      const key = [
        "data-status",
        "data-date",
        "data-installer",
        "data-kind",
        "data-evidence",
      ].find((key) => active?.hasAttribute(key));
      const value = key ? active.getAttribute(key) : null;
      record.updated = D.model.snapshotDate;
      save();
      draw();
      if (key)
        main
          .querySelector(`[${key}="${value}"]`)
          ?.focus({ preventScroll: true });
    };
    main.querySelectorAll("[data-status]").forEach(
      (el) =>
        (el.onchange = () => {
          const e = record.entries.find(
            (e) => e.measureId === el.dataset.status,
          );
          if (el.value === "verified" && !hasEvidence(e)) {
            el.value = e.status;
            toast(
              "Add an invoice or certificate plus a photo before marking this measure Verified (demo).",
            );
            return;
          }
          e.status = el.value;
          changed();
        }),
    );
    main.querySelectorAll("[data-evidence]").forEach(
      (el) =>
        (el.onchange = () => {
          const e = record.entries.find(
            (e) => e.measureId === el.dataset.evidence,
          );
          for (const f of el.files)
            e.evidence.push({
              name: f.name,
              kind: f.type.startsWith("image/") ? "photo" : "invoice",
              addedOn: D.model.snapshotDate,
            });
          Object.assign(e, normaliseEntry(e));
          changed();
          toast("Evidence filenames recorded locally. Demo: nothing was sent.");
        }),
    );
    main.querySelectorAll("[data-kind]").forEach(
      (el) =>
        (el.onchange = () => {
          const [id, i] = el.dataset.kind.split(":"),
            e = record.entries.find((e) => e.measureId === id);
          e.evidence[+i].kind = el.value;
          Object.assign(e, normaliseEntry(e));
          changed();
        }),
    );
    main.querySelectorAll("[data-remove-evidence]").forEach(
      (b) =>
        (b.onclick = () => {
          const [id, i] = b.dataset.removeEvidence.split(":"),
            e = record.entries.find((e) => e.measureId === id);
          e.evidence.splice(+i, 1);
          Object.assign(e, normaliseEntry(e));
          changed();
        }),
    );
    main.querySelectorAll("[data-date]").forEach(
      (el) =>
        (el.onchange = () => {
          if (!el.value) return;
          record.entries.find((e) => e.measureId === el.dataset.date).date =
            el.value;
          changed();
        }),
    );
    main.querySelectorAll("[data-installer]").forEach(
      (el) =>
        (el.onchange = () => {
          record.entries.find(
            (e) => e.measureId === el.dataset.installer,
          ).installer = el.value;
          changed();
        }),
    );
    main.querySelector("#print-passport").onclick = () => window.print();
    main.querySelector("#copy-summary").onclick = async () => {
      const text = `ARKRA Home Resilience Passport · demo\n${h.title} · ${h.place}\n${record.id}\nAssessed: ${scores.assessed.value}, likely ${scores.assessed.low}–${scores.assessed.high}.\nVerified (demo): ${scores.verified.value}, likely ${scores.verified.low}–${scores.verified.high}.\n${record.entries.map((e) => (D.measures.find((m) => m.id === e.measureId)?.name || e.measureId) + ": " + e.status).join("\n")}\nAll figures illustrative; not an assessment, valuation, insurance quote or financial advice. You choose who sees this summary.`;
      try {
        await navigator.clipboard.writeText(text);
        toast("Summary copied. You choose where to share it.");
      } catch {
        const el = main.querySelector("#copy-fallback");
        el.hidden = false;
        el.value = text;
        el.focus();
        el.select();
        toast("Select and copy the summary below.");
      }
    };
  }
  draw();
}
