#!/usr/bin/env python3
"""Fail if any fact lacks a valid source key, has more than one source, or if sources are uncited."""
import json, sys
src = json.load(open("content/sources.json"))["sources"]
facts = json.load(open("content/facts.json"))["facts"]
bad = []
for f in facts:
    if not isinstance(f.get("source"), str) or f["source"] not in src:
        bad.append(f"{f.get('id')}: missing or unknown source (must be exactly one key from sources.json)")
unused = set(src) - {f["source"] for f in facts}
if unused: bad.append(f"sources never cited: {sorted(unused)}")
print("\n".join(bad) if bad else f"OK: {len(facts)} facts, {len(src)} sources")
sys.exit(1 if bad else 0)
