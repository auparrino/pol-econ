#!/usr/bin/env python
"""
Provincial fiscal data (APNF, Esquema Ahorro-Inversión-Financiamiento) -> dashboard data.

Generates, from ONE source workbook, three files in src/data/:
  - dnap_fiscal.json   latest-year snapshot per province + full 2005-2025 time series
  - fiscalSeries.json  per-province annual series used by FiscalTriptych / useEconomyData
  - fiscalData.js      rounded "transferencias_pct / recursos_propios_pct" table (2025)

Input
-----
  serie_aif-apnf-2025.xlsx  — Ministerio de Economía, Subsecretaría de Coordinación Fiscal
  Provincial (DNAP). One sheet per jurisdiction ("Ciudad", "Santiago del  Estero" with double
  space, ...), 2005-2025 in millones de $ corrientes (devengado; 2025 = ejecución provisoria
  IV trim.).
    Official URL: https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx
    Landing page: https://www.argentina.gob.ar/economia/sechacienda/coordinacion-fiscal-provincial
    Expected location: scripts/raw/fiscal/serie_aif-apnf-2025.xlsx (committed, ~0.5 MB).
    Pass --download to (re)fetch it from the official URL.
  The previous edition (serie_aif-apnf-2024_1.xlsx, 2005-2024,
  https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2024_1.xlsx) is NOT used: the
  2025 edition contains the same 2005-2024 history plus 2025.

Formula (audit oct-2026)
------------------------
  dependency = (Tributarios de Origen Nacional + Transferencias Corrientes
                + Transferencias de Capital) / VI. Ingresos Totales (corrientes + capital) × 100
  = 100 − "Autonomía Fiscal" (Ingresos Propios / Ingresos Totales) published by DNAP in
  "Indicadores AIF cierre 2025" (indicadores_aif_2025_0.pdf). The script asserts that match
  (±0.1 pp) for all 24 jurisdictions using the DNAP_AUTONOMIA table below.
  The old narrow ratio (Trib. Origen Nacional / (Trib. Prov. + Regalías + Otros No Trib. +
  Trib. Origen Nacional)) is kept as `dependencyTax`.

La Pampa: its 2025 execution is blank in the series, so dnap_fiscal.json / fiscalSeries.json use
its latest available year (2024). fiscalData.js instead uses DNAP's 2025 indicator (autonomía
45.9% -> 54%).

Usage
-----
  python scripts/process_fiscal.py                 # writes src/data/*
  python scripts/process_fiscal.py --out-dir /tmp/x  # write elsewhere (for diffing)
"""

import argparse
import json
import os
import urllib.request

import openpyxl

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE, "scripts", "raw", "fiscal")
OUT_DIR = os.path.join(BASE, "src", "data")

APNF_FILE = "serie_aif-apnf-2025.xlsx"
APNF_URL = "https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx"
INDICADORES_URL = "https://www.argentina.gob.ar/sites/default/files/indicadores_aif_2025_0.pdf"

# fiscalSeries.json "version" (data vintage). Bump when the source workbook is refreshed.
SERIES_VERSION = "2026-10-20"

# Province (canonical, dnap_fiscal.json order) -> sheet name in the workbook
SHEET_MAP = {
    "Buenos Aires": "Buenos Aires",
    "Ciudad de Buenos Aires": "Ciudad",
    "Catamarca": "Catamarca",
    "Córdoba": "Córdoba",
    "Corrientes": "Corrientes",
    "Chaco": "Chaco",
    "Chubut": "Chubut",
    "Entre Ríos": "Entre Ríos",
    "Formosa": "Formosa",
    "Jujuy": "Jujuy",
    "La Pampa": "La Pampa",
    "La Rioja": "La Rioja",
    "Mendoza": "Mendoza",
    "Misiones": "Misiones",
    "Neuquén": "Neuquén",
    "Río Negro": "Río Negro",
    "Salta": "Salta",
    "San Juan": "San Juan",
    "San Luis": "San Luis",
    "Santa Cruz": "Santa Cruz",
    "Santa Fe": "Santa Fe",
    "Santiago del Estero": "Santiago del  Estero",  # double space in sheet name
    "Tucumán": "Tucumán",
    "Tierra del Fuego": "Tierra del Fuego",
}

