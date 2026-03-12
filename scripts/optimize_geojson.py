"""
OPTIMIZACION DE GeoJSON para carga en frontend.

Problemas:
- ductos.geojson = 99 MB (71k features) -> demasiado pesado
- yacimientos.geojson = 8.8 MB (879 features) -> simplificar poligonos
- gasoductos.geojson = 9.7 MB (3000 features) -> simplificar + filtrar

Estrategia:
- Ductos: agrupar por tipo de ducto y simplificar geometrias
- Yacimientos: simplificar poligonos con tolerancia
- Gasoductos: solo transporte troncal, simplificar
- Copiar archivos ligeros tal cual (centrales, refinerias, bombeo, lineas)
"""

import json
import os
import sys
import math

INPUT_DIR = "data/geojson"
OUTPUT_DIR = "src/data/energy"

os.makedirs(OUTPUT_DIR, exist_ok=True)


def simplify_coords(coords, tolerance=0.005):
    """Douglas-Peucker simplification for a list of [lng, lat] points."""
    if len(coords) <= 2:
        return coords

    # Find the point with the max distance from the line between first and last
    first = coords[0]
    last = coords[-1]

    max_dist = 0
    max_idx = 0

    for i in range(1, len(coords) - 1):
        d = point_line_distance(coords[i], first, last)
        if d > max_dist:
            max_dist = d
            max_idx = i

    if max_dist > tolerance:
        left = simplify_coords(coords[:max_idx + 1], tolerance)
        right = simplify_coords(coords[max_idx:], tolerance)
        return left[:-1] + right
    else:
        return [first, last]


def point_line_distance(point, line_start, line_end):
    """Perpendicular distance from point to line segment."""
    x0, y0 = point[0], point[1]
    x1, y1 = line_start[0], line_start[1]
    x2, y2 = line_end[0], line_end[1]

    dx = x2 - x1
    dy = y2 - y1

    if dx == 0 and dy == 0:
        return math.sqrt((x0 - x1) ** 2 + (y0 - y1) ** 2)

    t = max(0, min(1, ((x0 - x1) * dx + (y0 - y1) * dy) / (dx * dx + dy * dy)))
    proj_x = x1 + t * dx
    proj_y = y1 + t * dy

    return math.sqrt((x0 - proj_x) ** 2 + (y0 - proj_y) ** 2)


def simplify_geometry(geometry, tolerance=0.005):
    """Simplify any GeoJSON geometry."""
    gtype = geometry.get("type")
    coords = geometry.get("coordinates")

    if not gtype or not coords:
        return geometry

    if gtype == "Point":
        # Round coordinates
        return {
            "type": "Point",
            "coordinates": [round(coords[0], 4), round(coords[1], 4)]
        }

    elif gtype == "LineString":
        simplified = simplify_coords(coords, tolerance)
        return {"type": "LineString", "coordinates": [[round(c[0], 4), round(c[1], 4)] for c in simplified]}

    elif gtype == "MultiLineString":
        new_lines = []
        for line in coords:
            simplified = simplify_coords(line, tolerance)
            if len(simplified) >= 2:
                new_lines.append([[round(c[0], 4), round(c[1], 4)] for c in simplified])
        return {"type": "MultiLineString", "coordinates": new_lines}

    elif gtype == "Polygon":
        new_rings = []
        for ring in coords:
            simplified = simplify_coords(ring, tolerance)
            if len(simplified) >= 4:  # Minimum for a closed polygon
                new_rings.append([[round(c[0], 4), round(c[1], 4)] for c in simplified])
        if new_rings:
            return {"type": "Polygon", "coordinates": new_rings}
        return None

    elif gtype == "MultiPolygon":
        new_polys = []
        for polygon in coords:
            new_rings = []
            for ring in polygon:
                simplified = simplify_coords(ring, tolerance)
                if len(simplified) >= 4:
                    new_rings.append([[round(c[0], 4), round(c[1], 4)] for c in simplified])
            if new_rings:
                new_polys.append(new_rings)
        if new_polys:
            return {"type": "MultiPolygon", "coordinates": new_polys}
        return None

    return geometry


