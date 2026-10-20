"""Build src/data/dnap_empleo_provincial.json — provincial public employment (DNAP).

Sources (Mecon, Subsecretaría de Coordinación Fiscal Provincial — "Ocupación y salarios"):
  Landing page: https://www.argentina.gob.ar/economia/sechacienda/coordinacion-fiscal-provincial/ejecucion-presupuestaria-provincial/ocupacion-y-salarios

  1. ocupacion_salarios_2017_2025.xlsx  (revised series, one sheet per year 2017..2025)
     https://www.argentina.gob.ar/sites/default/files/ocupacion_salarios_2017_2025.xlsx
     expected at scripts/raw/dnap/ocupacion_salarios_2017_2025.xlsx (committed, ~90 KB)
     -> snapshot (latest year), national total, and 2017+ time series.
  2. ejec-presupuestaria-ocupacion_salarios_1.xlsx  (older series, 1987..2024)
     https://www.argentina.gob.ar/sites/default/files/ejec-presupuestaria-ocupacion_salarios_1.xlsx
     expected at scripts/raw/dnap/ejec-presupuestaria-ocupacion_salarios_1.xlsx (committed, ~290 KB)
     -> only years before the first year of file 1 (1987-2016). Its 2017-2024 sheets are
        superseded by the revised file (differences < 0.3% in 2024).

Columns per year sheet (both files):
  B=JURISDICCIONES, C=GASTO EN PERSONAL (miles $), D=PLANTA OCUPADA,
  E=GASTO MEDIO MENSUAL ($), F=HABITANTES, G=EMPLEADOS/1000 HAB.
Scope: planta ocupada (cargos, not people) of the provincial APNF, 3 branches; no municipal or
national employment. La Pampa and San Luis: planta per provincial budget (DNAP note).

Usage:
  python scripts/build_dnap_empleo.py [--out PATH] [--xlsx PATH] [--xlsx-historic PATH]
"""
from __future__ import annotations

import argparse
import json
import re
import unicodedata
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "scripts" / "raw" / "dnap"
XLSX = RAW / "ocupacion_salarios_2017_2025.xlsx"
XLSX_HIST = RAW / "ejec-presupuestaria-ocupacion_salarios_1.xlsx"
OUT = ROOT / "src" / "data" / "dnap_empleo_provincial.json"

SOURCE_URL = (
    "https://www.argentina.gob.ar/economia/sechacienda/coordinacion-fiscal-provincial/"
    "ejecucion-presupuestaria-provincial/ocupacion-y-salarios"
)
FILE_URL = "https://www.argentina.gob.ar/sites/default/files/ocupacion_salarios_2017_2025.xlsx"
FILE_URL_HIST = "https://www.argentina.gob.ar/sites/default/files/ejec-presupuestaria-ocupacion_salarios_1.xlsx"

SCOPE = (
    "Planta ocupada (cargos, no personas) de la Administración Pública No Financiera provincial "
    "(rótulo del archivo 2017-2025; el archivo anterior 1987-2024 rotulaba 'Administración Central, "
    "Organismos Descentralizados y Cuentas Especiales' — diferencias 2024 < 0,3%). Incluye los 3 poderes. "
    "No cubre empleo municipal ni nacional. La Pampa y San Luis: planta según Presupuesto provincial (nota DNAP)."
)
SCOPE_DOC = (
    "DAIPEF-DNCFP (2014) 'El Empleo Público en las Provincias Argentinas', nota al pie 2 y §1. "
    "https://www.argentina.gob.ar/sites/default/files/el_empleo_publico_en_las_provincias_argentinas.pdf"
)

# Canonical display names (matches governors.js / ProvincePanel lookups)
NAME_MAP = {
    "g.c.b.a.": "Ciudad de Buenos Aires", "buenos aires": "Buenos Aires", "catamarca": "Catamarca",
    "cordoba": "Córdoba", "corrientes": "Corrientes", "chaco": "Chaco", "chubut": "Chubut",
    "entre rios": "Entre Ríos", "formosa": "Formosa", "jujuy": "Jujuy", "la pampa": "La Pampa",
    "la rioja": "La Rioja", "mendoza": "Mendoza", "misiones": "Misiones", "neuquen": "Neuquén",
    "rio negro": "Río Negro", "salta": "Salta", "san juan": "San Juan", "san luis": "San Luis",
    "santa cruz": "Santa Cruz", "santa fe": "Santa Fe", "santiago del estero": "Santiago del Estero",
    "tucuman": "Tucumán", "tierra del fuego": "Tierra del Fuego",
}


