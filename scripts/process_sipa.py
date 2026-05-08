#!/usr/bin/env python
"""
Process CEP XXI / SIPA + AFIP registered employment data.

Covers FIVE worker categories (where CSVs are available):
  - priv        → asalariados privados (SIPA)
  - pub         → asalariados públicos (SIPA nacional + municipal + provincial adherido)
  - monotributo → monotributistas
  - autonomos   → trabajadores autónomos
  - casas       → trabajadoras de casas particulares (régimen especial)

Limitations (documented in the UI):
  - NO cubre empleados provinciales de 13 provincias con caja previsional propia
    (BA, CABA, Córdoba, Santa Fe, Chaco, Entre Ríos, Misiones, Formosa, Neuquén,
     Chubut, Santa Cruz, TdF, Corrientes).
  - NO incluye trabajo informal.

Backwards-compatible output:
  - Always emits `private`, `public`, `total` (same fields as v1) so old UI keeps working.
  - Adds `categories` object with all 5 categories when available.
  - `publicSource`: "direct" (from puestos_pub.csv) or "derived" (todos − priv).
"""

import pandas as pd
import json
import os
import urllib.request
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE, "data", "raw")
OUT_DIR = os.path.join(BASE, "src", "data")

CDN_BASE = "https://cdn.produccion.gob.ar/cdn-cep/datos-por-provincia/por-provincia-clae2"

# One or more candidate URLs per category. First one that downloads (and parses) wins.
CATEGORY_URLS = {
    "priv":        [f"{CDN_BASE}/puestos/puestos_priv.csv"],
    "todos":       [f"{CDN_BASE}/puestos/puestos_todos.csv"],
    "pub":         [f"{CDN_BASE}/puestos/puestos_pub.csv",
                    f"{CDN_BASE}/puestos/puestos_publ.csv",
                    f"{CDN_BASE}/puestos/puestos_publico.csv"],
    "monotributo": [f"{CDN_BASE}/monotributo/monotributo.csv",
                    f"{CDN_BASE}/puestos/monotributo.csv",
                    f"{CDN_BASE}/monotributistas/monotributistas.csv",
                    f"{CDN_BASE}/monotributistas/monotributo.csv"],
    "autonomos":   [f"{CDN_BASE}/autonomos/autonomos.csv",
                    f"{CDN_BASE}/puestos/autonomos.csv"],
    "casas":       [f"{CDN_BASE}/casas_particulares/casas_particulares.csv",
                    f"{CDN_BASE}/puestos/casas_particulares.csv",
                    f"{CDN_BASE}/casas-particulares/casas_particulares.csv"],
}

CLAE_URL = f"https://cdn.produccion.gob.ar/cdn-cep/clae_agg.csv"

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
    84: "Public",  # Administración pública y defensa
    85: "Education",
    86: "Health", 87: "Health", 88: "Health",
    90: "Culture", 91: "Culture", 92: "Culture", 93: "Culture",
    94: "Other Services", 95: "Other Services", 96: "Other Services",
    999: "Other",
}


def download_if_needed(url, dest, force=False):
    if os.path.exists(dest) and not force:
        return True
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = resp.read()
            if len(data) < 1000:
                return False  # probably a 404 HTML page
            with open(dest, "wb") as f:
                f.write(data)
            print(f"  Downloaded {len(data)/1024/1024:.1f} MB from {url}")
            return True
    except Exception as e:
        print(f"  Failed {url}: {e}")
        return False


def try_download_category(cat_name, urls):
    """Returns path to the CSV if download succeeded OR cached copy exists."""
    # New canonical naming AND legacy v1 names we might already have cached
    candidate_caches = [
        os.path.join(RAW_DIR, f"sipa_{cat_name}_clae2.csv"),
        os.path.join(RAW_DIR, f"sipa_puestos_{cat_name}_clae2.csv"),
    ]
    for c in candidate_caches:
        if os.path.exists(c) and os.path.getsize(c) > 1000:
            print(f"  [{cat_name}] using cached: {c}")
            return c
    dest = candidate_caches[0]
    for url in urls:
        print(f"  [{cat_name}] trying {url}")
        if download_if_needed(url, dest, force=True):
            return dest
    print(f"  [{cat_name}] ALL URLS FAILED — category unavailable")
    return None


def build_clae_dict():
    """CLAE2 code → short description."""
    path = os.path.join(RAW_DIR, "clae_agg.csv")
    if not os.path.exists(path):
        download_if_needed(CLAE_URL, path)
    if not os.path.exists(path):
        return {}
    df = pd.read_csv(path, encoding="utf-8")
    clae2_map = {}
    for _, row in df.iterrows():
        code = int(row["clae2"])
        if code not in clae2_map:
            desc = str(row["clae2_desc"]).strip()
            if len(desc) > 50:
                desc = desc[:47] + "..."
            clae2_map[code] = desc
    clae2_map[999] = "Other / Unclassified"
    return clae2_map


def load_category(path):
    """Read a SIPA/AFIP csv, filter to mapped provinces, return DataFrame."""
    if not path or not os.path.exists(path):
        return None
    df = pd.read_csv(path)
    df = df[df["zona_prov"].isin(PROVINCE_MAP)]
    df["province"] = df["zona_prov"].map(PROVINCE_MAP)
    df["year"] = pd.to_datetime(df["fecha"]).dt.year
    return df


def latest_sum_by_prov(df):
    """Return dict province -> sum of puestos at the latest date."""
    if df is None or df.empty:
        return {}, None
    latest = df["fecha"].max()
    sub = df[df["fecha"] == latest]
    return sub.groupby("province")["puestos"].sum().to_dict(), latest


