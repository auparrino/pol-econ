"""Build src/data/censo2022_categoria_ocupacional.json from Censo 2022 Cuadro 4.2 (p.48).

Source: INDEC Censo 2022 (caracteristicas economicas) — table "Población ocupada de 14
años y más en viviendas particulares por categoría ocupacional, según jurisdicción".

Columns in source table (after jurisdicción):
  1. Total ocupados
  2. Patrón(a) o empleador(a)
  3. Empleada(o) u obrera(o)           <- public + private employees combined
  4. Cuenta propia
  5. Trabajador(a) familiar
  6. Servicio doméstico
  7. Ignorado
"""
from __future__ import annotations
import json, sys, io, re
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

try:
    from pypdf import PdfReader
except ImportError:
    raise SystemExit("pip install pypdf")

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "scripts" / "raw" / "censo2022_caracteristicas_economicas.pdf"
OUT = ROOT / "src" / "data" / "censo2022_categoria_ocupacional.json"

ROWS = [
    "Total del país",
    "Ciudad Autónoma de Buenos Aires",
    "Buenos Aires",
    "24 partidos del Gran Buenos Aires",
    "Resto de partidos de la provincia de Buenos Aires",
    "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes",
    "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja",
    "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta",
    "San Juan", "San Luis", "Santa Cruz", "Santa Fe",
    "Santiago del Estero",
    "Tierra del Fuego, Antártida e Islas del Atlántico Sur",
    "Tucumán",
]

NAME_MAP = {
    "Ciudad Autónoma de Buenos Aires": "Ciudad de Buenos Aires",
    "Tierra del Fuego, Antártida e Islas del Atlántico Sur": "Tierra del Fuego",
}

NUM_RE = re.compile(r"^\d[\d.]*$")


def parse_ints(text):
    out = []
    for tok in text.split():
        tok = tok.strip()
        if NUM_RE.match(tok):
            try:
                out.append(int(tok.replace(".", "")))
            except ValueError:
                pass
    return out


def main():
    reader = PdfReader(str(SRC))
    page = reader.pages[47].extract_text()  # 0-indexed → page 48

    nums = parse_ints(page)
    anchor = 21_094_987  # national total ocupados
    if anchor not in nums:
        raise RuntimeError("anchor not found in page 48")
    start = nums.index(anchor)

    n_rows = len(ROWS)
    n_cols = 7  # total, patron, emp_obrera, cta_propia, trab_fam, serv_dom, ignorado

    flat = nums[start:start + n_rows * n_cols]
    if len(flat) < n_rows * n_cols:
        raise RuntimeError(f"expected {n_rows * n_cols}, got {len(flat)}")

    # pypdf column-major layout
    grid = [[0] * n_cols for _ in range(n_rows)]
    for c in range(n_cols):
        for r in range(n_rows):
            grid[r][c] = flat[c * n_rows + r]

    # Sanity: national total = sum of categories (tolerance for rounding)
    total, patron, empobr, ctaprop, trabfam, servdom, ignor = grid[0]
    s = patron + empobr + ctaprop + trabfam + servdom + ignor
    assert abs(s - total) < 1000, f"national sum mismatch: {s} vs {total}"

    def build(idx):
        total, patron, empobr, ctaprop, trabfam, servdom, ignor = grid[idx]
        return {
            "ocupados": total,
            "patron": patron,
            "empleadaObrera": empobr,  # asalariados (public + private, registered + informal)
            "cuentaPropia": ctaprop,
            "trabajadorFamiliar": trabfam,
            "servicioDomestico": servdom,
            "ignorado": ignor,
            # Shares (% of ocupados)
            "shares": {
                "patron": round(patron / total * 100, 1),
                "empleadaObrera": round(empobr / total * 100, 1),
                "cuentaPropia": round(ctaprop / total * 100, 1),
                "trabajadorFamiliar": round(trabfam / total * 100, 1),
                "servicioDomestico": round(servdom / total * 100, 1),
                "ignorado": round(ignor / total * 100, 1),
            },
        }

    out_provinces = []
    national = None
    for i, label in enumerate(ROWS):
        if label == "Total del país":
            national = build(i)
            continue
        # Skip BA subdivisions
        if label in ("24 partidos del Gran Buenos Aires",
                     "Resto de partidos de la provincia de Buenos Aires"):
            continue
        province_name = NAME_MAP.get(label, label)
        out_provinces.append({"province": province_name, **build(i)})

    out_provinces.sort(key=lambda p: -p["ocupados"])

    out = {
        "source": "INDEC — Censo Nacional de Población, Hogares y Viviendas 2022",
        "sourceUrl": "https://www.indec.gob.ar/indec/web/Nivel4-Tema-2-41-165",
        "datasetUrl": "https://www.indec.gob.ar/ftp/cuadros/poblacion/censo2022_caracteristicas_economicas.pdf",
        "table": "Cuadro 4.2 — Población ocupada de 14 años y más por categoría ocupacional, según jurisdicción",
        "note": "Empleada(o) u obrera(o) combina sector público y privado. Incluye trabajo informal (no solo registrado).",
        "year": 2022,
        "national": national,
        "provinces": out_provinces,
    }

    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT}")
    print(f"National: ocupados={national['ocupados']:,}, "
          f"empleada/obrera={national['empleadaObrera']:,} ({national['shares']['empleadaObrera']}%), "
          f"cuenta propia={national['cuentaPropia']:,} ({national['shares']['cuentaPropia']}%)")
    print(f"\n{len(out_provinces)} provinces. Top 3 by share of employees (asalariados):")
    top = sorted(out_provinces, key=lambda p: -p["shares"]["empleadaObrera"])
    for p in top[:3]:
        s = p["shares"]
        print(f"  {p['province'][:22]:22s} asal={s['empleadaObrera']}%  cta.prop={s['cuentaPropia']}%  "
              f"patron={s['patron']}%")
    print(f"\nBottom 3 (highest self-employment):")
    for p in top[-3:]:
        s = p["shares"]
        print(f"  {p['province'][:22]:22s} asal={s['empleadaObrera']}%  cta.prop={s['cuentaPropia']}%  "
              f"patron={s['patron']}%")


if __name__ == "__main__":
    main()
