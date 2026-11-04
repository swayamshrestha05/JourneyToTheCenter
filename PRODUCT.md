# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Plain static HTML, CSS and JavaScript. No framework or build step. Deploy target: undecided.

## Users
The people evaluating a geology class project: the instructor and classmates. The assignment sets no specific rules, format or deadline.

## Product Purpose
An interactive scroll-down website for a geology class that takes the visitor on a journey from the summit of Mount Everest down to Earth's core. Success means the visitor comes away understanding the geology along that descent, grounded in the project's information outline.

Title: undecided for this build.

## Positioning
Scrolling is the descent: the page moves continuously downward from the highest point on the surface to the center of the planet, so the reader's position on the page stands for their position in the Earth.

## Operating Context
- Viewed in a web browser as part of a class project.
- The information outline in `content/` is the source of truth for every claim on the page.
- `python -X utf8 scripts/check_facts.py` validates that every fact has exactly one known source and every source is cited. On Windows the `-X utf8` flag is required: without it the script fails to decode the JSON.

## Capabilities and Constraints
- Single scrolling page, top (Everest summit) to bottom (core).
- Content comes from the outline, not from memory. Topics in the outline, in order: Mount Everest; Formation of the Himalayas; Plate tectonics and mantle convection; Earth's layers, structure, composition and minerals; Temperature and heat sources.
- Open: how outline topics map to on-page sections; whether and how citations appear on the page; deploy host.

## Evidence on Hand
- `content/facts.json`: 25 sourced claims, each tagged with a section, kind and one source key.
- `content/sources.json`: five sources (Guerrero et al. 2025, Guo et al. 2017, Huang 2025, Scharping 2025, Turner et al. 2013) with Chicago-style citations.
- `content/design.json`: presentation notes (planned animations and gauges). Its own note says nothing in it is a sourced fact.
- Copied on 2026-11-03 from the earlier build at `C:\Users\swaya\Desktop\ClaudeCodeTest`, which this project is a fresh rebuild of. That build's code and product record were deliberately not carried over.
- The user will add further text, images or audio to this folder later. None exists yet; do not fabricate facts, figures, images or quotes presented as real.

## Product Principles
1. The outline is the truth: every scientific statement traces to a fact in `content/facts.json`; a gap stays a visible gap, not an invented fact.
2. The descent is the explanation: the order of the journey, surface to core, carries the teaching.
3. Visual effects are not data: anything illustrative is never presented as a measured value.
