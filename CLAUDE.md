# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page, scroll-driven geology class website: "Journey to the center of the Earth", descending from the summit of Mount Everest to the inner-core boundary. Plain static HTML/CSS/JS (`index.html`, `styles.css`, `script.js`), no framework, no build step, no package manager. Fonts are self-hosted in `fonts/`. Open `index.html` directly in a browser (or serve the folder with any static server) to view it. Tracked with git (see Git workflow below); deploy host undecided.

`PRODUCT.md` is the product brief; `.impeccable/surfaces/index-html.md` holds the current visual direction contract (dawn sky → layer colours, dotted magma trail, fixed depth gauge). Read both before design changes.

## Checks (run from the project root)

```sh
python -X utf8 scripts/check_facts.py   # every fact has exactly one known source; every source is cited
python -X utf8 scripts/check_page.py    # every claim in facts.json appears verbatim in index.html
```

On Windows the `-X utf8` flag is required (otherwise JSON decoding fails). There are no other tests, linters or builds.

## Git workflow

- Remote: `origin` = github.com/swayamshrestha05/JourneyToTheCenter (private), branch `main`.
- When a feature or change is finished, run both checks above, then make **one local commit** for it with a clear message.
- **Never push.** The user reviews each local commit (`git log origin/main..main`, `git show <hash>`) and pushes to GitHub themselves, or explicitly asks for a push.
- After committing, report the commit hash and a short summary of what it contains.
- `.gitignore` excludes `.claude/`, `.cursor/` (locally installed Impeccable tooling and settings) and Impeccable's local runtime state; keep them out of commits.

## Layout scope: desktop only

- From 2026-11-04 the user wants **only the desktop layout checked and tuned** (the wide-screen styles, `@media (min-width: 1200px)` and the base rules as they render at 1440px).
- **Leave phones and tablets as they are.** Don't edit the `max-width: 999px` / `max-width: 560px` media blocks, don't tune mobile spacing or type, and don't review phone or tablet screenshots, unless the user asks.
- When a desktop change has to touch shared base rules, keep it from visibly changing the phone layout where practical (scope new rules inside `min-width` queries).

## Content rules (the core constraint)

- `content/facts.json` (25 claims) + `content/sources.json` (5 Chicago-style sources) are the **only** source of scientific statements. Never write geology facts, numbers, images or quotes from memory; a gap stays a visible gap.
- `content/design.json` is presentation notes only — nothing in it may be shown as a scientific claim.
- Each fact appears on the page as an element with `data-fact="<id>"` whose text matches the `claim` verbatim (trailing period optional, HTML entities/whitespace normalised). `check_page.py` fails if any claim is reworded or removed, so edit the claim in `facts.json` and the page together.
- Sources appear only as a Chicago list at the end of the page.
- No centre-of-Earth depth or temperature (unsourced): the journey ends at the inner-core boundary (5,100 km). The outer core is molten iron-nickel, never "lava".
- Illustrative visuals must never read as measured data.
- **Photographs** (`images/`) are real, openly licensed pictures (Wikimedia Commons, found with the taste skill's `assets.mjs --to images`, plus the user's own picks such as the Unsplash north-face photo and `everest_hero.jpg`); `images/credits.json` records each one's source and licence, and every photo is credited in the `.credits` line under Sources. Captions say only what the picture shows (taken from its Commons description), never a geology claim that isn't in `facts.json`, and a photo must not pass for something it isn't (e.g. the kimberlite diamond is captioned as not being the exhibit's 420–440 km diamond). No honest photos exist of the lower mantle or core; those layers stay illustrated.

## Architecture

**Stops drive everything.** Each scroll stop (the hero `header#top` and each `section.layer`) carries `data-stop` plus `data-name`, `data-mode` (Altitude/Depth), `data-depth`, `data-temp`, `data-at`, and `data-from`/`data-to` (km, negative = altitude). `script.js` reads these attributes; there is no JS data model.

