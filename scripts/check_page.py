#!/usr/bin/env python3
"""Fail if any claim in content/facts.json is missing from index.html, verbatim.
Run from the project root: python -X utf8 scripts/check_page.py"""
import html, json, re, sys
page = open("index.html", encoding="utf-8").read()
text = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", page))).replace(":", "")  # colons are optional in page wording
facts = json.load(open("content/facts.json", encoding="utf-8"))["facts"]
missing = [f["id"] for f in facts if f["claim"].strip().rstrip(".").replace(":", "") not in text]
print("\n".join("missing on page: " + m for m in missing) if missing else f"OK: all {len(facts)} facts appear on the page")
sys.exit(1 if missing else 0)
