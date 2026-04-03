#!/usr/bin/env python
"""Parse provincial export CSVs into structured JSON for the dashboard."""

import pandas as pd
import json
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(BASE, "src", "data")

# CSV column prefix → GeoJSON NAME_1
PROVINCE_MAP = {
    "buenos_aires": "Buenos Aires",
    "catamarca": "Catamarca",
    "chaco": "Chaco",
    "chubut": "Chubut",
    "ciudad_de_buenos_aires": "Ciudad de Buenos Aires",
    "cordoba": "Córdoba",
    "corrientes": "Corrientes",
    "entre_rios": "Entre Ríos",
    "formosa": "Formosa",
    "jujuy": "Jujuy",
    "la_pampa": "La Pampa",
    "la_rioja": "La Rioja",
    "mendoza": "Mendoza",
    "misiones": "Misiones",
    "neuquen": "Neuquén",
    "rio_negro": "Río Negro",
    "salta": "Salta",
    "san_juan": "San Juan",
    "san_luis": "San Luis",
    "santa_cruz": "Santa Cruz",
    "santa_fe": "Santa Fe",
    "santiago_del_estero": "Santiago del Estero",
    "tierra_del_fuego": "Tierra del Fuego",
    "tucuman": "Tucumán",
}

CATEGORY_LABELS = {
    "pp": "Primary Products",
    "moa": "Agricultural Manufactures",
    "moi": "Industrial Manufactures",
    "cye": "Fuel & Energy",
}


def parse_rubro():
    """Parse exportaciones-provincia-rubro.csv → exports_by_category.json"""
    path = os.path.join(BASE, "exportaciones-provincia-rubro.csv")
    df = pd.read_csv(path)

    rows = []
    for _, row in df.iterrows():
        year = int(str(row["indice_tiempo"])[:4])
        for prefix, province in PROVINCE_MAP.items():
            pp = row.get(f"{prefix}_pp", 0) or 0
            moa = row.get(f"{prefix}_moa", 0) or 0
            moi = row.get(f"{prefix}_moi", 0) or 0
            cye = row.get(f"{prefix}_cye", 0) or 0
            total_col = f"{prefix}_total_{prefix}"
            total = row.get(total_col, pp + moa + moi + cye) or 0
            rows.append({
                "year": year,
                "province": province,
                "pp": round(float(pp), 2),
                "moa": round(float(moa), 2),
                "moi": round(float(moi), 2),
                "cye": round(float(cye), 2),
                "total": round(float(total), 2),
            })

    out = os.path.join(OUT_DIR, "exports_by_category.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False)
    print(f"Wrote {len(rows)} rows to {out}")
    return rows


def parse_destinations():
    """Parse exportaciones-por-provincia-por-pais-de-destino CSV → exports_by_destination.json"""
    path = os.path.join(BASE, "exportaciones-por-provincia-por-pais-de-destino-valores-anuales.csv")
    df = pd.read_csv(path)

    cols = list(df.columns)
    cols.remove("indice_tiempo")

    # Build mapping: prefix → list of (country_slug, col_name)
    prov_countries = {}
    for col in cols:
        for prefix in sorted(PROVINCE_MAP.keys(), key=len, reverse=True):
            if col.startswith(prefix + "_"):
                rest = col[len(prefix) + 1:]
                if rest.startswith("total_"):
                    break
                prov_countries.setdefault(prefix, []).append((rest, col))
                break

    # Country slug prettifier
    COUNTRY_NAMES = {
        "brasil": "Brasil", "estados_unidos": "EE.UU.", "chile": "Chile",
        "china": "China", "uruguay": "Uruguay", "paraguay": "Paraguay",
        "mexico": "México", "paises_bajos": "Países Bajos", "alemania": "Alemania",
        "venezuela": "Venezuela", "espania": "España", "italia": "Italia",
        "japon": "Japón", "canada": "Canadá", "rusia": "Rusia",
        "india": "India", "reino_unido": "Reino Unido", "francia": "Francia",
        "colombia": "Colombia", "peru": "Perú", "belgica": "Bélgica",
        "republica_corea": "Corea del Sur", "indonesia": "Indonesia",
        "egipto": "Egipto", "argelia": "Argelia", "hong_kong": "Hong Kong",
        "sudafrica": "Sudáfrica", "bolivia": "Bolivia", "ecuador": "Ecuador",
        "arabia_saudita": "Arabia Saudita", "vietnam": "Vietnam",
        "malasia": "Malasia", "iraq": "Irak", "filipinas": "Filipinas",
        "finlandia": "Finlandia", "bulgaria": "Bulgaria", "siria": "Siria",
        "suiza": "Suiza", "resto": "Resto",
        "zf_zonamerica_ex_montevideo_uruguay": "Zonamerica (UY)",
    }

    def pretty_country(slug):
        if slug in COUNTRY_NAMES:
            return COUNTRY_NAMES[slug]
        return slug.replace("_", " ").title()

    rows = []
    for _, row in df.iterrows():
        year = int(str(row["indice_tiempo"])[:4])
        for prefix, province in PROVINCE_MAP.items():
            countries = prov_countries.get(prefix, [])
            dests = []
            for country_slug, col in countries:
                val = float(row.get(col, 0) or 0)
                if val > 0:
                    dests.append({
                        "country": pretty_country(country_slug),
                        "value": round(val, 2),
                    })
            dests.sort(key=lambda d: d["value"], reverse=True)
            # Keep top 10 + aggregate rest
            if len(dests) > 10:
                top10 = dests[:10]
                rest_val = sum(d["value"] for d in dests[10:])
                if rest_val > 0:
                    # Merge with existing "Resto" if present
                    existing_resto = next((d for d in top10 if d["country"] == "Resto"), None)
                    if existing_resto:
                        existing_resto["value"] = round(existing_resto["value"] + rest_val, 2)
                    else:
                        top10.append({"country": "Resto", "value": round(rest_val, 2)})
                dests = top10

            rows.append({
                "year": year,
                "province": province,
                "destinations": dests,
            })

    out = os.path.join(OUT_DIR, "exports_by_destination.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False)
    print(f"Wrote {len(rows)} province-years to {out}")
    return rows


if __name__ == "__main__":
    parse_rubro()
    parse_destinations()
    print("Done.")
