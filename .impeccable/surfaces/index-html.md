---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["styles.css","script.js"]
---

# Journey page

Scope: `index.html` (+ `styles.css`, `script.js`, `fonts/`), the whole single-page site. Visitor mode: Experience.

Audience and job: geology classmates, one at a time on a laptop with a mouse, 2–5 minutes each; the instructor grades later from the hosted link. Success: they walk the trail summit → inner core and understand each layer and its heat.

Content: every fact in `content/facts.json`, placed at the stop where it physically belongs (summit, crust/collision, upper mantle 410 km, lower mantle 670–2,900 km, outer core, inner core boundary 5,100 km). Sources only as a Chicago list at the end. No centre depth or temperature (unsourced); the trail ends at the inner-core boundary. Outer core is molten iron-nickel, never "lava".

Interaction: scroll draws the trail; a You-are-here marker rides it with the current stop's sourced depth and temperature; drag the Indian plate into Eurasia to raise the Himalaya; click trail signs to open the rest of a stop's facts; inspect the diamond inclusion at 410 km. Keyboard reaches every sign and control. Reduced motion: static scenes, trail fully drawn.

User pins: dawn sky with low sunset lighting on Everest and snow floating through the air; molten flow in the outer core; dotted trail; layers defined by illustration.

Open: title (placeholder "Summit Trail to the Core"), host.

## Direction contract

Revised 2026-11-03 at the user's request: the user supplied the artifact https://claude.ai/artifact/XxFYjrP5BQnh9WDbeCiDzZ as the visual reference. That replaces the earlier park-trail-map world (backed up in `.impeccable/backup-trail-map/`). User choices: sourced facts only; keep the plate and diamond exhibits AND the dotted trail alongside the new gauge.

THESIS: A descent from a dawn sky into glowing rock. Each layer's own colour fills the screen as you go down; a dotted magma trail runs from Everest's peak down a left lane through every layer, and a fixed depth gauge reports each stop's sourced depth and temperature.

OWN-WORLD: Dawn indigo-to-apricot sky with stars, drifting snow and alpenglow on Everest; layer fields from dark crust strata through oxblood mantle, orange outer core with molten flow, to a white-gold inner core. Bricolage Grotesque display, Source Serif 4 body, IBM Plex Mono for data (all self-hosted in `fonts/`). Viz panels sit on translucent dark glass with hairline borders, magma-orange stats and buttons, dashed boundary strips between layers, and round magma waypoints on the trail.

GAUGE RULE (revised 2026-11-07 at the user's request): the marker and the depth readout move smoothly between the stops' sourced boundaries (8,849 m counting down to 0 m through the Summit, then 0–5,100 km of depth); the temperature and its location note are always the current stop's sourced values, never interpolated. The column (revised 2026-11-08 at the user's request) is a linear slider along the page with one speed for every layer, not a depth scale; it runs from the summit to the inner core boundary, and each band is as tall as its layer is long on the page.

FIRST VIEWPORT: Full-bleed dawn, the title "Journey to the center of the Earth" on the left, Everest centred at the bottom with prayer flags and spindrift, the summit waypoint "8,849 m" on the peak where the trail starts, and the gauge at the upper right (a bottom bar on mobile).

FINISH: unreviewed and undocumented is unfinished. A finish review and DESIGN.md for this world are still to do.