def process_ductos():
    """
    Ductos: 71k features, 99MB. Strategy:
    - Only keep oleoductos and gasoductos (skip agua, poliductos)
    - Simplify geometry aggressively
    - Limit to main infrastructure
    """
    print("\n[DUCTOS] Processing 99MB file...")
    path = f"{INPUT_DIR}/ductos.geojson"

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    features = data["features"]
    print(f"  Input: {len(features)} features")

    # Check what fields we have
    if features:
        sample_props = features[0].get("properties", {})
        print(f"  Sample props keys: {list(sample_props.keys())}")
        # Check for tipo_ducto or similar field
        tipo_vals = set()
        for feat in features[:1000]:
            props = feat.get("properties", {})
            for key in ["tipo_ducto", "tipo", "fluido", "producto", "descripcion"]:
                val = props.get(key)
                if val:
                    tipo_vals.add(f"{key}={val}")
        print(f"  Type values (sample): {list(tipo_vals)[:20]}")

    # Simplify all features with aggressive tolerance
    simplified = []
    for feat in features:
        geom = simplify_geometry(feat["geometry"], tolerance=0.01)
        if geom:
            # Keep only essential properties
            props = feat.get("properties", {})
            slim_props = {}
            for key in ["nombre", "tipo_ducto", "tipo", "fluido", "empresa", "operadora",
                        "producto", "diametro", "provincia", "longitud_km"]:
                if key in props and props[key]:
                    slim_props[key] = props[key]
            simplified.append({
                "type": "Feature",
                "geometry": geom,
                "properties": slim_props,
            })

    result = {"type": "FeatureCollection", "features": simplified}
    out_path = f"{OUTPUT_DIR}/ductos.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False)

    size_kb = os.path.getsize(out_path) // 1024
    print(f"  Output: {len(simplified)} features ({size_kb} KB)")

    # If still too large, take a more aggressive approach
    if size_kb > 5000:
        print(f"  Still too large ({size_kb} KB). Sampling every 10th feature...")
        sampled = simplified[::10]
        result = {"type": "FeatureCollection", "features": sampled}
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False)
        size_kb = os.path.getsize(out_path) // 1024
        print(f"  Sampled: {len(sampled)} features ({size_kb} KB)")

        if size_kb > 3000:
            print(f"  Still too large. Sampling every 50th...")
            sampled = simplified[::50]
            result = {"type": "FeatureCollection", "features": sampled}
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False)
            size_kb = os.path.getsize(out_path) // 1024
            print(f"  Final: {len(sampled)} features ({size_kb} KB)")


def process_yacimientos():
    """Yacimientos: 879 features, 8.8MB. Simplify polygons."""
    print("\n[YACIMIENTOS] Processing...")
    path = f"{INPUT_DIR}/yacimientos.geojson"

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    features = []
    for feat in data["features"]:
        geom = simplify_geometry(feat["geometry"], tolerance=0.003)
        if geom:
            features.append({
                "type": "Feature",
                "geometry": geom,
                "properties": feat.get("properties", {}),
            })

    result = {"type": "FeatureCollection", "features": features}
    out_path = f"{OUTPUT_DIR}/yacimientos.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False)

    size_kb = os.path.getsize(out_path) // 1024
    print(f"  {len(features)} features ({size_kb} KB)")


def process_gasoductos():
    """Gasoductos: 3000 features, 9.7MB. Keep only transporte troncal."""
    print("\n[GASODUCTOS] Processing...")
    path = f"{INPUT_DIR}/gasoductos.geojson"

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    features = []
    # Only keep transporte (not distribucion, which are thousands of small segments)
    for feat in data["features"]:
        props = feat.get("properties", {})
        tipo = props.get("tipo", "")

        if tipo == "transporte":
            geom = simplify_geometry(feat["geometry"], tolerance=0.005)
            if geom:
                slim_props = {}
                for key in ["nombre", "tipo", "concesion", "presion_disenio"]:
                    if key in props and props[key]:
                        slim_props[key] = props[key]
                features.append({
                    "type": "Feature",
                    "geometry": geom,
                    "properties": slim_props,
                })

    # If no transporte-tagged features, keep all but simplify aggressively
    if not features:
        print("  No 'transporte' tag found, keeping all simplified...")
        for feat in data["features"]:
            geom = simplify_geometry(feat["geometry"], tolerance=0.01)
            if geom:
                props = feat.get("properties", {})
                slim_props = {}
                for key in ["nombre", "tipo", "concesion"]:
                    if key in props and props[key]:
                        slim_props[key] = props[key]
                features.append({
                    "type": "Feature",
                    "geometry": geom,
                    "properties": slim_props,
                })

    result = {"type": "FeatureCollection", "features": features}
    out_path = f"{OUTPUT_DIR}/gasoductos.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False)

    size_kb = os.path.getsize(out_path) // 1024
    print(f"  {len(features)} features ({size_kb} KB)")


