"""Build src/data/censo2022_empleo_provincial.json from INDEC Censo 2022.

Source: https://www.indec.gob.ar/ftp/cuadros/poblacion/censo2022_caracteristicas_economicas.pdf
Cuadro 4 (pages 46-47): population 14+ in private dwellings, by jurisdiction.

Rationale: census-based, internally consistent set of labor indicators. Three rates
(activity, employment, unemployment) share the same universe (14+ in private dwellings)
so their interplay tells a coherent story — unlike EPH estimates which sample 31 urban
agglomerates, or DNAP which mixes survey with administrative data.

Computed per jurisdiction:
  - tasa de actividad     = PEA / 14+ population
  - tasa de empleo        = ocupados / 14+ population
  - tasa de desocupación  = desocupados / PEA
"""
from __future__ import annotations
import json
import re
import sys
import io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

try:
    from pypdf import PdfReader
except ImportError:
    raise SystemExit("pypdf not installed. pip install pypdf")

ROOT = Path(__file__).resolve().parent.parent
SRC_PDF = ROOT / "scripts" / "raw" / "censo2022_caracteristicas_economicas.pdf"
OUT = ROOT / "src" / "data" / "censo2022_empleo_provincial.json"

# Canonical labels (27 rows per cuadro, same order on both pages).
ROWS = [
    "Total del país",
    "Ciudad Autónoma de Buenos Aires",
    "Buenos Aires",
    "24 partidos del Gran Buenos Aires",
    "Resto de partidos de la provincia de Buenos Aires",
    "Catamarca",
    "Chaco",
    "Chubut",
    "Córdoba",
    "Corrientes",
    "Entre Ríos",
    "Formosa",
    "Jujuy",
    "La Pampa",
    "La Rioja",
    "Mendoza",
    "Misiones",
    "Neuquén",
    "Río Negro",
    "Salta",
    "San Juan",
    "San Luis",
    "Santa Cruz",
    "Santa Fe",
    "Santiago del Estero",
    "Tierra del Fuego, Antártida e Islas del Atlántico Sur",
    "Tucumán",
]

# Map Censo names to the project's canonical province names.
NAME_MAP = {
    "Ciudad Autónoma de Buenos Aires": "Ciudad de Buenos Aires",
    "Buenos Aires": "Buenos Aires",
    "Catamarca": "Catamarca",
    "Chaco": "Chaco",
    "Chubut": "Chubut",
    "Córdoba": "Córdoba",
    "Corrientes": "Corrientes",
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
    "Santiago del Estero": "Santiago del Estero",
    "Tierra del Fuego, Antártida e Islas del Atlántico Sur": "Tierra del Fuego",
    "Tucumán": "Tucumán",
}


NUM_RE = re.compile(r"^\d[\d.]*$")


def parse_ints(text: str) -> list[int]:
    """Extract Argentine-formatted integers from a block of text."""
    out = []
    for token in text.split():
        token = token.strip()
        if NUM_RE.match(token):
            try:
                out.append(int(token.replace(".", "")))
            except ValueError:
                pass
    return out


def extract_numbers_from_page(page_text: str, expected: int, anchor: int) -> list[int]:
    """Find `anchor` (first data value for the national row) and take `expected` numbers from there."""
    nums = parse_ints(page_text)
    if anchor not in nums:
        raise RuntimeError(f"Anchor {anchor} not found on page")
    start = nums.index(anchor)
    slice_ = nums[start:start + expected]
    if len(slice_) < expected:
        raise RuntimeError(f"Expected {expected} numbers from anchor, got {len(slice_)}")
    return slice_