# fiscalSeries.json / fiscalData.js order
ALL_PROVINCES = [
    "Buenos Aires", "Ciudad de Buenos Aires", "Catamarca", "Chaco", "Chubut",
    "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa",
    "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta",
    "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero",
    "Tierra del Fuego", "Tucumán",
]

# DNAP "Indicadores de Ejecución Presupuestaria Cierre 2025" (indicadores_aif_2025_0.pdf),
# column "Autonomía Fiscal" (%), [2024, 2025]. Used as cross-check and for La Pampa 2025.
DNAP_AUTONOMIA = {
    "Ciudad de Buenos Aires": (84.2, 81.9), "Buenos Aires": (59.2, 57.7),
    "Catamarca": (18.0, 18.0), "Córdoba": (53.2, 54.8), "Corrientes": (27.1, 28.6),
    "Chaco": (26.0, 26.7), "Chubut": (65.5, 65.0), "Entre Ríos": (38.6, 40.3),
    "Formosa": (15.7, 25.1), "Jujuy": (24.9, 23.7), "La Pampa": (45.5, 45.9),
    "La Rioja": (12.9, 14.0), "Mendoza": (45.8, 46.1), "Misiones": (46.3, 44.2),
    "Neuquén": (84.7, 85.5), "Río Negro": (36.0, 40.7), "Salta": (31.8, 29.0),
    "San Juan": (24.8, 24.3), "San Luis": (24.6, 25.8), "Santa Cruz": (59.7, 60.3),
    "Santa Fe": (47.6, 50.3), "Santiago del Estero": (14.5, 34.0), "Tucumán": (28.9, 30.8),
    "Tierra del Fuego": (49.1, 48.4),
}

# Line items, matched by case-insensitive substring within each section of the sheet.
SECTION_ITEMS = {
    "IC": {  # I. Ingresos corrientes
        "De Orígen Provincial": "own_taxes",
        "De Orígen Nacional": "origen_nacional",
        "Distribución Secundaria Neta": "copart_neta",
        "Ley de Financiamiento Educativo": "fin_educ",
        "Otros de Origen Nacional": "otros_origen_nac",
        "Contribuciones a la Seguridad": "seg_social",
        "Regalías": "royalties",
        "Otros No Tributarios": "other_nontax",
        "Vta.Bienes": "sales",
        "Rentas de la Propiedad": "rentas",
        "Transferencias Corrientes": "transf_corr",
    },
    "GC": {"Personal": "personnel"},  # II. Gastos corrientes
    "IK": {  # IV. Ingresos de capital
        "Recursos Propios de Capital": "rec_propios_cap",
        "Transferencias de Capital": "transf_cap",
        "Disminución": "dism_inv_fin",
    },
}
HEADINGS = [  # (prefix, section, key)
    ("I. INGRESOS CORRIENTES", "IC", "ingresos_corrientes"),
    ("II. GASTOS CORRIENTES", "GC", "gastos_corrientes"),
    ("IV. INGRESOS DE CAPITAL", "IK", "ingresos_capital"),
    ("V. GASTOS DE CAPITAL", "GK", "gastos_capital"),
    ("VI. INGRESOS TOTALES", None, "ingresos_totales"),
    ("VII. GASTOS TOTALES", None, "gastos_totales"),
    ("VIII. RESULTADO FINANCIERO", "KEEP", "resultado_financiero"),
    ("IX. RESULTADO PRIMARIO", "KEEP", "resultado_primario"),
]