def process_lineas():
    """Lineas electricas: 1297 features, 2.7MB. Simplify."""
    print("\n[LINEAS ELECTRICAS] Processing...")
    path = f"{INPUT_DIR}/lineas_electricas.geojson"

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    features = []
    for feat in data["features"]:
        geom = simplify_geometry(feat["geometry"], tolerance=0.005)
        if geom:
            props = feat.get("properties", {})
            slim_props = {}
            for key in ["nombre", "tension", "propiedad", "concesion"]:
                if key in props and props[key]:
                    slim_props[key] = props[key]
            features.append({
                "type": "Feature",
                "geometry": geom,
                "properties": slim_props,
            })

    result = {"type": "FeatureCollection", "features": features}
    out_path = f"{OUTPUT_DIR}/lineas_electricas.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False)

    size_kb = os.path.getsize(out_path) // 1024
    print(f"  {len(features)} features ({size_kb} KB)")


def copy_light_files():
    """Copy small files directly to output."""
    print("\n[SMALL FILES] Copying...")

    for name in ["centrales", "refinerias", "estaciones_bombeo"]:
        src = f"{INPUT_DIR}/{name}.geojson"
        if not os.path.exists(src):
            print(f"  {name}: not found")
            continue

        with open(src, "r", encoding="utf-8") as f:
            data = json.load(f)

        out_path = f"{OUTPUT_DIR}/{name}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)

        size_kb = os.path.getsize(out_path) // 1024
        feats = len(data.get("features", []))
        print(f"  {name}.json: {feats} features ({size_kb} KB)")


def process_produccion():
    """Convert production data to a JS-friendly format."""
    print("\n[PRODUCCION] Processing...")

    raw_2026 = "data/raw/produccion_2026_agregada.json"
    raw_2025 = "data/raw/produccion_2025_agregada.json"

    if os.path.exists(raw_2026):
        with open(raw_2026, "r", encoding="utf-8") as f:
            data_2026 = json.load(f)
        print(f"  2026: {len(data_2026)} rows")
    else:
        data_2026 = []

    if os.path.exists(raw_2025):
        with open(raw_2025, "r", encoding="utf-8") as f:
            data_2025 = json.load(f)
        print(f"  2025: {len(data_2025)} rows")
    else:
        data_2025 = []

    # Combine
    combined = {"year_2025": data_2025, "year_2026": data_2026}
    out_path = f"{OUTPUT_DIR}/produccion.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)

    size_kb = os.path.getsize(out_path) // 1024
    print(f"  produccion.json: {size_kb} KB")


def main():
    print("=" * 60)
    print("OPTIMIZACION DE GeoJSON PARA FRONTEND")
    print("=" * 60)

    process_ductos()
    process_yacimientos()
    process_gasoductos()
    process_lineas()
    copy_light_files()
    process_produccion()

    print("\n" + "=" * 60)
    print("RESULTADO FINAL")
    print("=" * 60)

    total = 0
    for f in sorted(os.listdir(OUTPUT_DIR)):
        if f.endswith(".json"):
            size = os.path.getsize(os.path.join(OUTPUT_DIR, f))
            total += size
            print(f"  {f:35s} {size // 1024:>6d} KB")

    print(f"  {'TOTAL':35s} {total // 1024:>6d} KB")


if __name__ == "__main__":
    main()