- **Depth gauge** (`aside#gauge`): `updateGauge()` reads everything at the 55% line of the viewport (the same line the trail's `#here` marker rides on). Behaviour the user asked for on 2026-11-07:
  - The depth readout counts smoothly with the scroll: **8,849 m only at the very top of the page**, counting down from the first pixel of scroll, to **0 m at the bottom of the Summit section**, then switching to **km** (Depth) from the crust down to 5,100 km.
  - The readout **matches the trail signs**: it shows a sign's own label (8,849 m, 0 km, 410 km, 670 km, 2,900 km, 5,100 km) exactly as the `#here` marker passes that sign.
  - How: `depthKeys()` builds keyframes from each sign's `data-km` (keep it equal to the sign's label; the peak sign is pinned to the reading line at scroll 0) and each ranged stop's lower edge at its `data-to` boundary (stops with `data-from` = `data-to` add no key); `depthAt()` interpolates between them.
  - The **temperature and its `data-at` note stay the stop's sourced strings, never interpolated** (no sourced in-between temperatures exist); they switch when a new stop crosses the line.
  - The gauge is also a **scrubber** (2026-11-07): `.g-body` is a `role="slider"`. Dragging or clicking the column scrolls the page, and the keys work too: arrows 2% of the rail, PageUp/PageDown between signs, Home/End.
  - The column is a **linear rail along the page, not a depth scale** (user request, 2026-11-08: same slider speed for every layer). Top = page top (8,849 m), bottom = the 5,100 km sign on the reading line (`railEnd()`). `layoutBands()` sizes each band from its layer's length on the page. Never label the column "to scale". `script.js` is one function scope, so give new handlers names that don't clash with the plates exhibit's `dragging`/`endDrag`.
  - Adding a stop = add a section with these attributes (and a sign with `data-km`); the gauge picks it up.
- **Trail**: an SVG (`#trail`) built by `buildTrail()` as a Catmull-Rom curve through the trail signs (`.sign` buttons) and the summit anchor in the hero Everest SVG; revealed on scroll via a stroke-dash mask (`#trail-mask`). The `#here` marker rides it. Rebuilt (debounced) on resize.
- **Signs / "more" facts**: each `.sign[data-sign]` toggles its stop's `.more` list (`aria-controls`/`aria-expanded`); extra facts live there collapsed.
- **Exhibits**: the plate-collision SVG (`#plates`, driven by drag or `#plates-range` via `renderPlates(t)`) and the diamond-inclusion inspector (`#diamond-exhibit`).
- **Canvas scenes**: `canvas.fx[data-fx]` elements become `Scene` instances (`snow`, `convection`, `molten`) animated in one shared `loop()`.
- **Reduced motion** (`prefers-reduced-motion`): static scenes and fully drawn trail; keep this working when touching animation code. Keyboard must reach every sign and control.

## Tooling in the folder

- `.claude/` and `.cursor/` contain the **impeccable** design skill and its agents (asset producer, documenter, finish reviewer, manual-edit applier); `.impeccable/` holds its config, decision mocks and review state. Mocks under `.impeccable/mocks/` and `.impeccable/backup-trail-map/` (the superseded park-trail-map design) are not shipping UI — don't edit them as part of the site.
- Outstanding per the direction contract: a finish review and a `DESIGN.md` for the current world.
- The **taste skill** (`design-taste-frontend`, installed user-level in `~/.claude/skills/`) has a browser inspector that needs Node 22+. The default Node here is 20, so run it with nvm's Node 26 directly: `"$LOCALAPPDATA/nvm/v26.13.0/node.exe" ~/.claude/skills/design-taste-frontend/scripts/inspect.mjs index.html --out .taste-skill/after`. Its output goes to `.taste-skill/` (gitignored). Many of its FAILs (gradients, glass gauge, monospace data, dashed boundaries) are the skill's house style clashing with the agreed direction contract; the contract wins.