def download(url, dest):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    print(f"  Downloading {url} ...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp, open(dest, "wb") as f:
        f.write(resp.read())


def parse_workbook(path):
    """{sheet: {key: {year: value}}}. First occurrence of each key wins."""
    wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
    res = {}
    for sn in wb.sheetnames:
        rows = list(wb[sn].iter_rows(values_only=True))
        hdr = next(i for i, r in enumerate(rows) if r[0] and "CONCEPTO" in str(r[0]).upper())
        years = [(j, int(v)) for j, v in enumerate(rows[hdr]) if isinstance(v, (int, float)) and v > 1990]
        sec, d = None, {}
        for r in rows[hdr + 1:]:
            lab = str(r[0] or "").strip()
            if not lab:
                continue
            up = lab.upper()
            key = None
            for prefix, s, k in HEADINGS:
                if up.startswith(prefix):
                    if s != "KEEP":
                        sec = s
                    key = k
                    break
            if key is None:
                for pat, k in SECTION_ITEMS.get(sec, {}).items():
                    if pat.lower() in lab.lower():
                        key = k
                        break
            if key is None or key in d:
                continue
            d[key] = {y: (float(r[j]) if isinstance(r[j], (int, float)) else 0.0) for j, y in years}
        res[sn] = d
    return res


def g(d, k, y):
    return d.get(k, {}).get(y, 0.0)


def year_calc(d, y):
    it = g(d, "ingresos_totales", y)
    auto = g(d, "origen_nacional", y)
    nonauto = g(d, "transf_corr", y) + g(d, "transf_cap", y)
    nat = auto + nonauto
    taxbase = g(d, "own_taxes", y) + g(d, "royalties", y) + g(d, "other_nontax", y) + auto
    return dict(it=it, auto=auto, nonauto=nonauto, nat=nat, own=it - nat, dep=nat / it * 100,
                deptax=auto / taxbase * 100 if taxbase else None)


def r1(v):
    return round(v, 1)


SOURCE = ("Mecon – Subsecretaría de Coordinación Fiscal Provincial (DNAP), serie_aif-apnf-2025.xlsx: "
          "Esquema Ahorro-Inversión-Financiamiento, Administración Pública No Financiera, 2005-2025 "
          "(2025 = ejecución provisoria IV trim.). " + APNF_URL)
FORMULA = ("Dependencia = Recursos de origen nacional / Ingresos Totales (I+IV), donde Recursos de origen "
           "nacional = Tributarios de Origen Nacional (coparticipación Ley 23.548 + Financiamiento Educativo "
           "+ leyes especiales) + Transferencias Corrientes + Transferencias de Capital recibidas. Equivale a "
           "100 − 'Autonomía Fiscal' (Ingresos Propios / Ingresos Totales) publicada por DNAP en Indicadores "
           "AIF cierre 2025 (verificado: coincide en las 24 jurisdicciones).")
FIELDS = {
    "ownTaxes": "Tributarios de Origen Provincial (IIBB, Inmobiliario, Sellos, Automotor)",
    "royalties": "Regalías", "otherNonTax": "Otros No Tributarios",
    "socialSecurity": "Contribuciones a la Seguridad Social (cajas provinciales)",
    "ownTotal": "Ingresos propios = Ingresos Totales − nationalTransfers (incluye tributos provinciales, regalías, otros no tributarios, contribuciones a la seguridad social, venta de bienes y servicios, rentas de la propiedad, recursos propios de capital)",
    "nationalTransfers": "Recursos de origen nacional = automaticTransfers + nonAutomaticTransfers",
    "coparticipation": "= automaticTransfers (Tributarios de Origen Nacional: coparticipación neta + Fin. Educativo + otros de origen nacional/leyes especiales). Se mantiene el nombre por compatibilidad con la UI (nationalTransfers − coparticipation = no automáticas)",
    "coparticipationNet": "Distribución Secundaria Neta Ley 23.548 (neta de Ley 26.075)",
    "nonAutomaticTransfers": "Transferencias Corrientes + Transferencias de Capital recibidas (no automáticas/discrecionales: ATN, convenios, obras, fondos compensadores)",
    "totalRevenue": "VI. Ingresos Totales (I+IV)",
    "dependency": "nationalTransfers / totalRevenue × 100",
    "dependencyTax": "Fórmula anterior (ratio estrecho): Tributarios de Origen Nacional / (Trib. Origen Provincial + Regalías + Otros No Trib. + Trib. Origen Nacional) × 100",
    "totalExpenditure": "VII. Gastos Totales (II+V)", "financialResult": "VIII. Resultado Financiero (VI−VII)",
    "personnel": "Gasto en Personal",
}
LA_PAMPA_NOTE = ("Serie APNF 2025 sin datos de La Pampa (ejecución 2025 no publicada en la serie); se usa 2024. "
                 "DNAP Indicadores cierre 2025: Autonomía Fiscal 45,9% (dependencia 54,1%).")
SERIES_METHODOLOGY = (
    "Serie anual por jurisdicción 2005-2025 desde Mecon DNAP serie_aif-apnf-2025.xlsx (APNF, devengado; "
    "2025 provisorio; La Pampa sin 2025). Millones de pesos corrientes (no deflactados). recursos_propios = "
    "Ingresos Totales − recursos de origen nacional; transferencias_automaticas = Tributarios de Origen "
    "Nacional (coparticipación + Fin. Educativo + leyes especiales); transferencias_discrecionales = "
    "Transferencias Corrientes + de Capital recibidas (no automáticas: ATN, convenios, obras, fondos "
    "compensadores); gasto_total = Gastos Totales (II+V); dependencia_pct = (automáticas + discrecionales) / "
    "Ingresos Totales × 100 (= 100 − Autonomía Fiscal DNAP).")

FISCALDATA_HEADER = """\
// Provincial fiscal dependency (2025, cierre provisorio IV trim.)
// GENERATED by scripts/process_fiscal.py — do not edit by hand.
// Source: Ministerio de Economía — Subsecretaría de Coordinación Fiscal Provincial
//   (Dirección Nacional de Asuntos Provinciales), serie_aif-apnf-2025.xlsx (APNF, devengado)
//   cross-checked 1:1 against DNAP "Indicadores de Ejecución Presupuestaria Cierre 2025"
//   (indicadores_aif_2025_0.pdf, column "Autonomía Fiscal = Ingresos Propios / Ingresos Totales").
// transferencias_pct = recursos de origen nacional / Ingresos Totales (corrientes + capital) × 100
//   = (Tributarios de Origen Nacional [coparticipación Ley 23.548 + Fin. Educativo + leyes especiales]
//      + Transferencias Corrientes + Transferencias de Capital recibidas) / Ingresos Totales
//   = 100 − Autonomía Fiscal (DNAP). Rounded to integer.
// recursos_propios_pct = 100 − transferencias_pct (tributos provinciales + regalías + otros no
//   tributarios + contribuciones a la seguridad social + venta de bienes/servicios + rentas + capital propio)
// Derived from the same data as src/data/dnap_fiscal.json (field `dependency`).
// La Pampa: 2025 line items not in the APNF series; value from DNAP Indicadores cierre 2025 (autonomía 45,9%).
// Santiago del Estero 2025: own share jumps (34% vs 14,5% in 2024) due to Rentas de la Propiedad ($922 mil M).

export const fiscalData = [
"""


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    ap.add_argument("--xlsx", default=os.path.join(RAW_DIR, APNF_FILE))
    ap.add_argument("--out-dir", default=OUT_DIR)
    ap.add_argument("--download", action="store_true", help="fetch the xlsx from the official URL first")
    args = ap.parse_args()

    if args.download or not os.path.exists(args.xlsx):
        download(APNF_URL, args.xlsx)
    data = parse_workbook(args.xlsx)

    provs, series, dep2025 = [], {}, {}
    for p, sheet in SHEET_MAP.items():
        d = data[sheet]
        years = sorted(y for y, v in d["ingresos_totales"].items() if v)
        Y = years[-1]
        c = year_calc(d, Y)
        e = {"province": p, "year": Y,
             "ownTaxes": r1(g(d, "own_taxes", Y)), "royalties": r1(g(d, "royalties", Y)),
             "otherNonTax": r1(g(d, "other_nontax", Y)), "socialSecurity": r1(g(d, "seg_social", Y)),
             "ownTotal": r1(c["own"]), "nationalTransfers": r1(c["nat"]),
             "coparticipation": r1(c["auto"]), "coparticipationNet": r1(g(d, "copart_neta", Y)),
             "automaticTransfers": r1(c["auto"]), "nonAutomaticTransfers": r1(c["nonauto"]),
             "totalRevenue": r1(c["it"]), "dependency": r1(c["dep"]), "dependencyTax": r1(c["deptax"]),
             "totalCurrentRevenue": r1(g(d, "ingresos_corrientes", Y)),
             "totalCurrentExpenditure": r1(g(d, "gastos_corrientes", Y)),
             "totalExpenditure": r1(g(d, "gastos_totales", Y)),
             "financialResult": r1(g(d, "resultado_financiero", Y)),
             "personnel": r1(g(d, "personnel", Y))}
        off = DNAP_AUTONOMIA[p][1 if Y == 2025 else 0]
        assert abs((100 - e["dependency"]) - off) < 0.11, (p, e["dependency"], off)
        if p == "La Pampa":
            e["note"] = LA_PAMPA_NOTE
        ts, ser = [], []
        for y in years:
            c2 = year_calc(d, y)
            ts.append({"year": y, "own": r1(c2["own"]), "transfers": r1(c2["nat"]), "auto": r1(c2["auto"]),
                       "nonAuto": r1(c2["nonauto"]), "royalties": r1(g(d, "royalties", y)),
                       "dependency": r1(c2["dep"])})
            ser.append({"year": y, "recursos_propios": r1(c2["own"]),
                        "transferencias_automaticas": r1(c2["auto"]),
                        "transferencias_discrecionales": r1(c2["nonauto"]),
                        "gasto_total": r1(g(d, "gastos_totales", y)),
                        "ingresos_totales": r1(c2["it"]), "dependencia_pct": r1(c2["dep"])})
        e["timeSeries"] = ts
        provs.append(e)
        series[p] = {"series": ser}
        # fiscalData.js: 2025 dependency; fall back to DNAP indicator when 2025 is missing (La Pampa)
        # (rounded from the 1-decimal value, Python round-half-even, e.g. Neuquén 14.5 -> 14)
        dep2025[p] = e["dependency"] if Y == 2025 else r1(100 - DNAP_AUTONOMIA[p][1])

    os.makedirs(args.out_dir, exist_ok=True)
    out = {"lastUpdated": "2025", "source": SOURCE,
           "units": "Millones de pesos corrientes (devengado). dependency/dependencyTax en %.",
           "formula": FORMULA, "fields": FIELDS, "provinces": provs}
    with open(os.path.join(args.out_dir, "dnap_fiscal.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)

    fs = {"version": SERIES_VERSION, "methodology": SERIES_METHODOLOGY, "source": APNF_URL,
          "provinces": {p: series[p] for p in ALL_PROVINCES}}
    with open(os.path.join(args.out_dir, "fiscalSeries.json"), "w", encoding="utf-8") as f:
        json.dump(fs, f, ensure_ascii=False, indent=2)

    lines = []
    for p in ALL_PROVINCES:
        t = round(dep2025[p])
        lines.append(f"  {{ provincia: {(repr(p) + ',').ljust(26)}transferencias_pct: {t}, recursos_propios_pct: {100 - t} }},")
    with open(os.path.join(args.out_dir, "fiscalData.js"), "w", encoding="utf-8") as f:
        f.write(FISCALDATA_HEADER + "\n".join(lines) + "\n];\n")

    for e in provs:
        print(f"  {e['province']:<24} {e['year']}  dependency={e['dependency']:5.1f}  dependencyTax={e['dependencyTax']:5.1f}")
    print(f"Wrote dnap_fiscal.json, fiscalSeries.json, fiscalData.js -> {args.out_dir}")


if __name__ == "__main__":
    main()
