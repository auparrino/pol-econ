#!/usr/bin/env python
"""
Process SIPA registered private employment data (CEP XXI / Min. Desarrollo Productivo).
Source: https://cdn.produccion.gob.ar/cdn-cep/datos-por-provincia/por-provincia-clae2/puestos/puestos_priv.csv

Downloads (if needed) and processes into structured JSON for the dashboard.
"""

import pandas as pd
import json
import os
import urllib.request

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE, "data", "raw")
OUT_DIR = os.path.join(BASE, "src", "data")

SIPA_URL = "https://cdn.produccion.gob.ar/cdn-cep/datos-por-provincia/por-provincia-clae2/puestos/puestos_priv.csv"
SIPA_TOTAL_URL = "https://cdn.produccion.gob.ar/cdn-cep/datos-por-provincia/por-provincia-clae2/puestos/puestos_todos.csv"
CLAE_URL = "https://cdn.produccion.gob.ar/cdn-cep/clae_agg.csv"

# SIPA zone names → GeoJSON NAME_1
PROVINCE_MAP = {
    "BUENOS AIRES": "Buenos Aires",
    "CAPITAL FEDERAL": "Ciudad de Buenos Aires",
    "CATAMARCA": "Catamarca",
    "CHACO": "Chaco",
    "CHUBUT": "Chubut",
    "CORDOBA": "Córdoba",
    "CORRIENTES": "Corrientes",
    "ENTRE RIOS": "Entre Ríos",
    "FORMOSA": "Formosa",
    "JUJUY": "Jujuy",
    "LA PAMPA": "La Pampa",
    "LA RIOJA": "La Rioja",
    "MENDOZA": "Mendoza",
    "MISIONES": "Misiones",
    "NEUQUEN": "Neuquén",
    "RIO NEGRO": "Río Negro",
    "SALTA": "Salta",
    "SAN JUAN": "San Juan",
    "SAN LUIS": "San Luis",
    "SANTA CRUZ": "Santa Cruz",
    "SANTA FE": "Santa Fe",
    "SANTIAGO DEL ESTERO": "Santiago del Estero",
    "TIERRA DEL FUEGO": "Tierra del Fuego",
    "TUCUMAN": "Tucumán",
}

# Sector family classification for coloring
SECTOR_FAMILY = {
    1: "Primary", 2: "Primary", 3: "Primary", 5: "Primary",
    6: "Mining", 7: "Mining", 8: "Mining", 9: "Mining",
    10: "Industry", 11: "Industry", 12: "Industry", 13: "Industry",
    14: "Industry", 15: "Industry", 16: "Industry", 17: "Industry",
    18: "Industry", 19: "Industry", 20: "Industry", 21: "Industry",
    22: "Industry", 23: "Industry", 24: "Industry", 25: "Industry",
    26: "Industry", 27: "Industry", 28: "Industry", 29: "Industry",
    30: "Industry", 31: "Industry", 32: "Industry", 33: "Industry",
    35: "Utilities", 36: "Utilities", 37: "Utilities", 38: "Utilities", 39: "Utilities",
    41: "Construction", 42: "Construction", 43: "Construction",
    45: "Trade", 46: "Trade", 47: "Trade",
    49: "Transport", 50: "Transport", 51: "Transport", 52: "Transport", 53: "Transport",
    55: "Hospitality", 56: "Hospitality",
    58: "IT & Comms", 59: "IT & Comms", 60: "IT & Comms", 61: "IT & Comms",
    62: "IT & Comms", 63: "IT & Comms",
    64: "Finance", 65: "Finance", 66: "Finance",
    68: "Real Estate",
    69: "Prof. Services", 70: "Prof. Services", 71: "Prof. Services",
    72: "Prof. Services", 73: "Prof. Services", 74: "Prof. Services", 75: "Prof. Services",
    77: "Admin. Services", 78: "Admin. Services", 79: "Admin. Services",
    80: "Admin. Services", 81: "Admin. Services", 82: "Admin. Services",
    85: "Education",
    86: "Health", 87: "Health", 88: "Health",
    90: "Culture", 91: "Culture", 92: "Culture", 93: "Culture",
    94: "Other Services", 95: "Other Services", 96: "Other Services",
    999: "Other",
}