def main():
    reader = PdfReader(str(SRC_PDF))
    page46 = reader.pages[45].extract_text()  # PEA / PNEA by sex and jurisdiction
    page47 = reader.pages[46].extract_text()  # Ocupados / Desocupados by sex

    n_rows = len(ROWS)
    n_cols_46 = 5  # pob14+, PEA M, PEA V, PNEA V, PNEA M
    n_cols_47 = 5  # PEA, Ocup M, Ocup V, Desoc V, Desoc M

    vals46 = extract_numbers_from_page(page46, n_rows * n_cols_46, anchor=36_259_376)
    vals47 = extract_numbers_from_page(page47, n_rows * n_cols_47, anchor=23_051_957)

    # pypdf extracts columns top-to-bottom → the flat list is column-major.
    def column_major(flat: list[int], rows: int, cols: int) -> list[list[int]]:
        """Return shape [rows][cols]."""
        out = [[0] * cols for _ in range(rows)]
        for c in range(cols):
            for r in range(rows):
                out[r][c] = flat[c * rows + r]
        return out

    g46 = column_major(vals46, n_rows, n_cols_46)
    g47 = column_major(vals47, n_rows, n_cols_47)

    # Sanity check with national row:
    pob14_nat, pea_m_nat, pea_v_nat, pnea_v_nat, pnea_m_nat = g46[0]
    pea_nat, ocup_m_nat, ocup_v_nat, desoc_v_nat, desoc_m_nat = g47[0]
    assert pea_m_nat + pea_v_nat == pea_nat, "PEA mismatch"
    ocup_nat = ocup_m_nat + ocup_v_nat
    desoc_nat = desoc_v_nat + desoc_m_nat
    assert ocup_nat + desoc_nat == pea_nat, "ocup+desoc != PEA"

    provinces = []
    national = None
    for i, label in enumerate(ROWS):
        pob14, _, _, _, _ = g46[i]
        pea, ocup_m, ocup_v, desoc_v, desoc_m = g47[i]
        ocup = ocup_m + ocup_v
        desoc = desoc_v + desoc_m
        activity = round(pea / pob14 * 100, 2)
        employment = round(ocup / pob14 * 100, 2)
        unemployment = round(desoc / pea * 100, 2)

        rec = {
            "pob14": pob14,
            "pea": pea,
            "ocupados": ocup,
            "desocupados": desoc,
            "activityRate": activity,
            "employmentRate": employment,
            "unemploymentRate": unemployment,
        }
        if label == "Total del país":
            national = rec
        elif label in NAME_MAP:
            provinces.append({"province": NAME_MAP[label], **rec})

    provinces.sort(key=lambda p: -p["employmentRate"])

    out = {
        "source": "INDEC — Censo Nacional de Población, Hogares y Viviendas 2022",
        "sourceUrl": "https://www.indec.gob.ar/indec/web/Nivel4-Tema-2-41-165",
        "datasetUrl": "https://www.indec.gob.ar/ftp/cuadros/poblacion/censo2022_caracteristicas_economicas.pdf",
        "methodology": "Población de 14 años y más en viviendas particulares. Tasa de actividad = PEA / 14+; tasa de empleo = ocupados / 14+; tasa de desocupación = desocupados / PEA.",
        "year": 2022,
        "denominator": "Población de 14 años y más en viviendas particulares",
        "national": national,
        "provinces": provinces,
    }

    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Wrote {len(provinces)} provinces. Year 2022.")
    print(f"National: activity={national['activityRate']:.1f}%, "
          f"employment={national['employmentRate']:.1f}%, "
          f"unemployment={national['unemploymentRate']:.1f}%")
    print("\nTop 3 by employment rate:")
    for p in provinces[:3]:
        print(f"  {p['province'].encode('ascii','replace').decode():25s} "
              f"act={p['activityRate']:.1f}  emp={p['employmentRate']:.1f}  "
              f"unemp={p['unemploymentRate']:.1f}")
    print("\nBottom 3 by employment rate:")
    for p in provinces[-3:]:
        print(f"  {p['province'].encode('ascii','replace').decode():25s} "
              f"act={p['activityRate']:.1f}  emp={p['employmentRate']:.1f}  "
              f"unemp={p['unemploymentRate']:.1f}")


if __name__ == "__main__":
    main()
