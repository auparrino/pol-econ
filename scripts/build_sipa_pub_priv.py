#!/usr/bin/env python
"""
Build per-province public-vs-private split from CEP-XXI per-departamento SIPA data.

Input:
  scripts/raw/sipa_pub/puestos_depto_priv.csv
  scripts/raw/sipa_pub/puestos_depto_pub.csv
  (download from https://cdn.produccion.gob.ar/cdn-cep/datos-por-departamento/puestos/)

Output:
  src/data/sipa_pub_priv.json — aggregated by province for the latest common month.

Notes:
  - The CEP-XXI dataset was discontinued at Nov 2023. There is no per-province
    public-sector CSV; aggregating per-departamento is the only way to get a
    real (non-derived) per-province public count.
  - Universe: registered formal jobs ("puestos asalariados registrados").
    Per-depto is by worker residence, not establishment location.
  - 13 provinces have their own pension caja (caja propia). For those, SIPA-pub
    EXCLUDES provincial cabinet workers (they pay into the provincial caja, not
    ANSES). The DNAP empleo provincial dataset complements them.
"""

import pandas as pd
import json
import os
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE, "scripts", "raw", "sipa_pub")
OUT_FILE = os.path.join(BASE, "src", "data", "sipa_pub_priv.json")

# INDEC province codes → canonical Spanish names
PROV_NAMES = {
    2:  "Ciudad de Buenos Aires",
    6:  "Buenos Aires",
    10: "Catamarca",
    14: "Córdoba",
    18: "Corrientes",
    22: "Chaco",
    26: "Chubut",
    30: "Entre Ríos",
    34: "Formosa",
    38: "Jujuy",
    42: "La Pampa",
    46: "La Rioja",
    50: "Mendoza",
    54: "Misiones",
    58: "Neuquén",
    62: "Río Negro",
    66: "Salta",
    70: "San Juan",
    74: "San Luis",
    78: "Santa Cruz",
    82: "Santa Fe",
    86: "Santiago del Estero",
    90: "Tucumán",
    94: "Tierra del Fuego",
}

# 13 provinces with their own pension caja (kept their system 1994-1996).
# Source: ANSES + LA NACION cross-validated. CABA NOT included (transferred 1994).
CAJA_PROPIA = {
    "Buenos Aires", "Córdoba", "Chaco", "Chubut", "Corrientes", "Entre Ríos",
    "Formosa", "La Pampa", "Misiones", "Neuquén", "Santa Cruz", "Santa Fe",
    "Tierra del Fuego",
}


def main():
    priv_path = os.path.join(RAW_DIR, "puestos_depto_priv.csv")
    pub_path  = os.path.join(RAW_DIR, "puestos_depto_pub.csv")
    if not (os.path.exists(priv_path) and os.path.exists(pub_path)):
        print(f"missing CSVs in {RAW_DIR}", file=sys.stderr)
        sys.exit(1)

    priv = pd.read_csv(priv_path, encoding="utf-8")
    pub  = pd.read_csv(pub_path,  encoding="utf-8")
    priv["fecha"] = pd.to_datetime(priv["fecha"])
    pub["fecha"]  = pd.to_datetime(pub["fecha"])

    fLast = min(priv["fecha"].max(), pub["fecha"].max())
    vintage = fLast.strftime("%Y-%m")
    print(f"latest common month: {vintage}")

    p_priv = priv[priv["fecha"] == fLast].groupby("id_provincia_indec")["puestos"].sum()
    p_pub  = pub[pub["fecha"]  == fLast].groupby("id_provincia_indec")["puestos"].sum()

    nat_priv = int(p_priv.sum())
    nat_pub  = int(p_pub.sum())
    nat_total = nat_priv + nat_pub

    provinces = []
    for pid, name in PROV_NAMES.items():
        prv = int(p_priv.get(pid, 0))
        pub_v = int(p_pub.get(pid, 0))
        total = prv + pub_v
        if total == 0:
            continue
        provinces.append({
            "code": f"{pid:02d}",
            "province": name,
            "private": prv,
            "public": pub_v,
            "total": total,
            "publicPct": round(pub_v / total * 100, 1),
            "cajaPropia": name in CAJA_PROPIA,
        })

    # Sort by descending publicPct so caller can render rankings cheaply
    provinces.sort(key=lambda p: -p["publicPct"])

    out = {
        "source": "CEP-XXI / SIPA-AFIP",
        "sourceUrl": "https://datos.produccion.gob.ar/dataset/puestos-de-trabajo-por-departamento-partido-y-sector-de-actividad",
        "vintage": vintage,
        "scope": "Puestos asalariados registrados (SIPA), agregado por provincia desde archivos per-departamento (residencia del trabajador). Universo: trabajo formal registrado.",
        "discontinuedNote": "El dataset CEP-XXI fue discontinuado en nov 2023. Nov 2023 es el último mes publicado.",
        "cajaPropiaNote": "En las 13 provincias con caja previsional propia (BA, Cba, Chaco, Chubut, Corrientes, Entre Ríos, Formosa, La Pampa, Misiones, Neuquén, Santa Cruz, Santa Fe, Tierra del Fuego), SIPA-público excluye los empleados provinciales (cotizan en la caja provincial, no en ANSES). El dataset DNAP complementa esos números.",
        "national": {
            "private": nat_priv,
            "public": nat_pub,
            "total": nat_total,
            "publicPct": round(nat_pub / nat_total * 100, 1),
        },
        "cajaPropiaProvinces": sorted(CAJA_PROPIA),
        "provinces": provinces,
    }

    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f"wrote {OUT_FILE}")
    print(f"  national: priv={nat_priv:,} pub={nat_pub:,} ({nat_pub/nat_total*100:.1f}% pub)")
    print(f"  provinces: {len(provinces)}")
    print(f"  top-5 público%:")
    for p in provinces[:5]:
        flag = " ⚠" if p["cajaPropia"] else "  "
        print(f"    {p['province']:<22}{flag} {p['publicPct']:>5.1f}%")


if __name__ == "__main__":
    main()
