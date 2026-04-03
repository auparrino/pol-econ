#!/usr/bin/env python
"""
Master script to run all provincial economy data scrapers/processors.
Generates:
  - src/data/sipa_employment.json (from CEP XXI/SIPA)
  - src/data/dnap_fiscal.json (from EAIF + TOP)
  - src/data/exports_by_category.json (from INDEC CSV)
  - src/data/exports_by_destination.json (from INDEC CSV)

Usage:
  python scripts/run_provincial_economy.py
  python scripts/run_provincial_economy.py --force  # re-download raw data
"""

import sys
import os
import json
from datetime import datetime

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE, "scripts"))

def main():
    force = "--force" in sys.argv

    if force:
        # Remove cached raw files to force re-download
        raw_dir = os.path.join(BASE, "data", "raw")
        for f in os.listdir(raw_dir) if os.path.exists(raw_dir) else []:
            os.remove(os.path.join(raw_dir, f))
        print("Cleared cached raw files.\n")

    print("=" * 50)
    print("1/3  Processing SIPA employment data...")
    print("=" * 50)
    import process_sipa
    process_sipa.process()

    print()
    print("=" * 50)
    print("2/3  Processing fiscal data (EAIF + TOP)...")
    print("=" * 50)
    import process_fiscal
    process_fiscal.process()

    print()
    print("=" * 50)
    print("3/3  Processing export data (INDEC CSVs)...")
    print("=" * 50)
    import parse_exports
    parse_exports.parse_rubro()
    parse_exports.parse_destinations()

    # Write metadata
    meta = {
        "lastRun": datetime.now().isoformat(),
        "sources": {
            "sipa": "CEP XXI / SIPA - Registered private employment by province x CLAE2",
            "fiscal": "Sec. Hacienda EAIF (1993-2016) + TOP (1984-2024)",
            "exports": "INDEC - Provincial exports by category and destination (1993-2024)",
        },
    }
    meta_path = os.path.join(BASE, "src", "data", "provincial_economy_meta.json")
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"\nMetadata written to {meta_path}")
    print("\nAll done!")


if __name__ == "__main__":
    main()
