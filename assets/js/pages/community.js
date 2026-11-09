import D from "../data.js";
import { score } from "../engine.js";
import { seededStreet, homeWithVerified } from "../product-model.js";
import { currentHome, state, save, href, passport } from "../state.js";
import { esc, money, intro, kpi, pill, toast } from "../ui.js";
export function communityPage(main) {
  const h = homeWithVerified(currentHome(), passport().entries),
    street = seededStreet(h),
    shared = street.filter(
      (x) => x.home.hazards.riverSea === h.hazards.riverSea,
    ).length,
    top = [...score(h).rows].sort((a, b) => b.a - a.a)[0];
  function draw() {
    main.innerHTML =
      intro(
        "Some risks are shared. So are the solutions.",
        "Your street, better prepared.",
        `${esc(h.place)} · synthetic neighbours around ${esc(h.household || "your home")}. No real street or household data.`,
        "PILOT CONCEPT",
      ) +
      `<div class="grid three">${kpi("Homes in this synthetic street", street.length, "Seeded, fictional homes · illustrative")}${kpi("Share your river-flood band", `${shared} of ${street.length}`, `Band ${h.hazards.riverSea} · illustrative area inputs`)}${kpi("Main driver for your home", top.name, "A shared plan still needs property-level surveys")}</div><section class="card section"><div class="sectiontitle"><h2>A street is more than one home.</h2><span class="tag">SYNTHETIC STREET · NOT A MAP</span></div><p>${shared} of ${street.length} homes share ${h.hazards.riverSea === "high" ? "a high" : "your " + h.hazards.riverSea} river-flood band. Local action could help people prepare together.</p><svg class="street-svg" viewBox="0 0 1050 335" role="img" aria-label="Fourteen synthetic houses coloured by risk band. Your home is house 1."><rect x="15" y="139" width="1020" height="30" rx="15" fill="var(--paper)"/><path d="M30 154H1020" stroke="var(--line)" stroke-dasharray="10 10"/>${street
        .map((x, i) => {
          const col = i % 7,
            row = Math.floor(i / 7),
            px = col * 148 + 30,
            py = row * 175 + 16;
          return `<g transform="translate(${px},${py})"><path d="M6 48L56 8L106 48V105H6Z" fill="var(--${x.score.band[0].toLowerCase()})" fill-opacity=".2" stroke="var(--${x.score.band[0].toLowerCase()})" stroke-width="${x.yours ? 4 : 2}"/><path d="M43 105V70H68V105" fill="var(--card)"/><text x="56" y="61" text-anchor="middle" class="house-band">${x.score.band[0]}</text><text x="56" y="126" text-anchor="middle" class="chart-label">${x.yours ? "Your home" : "Home " + (i + 1)}</text></g>`;
        })
        .join(
          "",
        )}</svg><div class="actions">${D.model.scoreBands.map(([b, , , name]) => `<span class="pill ${b}">${b} · ${name}</span>`).join("")}</div><small>Scores shown for today. Each house is fictional; no claim is made about a neighbour or a real address. Your full range is on My home.</small></section><section class="section"><div class="sectiontitle"><h2>Practical things to do together.</h2><small>Illustrative pooled costs, not quotations</small></div><div class="grid two">${D.community
        .map((c) => {
          const registered = !!state.interests[h.id + ":" + c.id];
          return `<article class="card community-option"><div class="eyebrow">LED BY ${esc(c.lead)}</div><h2>${esc(c.name)}</h2><p>${esc(c.does)}</p><div class="grid two cost-compare"><div><small>Together · per home</small><strong>${money(c.pooledCost)}</strong></div><div><small>Going alone · per home</small><strong>${money(c.soloCost)}</strong></div></div><div class="lineitem"><small>${c.interested + (registered ? 1 : 0)} demo households interested</small><span class="tag">ILLUSTRATIVE</span></div><button data-interest="${c.id}" class="${registered ? "" : "primary"}" ${registered ? "disabled" : ""}>${registered ? "Interest registered (demo)" : "Register interest (demo) →"}</button><small class="block">No message is sent. Costs depend on surveys, permissions and local funding.</small></article>`;
        })
        .join(
          "",
        )}</div></section><div class="callout section">A community scheme does not automatically change your property’s score. Add suitable installed measures and evidence to your own <a href="${href("passport")}">Home Resilience Passport</a>.</div>`;
    main.querySelectorAll("[data-interest]").forEach(
      (b) =>
        (b.onclick = () => {
          state.interests[h.id + ":" + b.dataset.interest] = true;
          save();
          draw();
          toast(
            "Demo interest recorded on this device. Demo: nothing was sent.",
          );
        }),
    );
  }
  draw();
}