def norm(s: str, legacy: bool = False) -> str:
    """Lowercase, strip footnote marks like (1), (*), (**) and accents.

    legacy=True reproduces the original generator: it strips only the literal tags (*), (**), (***),
    so labels like "LA PAMPA(****)" or "CORDOBA (1)" in a few historic sheets were not matched.
    """
    if legacy:
        s = str(s).strip().lower()
        for tag in ("(*)", "(**)", "(***)"):
            s = s.replace(tag, "")
    else:
        s = re.sub(r"\(\d\)|\(\*+\)", "", str(s)).strip().lower()
    s = unicodedata.normalize("NFD", s)
    return "".join(c for c in s if not unicodedata.combining(c)).strip()


def parse_sheet(ws, legacy=False):
    """Return (province rows, TOTAL row). Rows without PLANTA OCUPADA are skipped."""
    rows, total = [], None
    for r in ws.iter_rows(values_only=True):
        if not r or len(r) < 7 or not isinstance(r[1], str):
            continue
        k = norm(r[1], legacy)
        if k != "total" and k not in NAME_MAP:
            continue
        if r[3] is None:
            print(f"  MISSING {ws.title}: {r[1]!r}")
            continue
        rec = dict(employees=int(round(r[3])), ratio=float(r[6]), population=int(r[5]),
                   spend=float(r[2]), avg=float(r[4]))
        if k == "total":
            total = rec
        else:
            rec["province"] = NAME_MAP[k]
            rows.append(rec)
    return rows, total


def load(path, legacy=False):
    wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
    years = sorted(int(s) for s in wb.sheetnames if s.isdigit())
    return {y: parse_sheet(wb[str(y)], legacy) for y in years}


def snap(r):
    return {"employees": r["employees"], "ratioPer1000": round(r["ratio"], 2), "population": r["population"],
            "personalSpendingThousandsARS": round(r["spend"]), "avgMonthlySalaryARS": round(r["avg"])}


def point(y, r):
    return {"year": y, "employees": r["employees"], "ratio": round(r["ratio"], 2)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--xlsx", type=Path, default=XLSX)
    ap.add_argument("--xlsx-historic", type=Path, default=XLSX_HIST)
    ap.add_argument("--out", type=Path, default=OUT)
    ap.add_argument("--full-history", action="store_true",
                    help="also match footnoted province labels in the 1987-2016 file (adds 9 points "
                         "missing from the published JSON: Córdoba 2000-01, Mendoza 2012/14/15, "
                         "San Luis/La Pampa 2008, Santa Cruz 2001)")
    args = ap.parse_args()

    new = load(args.xlsx)
    first = min(new)
    # Default reproduces the published src/data file (legacy label matching for historic years).
    hist = {y: v for y, v in load(args.xlsx_historic, legacy=not args.full_history).items() if y < first}

    Y = max(new)
    rows, tot = new[Y]
    assert len(rows) == 24, len(rows)
    for r in rows:
        assert abs(r["employees"] / r["population"] * 1000 - r["ratio"]) < 0.02, r
    rows.sort(key=lambda x: x["ratio"])  # slimmest first

    all_years = {**hist, **new}
    national_ts = [point(y, all_years[y][1]) for y in sorted(all_years) if all_years[y][1]]
    prov_ts = {}
    for r in rows:
        p = r["province"]
        prov_ts[p] = [point(y, m) for y in sorted(all_years) for m in all_years[y][0] if m["province"] == p]

    out = {
        "source": "DNAP — Ocupación y gastos salariales provinciales",
        "sourceUrl": SOURCE_URL,
        "fileUrl": FILE_URL,
        "year": Y,
        "scope": SCOPE,
        "scopeDoc": SCOPE_DOC,
        "populationSource": "INDEC — Proyecciones por jurisdicción 2010-2040 (nota del archivo DNAP)",
        "national": snap(tot),
        "provinces": [{"province": r["province"], **snap(r)} for r in rows],
        "timeSeries": {"national": national_ts, "provinces": prov_ts},
        "fileUrlHistoric": f"{FILE_URL_HIST} ({min(hist)}-{max(hist)}; serie {first}-{Y} reemplazada por la versión revisada)",
    }
    args.out.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(rows)} provinces, series {min(all_years)}-{Y} -> {args.out}")
    print(f"National {Y}: {tot['employees']:,} empleados, {tot['ratio']:.2f}/1000")


if __name__ == "__main__":
    main()
