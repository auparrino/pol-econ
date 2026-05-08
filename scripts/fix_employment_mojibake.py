#!/usr/bin/env python
"""
Fix mojibake (UTF-8 read as Latin-1, re-encoded as UTF-8) in employment data
files, and strip the derived `public` field from sipa_employment.json so the
panel only ever reads real measurements.
"""

import json
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIPA = os.path.join(BASE, "src", "data", "sipa_employment.json")
DNAP = os.path.join(BASE, "src", "data", "dnap_empleo_provincial.json")


def fix_mojibake(s):
    """Reverse the UTF-8 → Latin-1 → UTF-8 double-encoding."""
    if not isinstance(s, str):
        return s
    try:
        return s.encode("latin-1").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return s


def fix_dnap():
    with open(DNAP, encoding="utf-8") as f:
        d = json.load(f)

    fixed = 0
    for p in d.get("provinces", []):
        new_name = fix_mojibake(p.get("province", ""))
        if new_name != p.get("province"):
            p["province"] = new_name
            fixed += 1

    # Time series keys are also province names
    ts = d.get("timeSeries", {}).get("provinces", {})
    new_ts = {}
    for k, v in ts.items():
        nk = fix_mojibake(k)
        new_ts[nk] = v
        if nk != k:
            fixed += 1
    d["timeSeries"]["provinces"] = new_ts

    with open(DNAP, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
    print(f"DNAP: fixed {fixed} mojibake entries")


def fix_sipa():
    with open(SIPA, encoding="utf-8") as f:
        d = json.load(f)

    fixed = 0
    stripped_public = 0
    for p in d.get("provinces", []):
        new_name = fix_mojibake(p.get("province", ""))
        if new_name != p.get("province"):
            p["province"] = new_name
            fixed += 1
        # Drop derived public — caller should use sipa_pub_priv.json instead.
        # Keep `private` (real, per-establishment) and `sectors` (real, by CLAE2).
        if p.get("publicSource") == "derived":
            for k in ("public", "publicSource", "categories"):
                if k in p:
                    p.pop(k)
                    stripped_public += 1
            # Re-derive total from private only (consumer should not rely on this)
            p["total"] = p.get("private", 0)
        # Time series: drop public/total derived columns, keep only real private
        for entry in p.get("timeSeries", []) or []:
            if "public" in entry:
                entry.pop("public", None)
            if "total" in entry:
                entry.pop("total", None)
        # Fix sector names too (they may contain Spanish chars)
        for sec in p.get("sectors", []) or []:
            sec["name"] = fix_mojibake(sec.get("name", ""))

    # Top-level vintage / source notes
    d["vintage"] = "2023-11"
    d["sourceNote"] = (
        "CEP-XXI / SIPA-AFIP per-provincia (clae2). Por ubicación del establecimiento. "
        "Dataset discontinuado en nov 2023 (último mes disponible). "
        "Solo se conserva el campo `private` y los `sectors`. "
        "Para split público/privado real ver sipa_pub_priv.json."
    )

    with open(SIPA, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
    print(f"SIPA: fixed {fixed} mojibake entries, stripped {stripped_public} derived-public fields")


if __name__ == "__main__":
    fix_dnap()
    fix_sipa()