def sector_breakdown(df, clae2_names):
    """Sector breakdown for the latest month."""
    if df is None or df.empty:
        return {}
    latest = df["fecha"].max()
    sub = df[df["fecha"] == latest]
    out = {}
    for prov, grp in sub.groupby("province"):
        total = int(grp["puestos"].sum())
        sectors = []
        for _, row in grp.sort_values("puestos", ascending=False).iterrows():
            code = int(row["clae2"])
            emp = int(row["puestos"])
            if emp <= 0:
                continue
            sectors.append({
                "clae2": str(code),
                "name": clae2_names.get(code, f"Sector {code}"),
                "family": SECTOR_FAMILY.get(code, "Other"),
                "employees": emp,
                "share_pct": round(emp / total * 100, 2) if total > 0 else 0,
            })
        out[prov] = sectors[:20]
    return out


def process():
    os.makedirs(RAW_DIR, exist_ok=True)
    print("Processing CEP XXI / SIPA+AFIP employment data...")

    # ── Download all categories (skip silently on failure) ────────
    paths = {}
    for cat, urls in CATEGORY_URLS.items():
        paths[cat] = try_download_category(cat, urls)

    # ── Load DataFrames ───────────────────────────────────────────
    dfs = {cat: load_category(p) for cat, p in paths.items()}

    available = [k for k, v in dfs.items() if v is not None]
    print(f"\n  Categories loaded: {available}")
    if "priv" not in available:
        print("  ERROR: priv is required — aborting.")
        sys.exit(1)

    clae2_names = build_clae_dict()

    # ── Aggregate latest snapshots per category ──────────────────
    snapshots = {}
    latest_dates = {}
    for cat, df in dfs.items():
        sums, latest = latest_sum_by_prov(df)
        snapshots[cat] = sums
        latest_dates[cat] = latest

    # Public: prefer direct `pub` if available, else derive `todos − priv`
    public_source = "direct" if dfs.get("pub") is not None else "derived"
    if public_source == "direct":
        pub_snap = snapshots["pub"]
    else:
        pub_snap = {}
        for prov, todos_val in snapshots.get("todos", {}).items():
            priv_val = snapshots["priv"].get(prov, 0)
            pub_snap[prov] = max(0, todos_val - priv_val)

    # Sector breakdown (keep using priv for detailed view, like v1)
    priv_sectors = sector_breakdown(dfs["priv"], clae2_names)

    # ── Build per-province output ────────────────────────────────
    provinces_out = []
    for prov in sorted(PROVINCE_MAP.values()):
        priv = int(snapshots["priv"].get(prov, 0))
        pub = int(pub_snap.get(prov, 0))
        monot = int(snapshots.get("monotributo", {}).get(prov, 0))
        auton = int(snapshots.get("autonomos", {}).get(prov, 0))
        casas = int(snapshots.get("casas", {}).get(prov, 0))

        # Total registered (sum of available categories)
        total = priv + pub + monot + auton + casas

        # Backwards-compat: `total` and `public` match old v1 shape when only priv+todos present
        if "monotributo" not in available and "autonomos" not in available and "casas" not in available:
            # Use old definition — total includes pub only
            total = priv + pub

        sectors = priv_sectors.get(prov, [])
        hhi = sum((s["share_pct"] / 100) ** 2 for s in sectors)

        # Time series (use priv + todos — same as v1)
        df_priv = dfs["priv"]
        prov_ts = df_priv[df_priv["province"] == prov].groupby("year")["puestos"].sum().reset_index()
        df_todos = dfs.get("todos")
        ts_total_map = {}
        if df_todos is not None:
            ts_total = df_todos[df_todos["province"] == prov].groupby("year")["puestos"].sum().reset_index()
            ts_total_map = dict(zip(ts_total["year"], ts_total["puestos"]))
        time_series = []
        for _, r in prov_ts.iterrows():
            y = int(r["year"])
            pr = int(r["puestos"])
            tot = int(ts_total_map.get(y, pr))
            time_series.append({
                "year": y,
                "private": pr,
                "public": max(0, tot - pr),
                "total": tot,
            })

        provinces_out.append({
            "province": prov,
            # legacy v1 fields (don't break existing UI)
            "private": priv,
            "public": pub,
            "total": total,
            # v2 expanded categories
            "categories": {
                "asalariadosPrivados": priv,
                "asalariadosPublicos": pub,
                "monotributo": monot if "monotributo" in available else None,
                "autonomos": auton if "autonomos" in available else None,
                "casasParticulares": casas if "casas" in available else None,
            },
            "publicSource": public_source,   # "direct" or "derived"
            "hhi": round(hhi, 4),
            "sectors": sectors,
            "timeSeries": time_series,
        })

    result = {
        "lastUpdated": latest_dates.get("priv"),
        "source": "CEP XXI / SIPA + AFIP — 5 categorías de trabajo registrado",
        "categoriesAvailable": available,
        "publicSource": public_source,
        "limitations": [
            "No incluye empleados provinciales de 13 provincias con caja previsional propia (BA, CABA, Córdoba, Santa Fe, Chaco, Entre Ríos, Misiones, Formosa, Neuquén, Chubut, Santa Cruz, TdF, Corrientes).",
            "No incluye trabajo informal (EPH estima ~30-40% del empleo urbano).",
        ],
        "provinces": provinces_out,
    }

    out_path = os.path.join(OUT_DIR, "sipa_employment.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False)
    print(f"\n  Wrote {len(provinces_out)} provinces to {out_path}")
    print(f"  publicSource = {public_source}")
    print(f"  categories available: {available}")


if __name__ == "__main__":
    process()
    print("Done.")