def download_if_needed(url, dest, force=False):
    if os.path.exists(dest) and not force:
        print(f"  Using cached: {dest}")
        return
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    print(f"  Downloading {url}...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp:
        data = resp.read()
        with open(dest, "wb") as f:
            f.write(data)
    print(f"  Saved {len(data)/1024/1024:.1f} MB")


def build_clae_dict():
    """Build CLAE2 code → name mapping."""
    path = os.path.join(RAW_DIR, "clae_agg.csv")
    download_if_needed(CLAE_URL, path)
    df = pd.read_csv(path, encoding="utf-8")
    clae2_map = {}
    for _, row in df.iterrows():
        code = int(row["clae2"])
        if code not in clae2_map:
            desc = str(row["clae2_desc"]).strip()
            # Shorten long names
            if len(desc) > 50:
                desc = desc[:47] + "..."
            clae2_map[code] = desc
    # Add fallback
    clae2_map[999] = "Other / Unclassified"
    return clae2_map


def process():
    print("Processing SIPA employment data...")

    # --- Private sector ---
    sipa_path = os.path.join(RAW_DIR, "sipa_puestos_priv_clae2.csv")
    download_if_needed(SIPA_URL, sipa_path)

    clae2_names = build_clae_dict()

    df = pd.read_csv(sipa_path)
    df = df[df["zona_prov"].isin(PROVINCE_MAP)]
    df["province"] = df["zona_prov"].map(PROVINCE_MAP)
    df["year"] = pd.to_datetime(df["fecha"]).dt.year

    latest_date = df["fecha"].max()
    print(f"  Latest private data: {latest_date}")

    # --- Total (private + public) ---
    total_path = os.path.join(RAW_DIR, "sipa_puestos_todos_clae2.csv")
    download_if_needed(SIPA_TOTAL_URL, total_path)

    df_total = pd.read_csv(total_path)
    df_total = df_total[df_total["zona_prov"].isin(PROVINCE_MAP)]
    df_total["province"] = df_total["zona_prov"].map(PROVINCE_MAP)
    df_total["year"] = pd.to_datetime(df_total["fecha"]).dt.year

    latest_total_date = df_total["fecha"].max()
    print(f"  Latest total data: {latest_total_date}")

    # Use latest available month for sector breakdown
    latest_df = df[df["fecha"] == latest_date].copy()
    latest_total_df = df_total[df_total["fecha"] == latest_total_date].copy()

    provinces = []
    for prov_name in sorted(PROVINCE_MAP.values()):
        prov_data = latest_df[latest_df["province"] == prov_name]
        if prov_data.empty:
            continue

        total_private = int(prov_data["puestos"].sum())

        # Public employment from total dataset
        prov_total = latest_total_df[latest_total_df["province"] == prov_name]
        total_all = int(prov_total["puestos"].sum()) if len(prov_total) > 0 else total_private
        total_public = max(0, total_all - total_private)

        # Sector breakdown (private)
        sectors = []
        for _, row in prov_data.sort_values("puestos", ascending=False).iterrows():
            code = int(row["clae2"])
            emp = int(row["puestos"])
            if emp <= 0:
                continue
            sectors.append({
                "clae2": str(code),
                "name": clae2_names.get(code, f"Sector {code}"),
                "family": SECTOR_FAMILY.get(code, "Other"),
                "employees": emp,
                "share_pct": round(emp / total_private * 100, 2) if total_private > 0 else 0,
            })

        # HHI = sum of squared shares (0-1 scale)
        hhi = sum((s["share_pct"] / 100) ** 2 for s in sectors)

        # Time series: annual totals (private)
        prov_ts = df[df["province"] == prov_name].groupby("year")["puestos"].sum().reset_index()
        # Also total time series
        prov_ts_total = df_total[df_total["province"] == prov_name].groupby("year")["puestos"].sum().reset_index()
        ts_total_map = dict(zip(prov_ts_total["year"], prov_ts_total["puestos"]))

        time_series = []
        for _, r in prov_ts.iterrows():
            y = int(r["year"])
            priv = int(r["puestos"])
            tot = int(ts_total_map.get(y, priv))
            time_series.append({
                "year": y,
                "private": priv,
                "public": max(0, tot - priv),
                "total": tot,
            })

        provinces.append({
            "province": prov_name,
            "private": total_private,
            "public": total_public,
            "total": total_all,
            "hhi": round(hhi, 4),
            "sectors": sectors[:20],
            "timeSeries": time_series,
        })

    result = {
        "lastUpdated": latest_date,
        "source": "CEP XXI / SIPA - Registered private employment",
        "provinces": provinces,
    }

    out_path = os.path.join(OUT_DIR, "sipa_employment.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False)
    print(f"  Wrote {len(provinces)} provinces to {out_path}")


if __name__ == "__main__":
    process()
    print("Done.")
