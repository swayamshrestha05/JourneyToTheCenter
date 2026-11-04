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

## Content rules (the core constraint)

- `content/facts.json` (25 claims) + `content/sources.json` (5 Chicago-style sources) are the **only** source of scientific statements. Never write geology facts, numbers, images or quotes from memory; a gap stays a visible gap.
- `content/design.json` is presentation notes only — nothing in it may be shown as a scientific claim.
- Each fact appears on the page as an element with `data-fact="<id>"` whose text matches the `claim` verbatim (trailing period optional, HTML entities/whitespace normalised). `check_page.py` fails if any claim is reworded or removed, so edit the claim in `facts.json` and the page together.
- Sources appear only as a Chicago list at the end of the page.
- No centre-of-Earth depth or temperature (unsourced): the journey ends at the inner-core boundary (5,100 km). The outer core is molten iron-nickel, never "lava".
- Illustrative visuals must never read as measured data.

## Architecture

**Stops drive everything.** Each scroll stop (the hero `header#top` and each `section.layer`) carries `data-stop` plus `data-name`, `data-mode` (Altitude/Depth), `data-depth`, `data-temp`, `data-at`, and `data-from`/`data-to` (km, negative = altitude). `script.js` reads these attributes; there is no JS data model.

- **Depth gauge** (`aside#gauge`): `updateGauge()` finds the stop crossing mid-viewport. The marker position is interpolated between `data-from`/`data-to` on a 0–5,100 km column, but the **displayed numbers are always the stop's sourced strings, never interpolated** (gauge rule from the direction contract). Adding a stop = add a section with these attributes; the gauge picks it up.
- **Trail**: an SVG (`#trail`) built by `buildTrail()` as a Catmull-Rom curve through the trail signs (`.sign` buttons) and the summit anchor in the hero Everest SVG; revealed on scroll via a stroke-dash mask (`#trail-mask`). The `#here` marker rides it. Rebuilt (debounced) on resize.
- **Signs / "more" facts**: each `.sign[data-sign]` toggles its stop's `.more` list (`aria-controls`/`aria-expanded`); extra facts live there collapsed.
- **Exhibits**: the plate-collision SVG (`#plates`, driven by drag or `#plates-range` via `renderPlates(t)`) and the diamond-inclusion inspector (`#diamond-exhibit`).
- **Canvas scenes**: `canvas.fx[data-fx]` elements become `Scene` instances (`snow`, `convection`, `molten`) animated in one shared `loop()`.
- **Reduced motion** (`prefers-reduced-motion`): static scenes and fully drawn trail; keep this working when touching animation code. Keyboard must reach every sign and control.

## Tooling in the folder

- `.claude/` and `.cursor/` contain the **impeccable** design skill and its agents (asset producer, documenter, finish reviewer, manual-edit applier); `.impeccable/` holds its config, decision mocks and review state. Mocks under `.impeccable/mocks/` and `.impeccable/backup-trail-map/` (the superseded park-trail-map design) are not shipping UI — don't edit them as part of the site.
- Outstanding per the direction contract: a finish review and a `DESIGN.md` for the current world.
