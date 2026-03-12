"""
EXTRACCION DE DATOS - DATOS ENERGIA ARGENTINA
Fuente: datos.energia.gob.ar (API CKAN 2.5)

Descarga datasets clave de energia y los convierte a GeoJSON
para usar como capas estaticas en el mapa Leaflet.
"""

import requests
import pandas as pd
import json
import time
import os
import sys

BASE_URL = "http://datos.energia.gob.ar/api/3/action"
RAW_DIR = "data/raw"
GEOJSON_DIR = "data/geojson"

os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(GEOJSON_DIR, exist_ok=True)


def fetch_all_records(resource_id, batch_size=5000, max_records=None):
    """Descarga todos los registros de un recurso CKAN con paginacion."""
    all_records = []
    offset = 0

    while True:
        url = f"{BASE_URL}/datastore_search"
        params = {
            "resource_id": resource_id,
            "limit": batch_size,
            "offset": offset,
        }

        try:
            resp = requests.get(url, params=params, timeout=120)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            print(f"  Error fetching offset {offset}: {e}")
            break

        if not data.get("success"):
            print(f"  API error: {data.get('error')}")
            break

        records = data["result"]["records"]
        total = data["result"]["total"]

        if not records:
            break

        all_records.extend(records)
        offset += batch_size

        print(f"  Descargados {len(all_records)}/{total} registros...", end="\r")

        if max_records and len(all_records) >= max_records:
            print(f"\n  Limite alcanzado ({max_records})")
            break

        if offset >= total:
            break

        time.sleep(0.3)

    print(f"  Total: {len(all_records)} registros                ")
    return all_records


def fetch_sql(sql_query):
    """Ejecuta consulta SQL sobre el datastore."""
    url = f"{BASE_URL}/datastore_search_sql"
    params = {"sql": sql_query}

    resp = requests.get(url, params=params, timeout=120)
    resp.raise_for_status()
    data = resp.json()

    if not data.get("success"):
        raise Exception(f"SQL error: {data.get('error')}")

    return data["result"]["records"]


def get_resource_ids(dataset_id):
    """Obtiene los resource IDs actualizados de un dataset."""
    url = f"{BASE_URL}/package_show"
    params = {"id": dataset_id}
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    if not data.get("success"):
        return []

    return data["result"]["resources"]


def download_file(url, output_path):
    """Descarga un archivo directo."""
    try:
        resp = requests.get(url, stream=True, timeout=120)
        resp.raise_for_status()
        with open(output_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)
        return True
    except Exception as e:
        print(f"  Error descargando {url}: {e}")
        return False


# ==============================================================
# CAPA 1: YACIMIENTOS (879 poligonos con geojson embebido)
# ==============================================================
def extract_yacimientos():
    print("\n" + "=" * 60)
    print("[1/7] YACIMIENTOS DE HIDROCARBUROS")
    print("=" * 60)

    resource_id = "6130ac5d-e78e-4aef-9925-030db6434c56"
    records = fetch_all_records(resource_id)

    features = []
    for rec in records:
        geojson_str = rec.get("geojson")
        if not geojson_str:
            continue

        try:
            geometry = json.loads(geojson_str) if isinstance(geojson_str, str) else geojson_str
        except:
            continue

        props = {
            "nombre": rec.get("areayacimiento", ""),
            "empresa": rec.get("empresa_operadora", ""),
            "id": rec.get("idya", ""),
        }
        features.append({
            "type": "Feature",
            "geometry": geometry,
            "properties": props,
        })

    geojson = {"type": "FeatureCollection", "features": features}
    path = f"{GEOJSON_DIR}/yacimientos.geojson"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False)

    size_kb = os.path.getsize(path) // 1024
    print(f"  -> yacimientos.geojson: {len(features)} features ({size_kb} KB)")
    return len(features)


# ==============================================================
# CAPA 2: REFINERIAS (puntos)
# ==============================================================
def extract_refinerias():
    print("\n" + "=" * 60)
    print("[2/7] REFINERIAS DE HIDROCARBUROS")
    print("=" * 60)

    resource_id = "fcad1e1a-1cb1-4ef8-8529-ea4ee5ef548a"
    records = fetch_all_records(resource_id)

    features = []
    for rec in records:
        geojson_str = rec.get("geojson")
        if not geojson_str:
            continue

        try:
            geometry = json.loads(geojson_str) if isinstance(geojson_str, str) else geojson_str
        except:
            continue

        props = {k: v for k, v in rec.items() if k != "geojson" and k != "_id"}
        features.append({
            "type": "Feature",
            "geometry": geometry,
            "properties": props,
        })

    geojson = {"type": "FeatureCollection", "features": features}
    path = f"{GEOJSON_DIR}/refinerias.geojson"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False)

    print(f"  -> refinerias.geojson: {len(features)} features")
    return len(features)


# ==============================================================
# CAPA 3: DUCTOS DE HIDROCARBUROS (lineas)
# ==============================================================
def extract_ductos():
    print("\n" + "=" * 60)
    print("[3/7] DUCTOS DE HIDROCARBUROS (Res. 319/93)")
    print("=" * 60)

    resource_id = "857bd3ad-9a8b-4cf9-8e25-a8bc73f3282f"
    records = fetch_all_records(resource_id)

    features = []
    for rec in records:
        geojson_str = rec.get("geojson")
        if not geojson_str:
            continue

        try:
            geometry = json.loads(geojson_str) if isinstance(geojson_str, str) else geojson_str
        except:
            continue

        props = {k: v for k, v in rec.items() if k != "geojson" and k != "_id"}
        features.append({
            "type": "Feature",
            "geometry": geometry,
            "properties": props,
        })

    geojson = {"type": "FeatureCollection", "features": features}
    path = f"{GEOJSON_DIR}/ductos.geojson"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False)

    size_kb = os.path.getsize(path) // 1024
    print(f"  -> ductos.geojson: {len(features)} features ({size_kb} KB)")
    return len(features)


# ==============================================================
# CAPA 4: GASODUCTOS ENARGAS (lineas troncales)
# ==============================================================
def extract_gasoductos():
    print("\n" + "=" * 60)
    print("[4/7] GASODUCTOS ENARGAS")
    print("=" * 60)

    # Gasoductos de transporte
    resource_id = "e3459bc5-4aaa-4065-9b06-c169fbd0ec74"
    records = fetch_all_records(resource_id)

    features = []
    for rec in records:
        geojson_str = rec.get("geojson")
        if not geojson_str:
            continue

        try:
            geometry = json.loads(geojson_str) if isinstance(geojson_str, str) else geojson_str
        except:
            continue

        props = {k: v for k, v in rec.items() if k != "geojson" and k != "_id"}
        props["tipo"] = "transporte"
        features.append({
            "type": "Feature",
            "geometry": geometry,
            "properties": props,
        })

    # Tambien gasoductos de distribucion
    resource_id_dist = "3f7f87ab-bdcf-4a21-b361-f59732754330"
    try:
        records_dist = fetch_all_records(resource_id_dist)
        for rec in records_dist:
            geojson_str = rec.get("geojson")
            if not geojson_str:
                continue
            try:
                geometry = json.loads(geojson_str) if isinstance(geojson_str, str) else geojson_str
            except:
                continue
            props = {k: v for k, v in rec.items() if k != "geojson" and k != "_id"}
            props["tipo"] = "distribucion"
            features.append({
                "type": "Feature",
                "geometry": geometry,
                "properties": props,
            })
    except Exception as e:
        print(f"  Gasoductos distribucion: {e}")

    geojson = {"type": "FeatureCollection", "features": features}
    path = f"{GEOJSON_DIR}/gasoductos.geojson"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False)

    size_kb = os.path.getsize(path) // 1024
    print(f"  -> gasoductos.geojson: {len(features)} features ({size_kb} KB)")
    return len(features)


# ==============================================================
# CAPA 5: CENTRALES DE GENERACION ELECTRICA
# ==============================================================
def extract_centrales():
    print("\n" + "=" * 60)
    print("[5/7] CENTRALES DE GENERACION ELECTRICA")
    print("=" * 60)

    resources = get_resource_ids("generacion-electrica-centrales-de-generacion-")
    if not resources:
        print("  Dataset no encontrado")
        return 0

    print(f"  {len(resources)} recursos encontrados:")
    for r in resources:
        print(f"    {r['name']} ({r['format']}) - {r['id']}")

    features = []

    for r in resources:
        fmt = r.get("format", "").upper()
        if fmt not in ["CSV", "XLS", "XLSX"]:
            continue

        print(f"\n  Intentando recurso: {r['name']}...")
        try:
            records = fetch_all_records(r["id"])
            if not records:
                continue

            # Inspeccionar columnas
            cols = list(records[0].keys()) if records else []
            print(f"  Columnas: {cols}")

            # Buscar columnas de coordenadas
            lat_cols = [c for c in cols if any(x in c.lower() for x in ["lat", "coordx", "coord_x"])]
            lon_cols = [c for c in cols if any(x in c.lower() for x in ["lon", "lng", "coordy", "coord_y", "long"])]

            # Tambien buscar geojson embebido
            geojson_col = [c for c in cols if "geojson" in c.lower()]

            if geojson_col:
                for rec in records:
                    geojson_str = rec.get(geojson_col[0])
                    if not geojson_str:
                        continue
                    try:
                        geometry = json.loads(geojson_str) if isinstance(geojson_str, str) else geojson_str
                    except:
                        continue
                    props = {k: v for k, v in rec.items() if k != geojson_col[0] and k != "_id"}
                    features.append({
                        "type": "Feature",
                        "geometry": geometry,
                        "properties": props,
                    })
                print(f"  -> {len(features)} centrales con geojson")
                break

            elif lat_cols and lon_cols:
                for rec in records:
                    try:
                        lat = float(rec[lat_cols[0]])
                        lon = float(rec[lon_cols[0]])
                        if -56 <= lat <= -21 and -74 <= lon <= -53:
                            props = {k: v for k, v in rec.items()
                                     if k not in [lat_cols[0], lon_cols[0], "_id"]}
                            features.append({
                                "type": "Feature",
                                "geometry": {"type": "Point", "coordinates": [lon, lat]},
                                "properties": props,
                            })
                    except:
                        continue
                print(f"  -> {len(features)} centrales con coords")
                break

            else:
                print(f"  Sin coordenadas detectadas")
                # Guardar CSV raw para inspeccion
                df = pd.DataFrame(records)
                df.to_csv(f"{RAW_DIR}/centrales_raw.csv", index=False, encoding="utf-8")
                print(f"  Guardado en {RAW_DIR}/centrales_raw.csv para inspeccion")

        except Exception as e:
            print(f"  Error: {e}")

    if features:
        geojson = {"type": "FeatureCollection", "features": features}
        path = f"{GEOJSON_DIR}/centrales.geojson"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(geojson, f, ensure_ascii=False)
        print(f"  -> centrales.geojson: {len(features)} features")

    return len(features)


# ==============================================================
# CAPA 6: PRODUCCION AGREGADA POR PROVINCIA (2024-2026)
# ==============================================================
def extract_produccion():
    print("\n" + "=" * 60)
    print("[6/7] PRODUCCION AGREGADA POR PROVINCIA")
    print("=" * 60)

    # Usar recurso 2026
    resource_id = "fb7a47a0-cba9-4667-a004-6f6c1c346c23"

    # Intentar SQL aggregation primero
    sql = f'''
    SELECT
        provincia,
        cuenca,
        tipo_de_recurso,
        sub_tipo_recurso,
        SUM(CAST(prod_pet AS FLOAT)) as total_petroleo_m3,
        SUM(CAST(prod_gas AS FLOAT)) as total_gas_miles_m3,
        COUNT(DISTINCT sigla) as cantidad_pozos,
        COUNT(DISTINCT empresa) as cantidad_empresas
    FROM "{resource_id}"
    GROUP BY provincia, cuenca, tipo_de_recurso, sub_tipo_recurso
    ORDER BY total_petroleo_m3 DESC
    '''

    try:
        print("  Intentando SQL aggregation...")
        records = fetch_sql(sql)
        print(f"  -> {len(records)} filas de produccion agregada 2026")

        path = f"{RAW_DIR}/produccion_2026_agregada.json"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(records, f, ensure_ascii=False, indent=2)

    except Exception as e:
        print(f"  SQL fallo: {e}")
        print("  Descargando registros directos (primeros 10000)...")
        records = fetch_all_records(resource_id, max_records=10000)

        if records:
            df = pd.DataFrame(records)
            # Agregar manualmente
            for col in ["prod_pet", "prod_gas", "prod_agua"]:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors="coerce")

            agg = df.groupby(["provincia", "cuenca", "tipo_de_recurso"]).agg(
                total_petroleo_m3=("prod_pet", "sum"),
                total_gas_miles_m3=("prod_gas", "sum"),
                cantidad_pozos=("sigla", "nunique"),
            ).reset_index()

            path = f"{RAW_DIR}/produccion_2026_agregada.json"
            agg.to_json(path, orient="records", force_ascii=False, indent=2)
            print(f"  -> {len(agg)} filas agregadas")

    # Tambien descargar 2025 para comparacion
    resource_id_2025 = "6f9f63bd-3f7e-43ab-8743-85997ae1380c"
    sql_2025 = f'''
    SELECT
        provincia,
        cuenca,
        tipo_de_recurso,
        SUM(CAST(prod_pet AS FLOAT)) as total_petroleo_m3,
        SUM(CAST(prod_gas AS FLOAT)) as total_gas_miles_m3,
        COUNT(DISTINCT sigla) as cantidad_pozos
    FROM "{resource_id_2025}"
    GROUP BY provincia, cuenca, tipo_de_recurso
    ORDER BY total_petroleo_m3 DESC
    '''

    try:
        records_2025 = fetch_sql(sql_2025)
        path = f"{RAW_DIR}/produccion_2025_agregada.json"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(records_2025, f, ensure_ascii=False, indent=2)
        print(f"  -> {len(records_2025)} filas de produccion 2025")
    except Exception as e:
        print(f"  2025 SQL fallo: {e}")

    return True


# ==============================================================
# CAPA 7: TRANSPORTE ELECTRICO AT LINEAS
# ==============================================================
def extract_lineas_electricas():
    print("\n" + "=" * 60)
    print("[7/7] TRANSPORTE ELECTRICO AT LINEAS")
    print("=" * 60)

    resources = get_resource_ids("transporte-electrico-at-lineas-")
    if not resources:
        print("  Dataset no encontrado")
        return 0

    print(f"  {len(resources)} recursos:")
    for r in resources:
        print(f"    {r['name']} ({r['format']}) - {r['id']}")

    features = []

    for r in resources:
        fmt = r.get("format", "").upper()
        if fmt not in ["CSV"]:
            continue

        try:
            records = fetch_all_records(r["id"])
            if not records:
                continue

            cols = list(records[0].keys()) if records else []
            print(f"  Columnas: {cols}")

            geojson_col = [c for c in cols if "geojson" in c.lower()]

            if geojson_col:
                for rec in records:
                    geojson_str = rec.get(geojson_col[0])
                    if not geojson_str:
                        continue
                    try:
                        geometry = json.loads(geojson_str) if isinstance(geojson_str, str) else geojson_str
                    except:
                        continue
                    props = {k: v for k, v in rec.items() if k != geojson_col[0] and k != "_id"}
                    features.append({
                        "type": "Feature",
                        "geometry": geometry,
                        "properties": props,
                    })
                break
            else:
                # Guardar raw
                df = pd.DataFrame(records)
                df.to_csv(f"{RAW_DIR}/lineas_at_raw.csv", index=False, encoding="utf-8")
                print(f"  Sin geojson, guardado CSV raw")

        except Exception as e:
            print(f"  Error: {e}")

    if features:
        geojson = {"type": "FeatureCollection", "features": features}
        path = f"{GEOJSON_DIR}/lineas_electricas.geojson"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(geojson, f, ensure_ascii=False)
        size_kb = os.path.getsize(path) // 1024
        print(f"  -> lineas_electricas.geojson: {len(features)} features ({size_kb} KB)")

    return len(features)


# ==============================================================
# CAPA EXTRA: CONCESIONES DE EXPLOTACION (poligonos)
# ==============================================================
def extract_concesiones():
    print("\n" + "=" * 60)
    print("[EXTRA] CONCESIONES DE EXPLOTACION")
    print("=" * 60)

    resources = get_resource_ids("produccion-hidrocarburos-concesiones-de-explotacion")
    if not resources:
        print("  Dataset no encontrado")
        return 0

    print(f"  {len(resources)} recursos:")
    for r in resources:
        print(f"    {r['name']} ({r['format']}) - {r['id']}")

    features = []

    for r in resources:
        fmt = r.get("format", "").upper()
        if fmt not in ["CSV"]:
            continue

        try:
            records = fetch_all_records(r["id"])
            if not records:
                continue

            cols = list(records[0].keys()) if records else []
            print(f"  Columnas: {cols}")

            geojson_col = [c for c in cols if "geojson" in c.lower()]

            if geojson_col:
                for rec in records:
                    geojson_str = rec.get(geojson_col[0])
                    if not geojson_str:
                        continue
                    try:
                        geometry = json.loads(geojson_str) if isinstance(geojson_str, str) else geojson_str
                    except:
                        continue
                    props = {k: v for k, v in rec.items() if k != geojson_col[0] and k != "_id"}
                    features.append({
                        "type": "Feature",
                        "geometry": geometry,
                        "properties": props,
                    })
                break

        except Exception as e:
            print(f"  Error: {e}")

    if features:
        geojson = {"type": "FeatureCollection", "features": features}
        path = f"{GEOJSON_DIR}/concesiones.geojson"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(geojson, f, ensure_ascii=False)
        size_kb = os.path.getsize(path) // 1024
        print(f"  -> concesiones.geojson: {len(features)} features ({size_kb} KB)")

    return len(features)


# ==============================================================
# CAPA EXTRA: RESERVAS POR PROVINCIA
# ==============================================================
def extract_reservas():
    print("\n" + "=" * 60)
    print("[EXTRA] RESERVAS DE PETROLEO Y GAS")
    print("=" * 60)

    resources = get_resource_ids("reservas-de-petroleo-y-gas")
    if not resources:
        print("  Dataset no encontrado")
        return 0

    for r in resources:
        fmt = r.get("format", "").upper()
        print(f"  {r['name']} ({fmt}) - {r['id']}")

        if fmt in ["CSV", "XLS", "XLSX"]:
            try:
                records = fetch_all_records(r["id"], max_records=5000)
                if records:
                    cols = list(records[0].keys())
                    print(f"    Columnas: {cols}")
                    path = f"{RAW_DIR}/reservas_raw.json"
                    with open(path, "w", encoding="utf-8") as f:
                        json.dump(records, f, ensure_ascii=False, indent=2)
                    print(f"    -> {len(records)} registros guardados")
                    return len(records)
            except Exception as e:
                print(f"    Error: {e}")

    return 0


# ==============================================================
# CAPA EXTRA: ESTACIONES DE BOMBEO
# ==============================================================
def extract_bombeo():
    print("\n" + "=" * 60)
    print("[EXTRA] ESTACIONES DE BOMBEO")
    print("=" * 60)

    resources = get_resource_ids("estaciones-de-bombeo")
    if not resources:
        print("  Dataset no encontrado")
        return 0

    features = []

    for r in resources:
        fmt = r.get("format", "").upper()
        print(f"  {r['name']} ({fmt}) - {r['id']}")

        if fmt in ["CSV"]:
            try:
                records = fetch_all_records(r["id"])
                if not records:
                    continue

                cols = list(records[0].keys())
                print(f"    Columnas: {cols}")

                geojson_col = [c for c in cols if "geojson" in c.lower()]
                if geojson_col:
                    for rec in records:
                        geojson_str = rec.get(geojson_col[0])
                        if not geojson_str:
                            continue
                        try:
                            geometry = json.loads(geojson_str) if isinstance(geojson_str, str) else geojson_str
                        except:
                            continue
                        props = {k: v for k, v in rec.items() if k != geojson_col[0] and k != "_id"}
                        features.append({
                            "type": "Feature",
                            "geometry": geometry,
                            "properties": props,
                        })
                    break

            except Exception as e:
                print(f"    Error: {e}")

    if features:
        geojson = {"type": "FeatureCollection", "features": features}
        path = f"{GEOJSON_DIR}/estaciones_bombeo.geojson"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(geojson, f, ensure_ascii=False)
        print(f"  -> estaciones_bombeo.geojson: {len(features)} features")

    return len(features)


# ==============================================================
# MAIN
# ==============================================================
def main():
    print("=" * 60)
    print("EXTRACCION DE DATOS - ENERGIA ARGENTINA")
    print("Fuente: datos.energia.gob.ar")
    print("=" * 60)

    results = {}

    # Capas principales
    results["yacimientos"] = extract_yacimientos()
    results["refinerias"] = extract_refinerias()
    results["ductos"] = extract_ductos()
    results["gasoductos"] = extract_gasoductos()
    results["centrales"] = extract_centrales()
    results["produccion"] = extract_produccion()
    results["lineas_electricas"] = extract_lineas_electricas()

    # Capas extra
    results["concesiones"] = extract_concesiones()
    results["reservas"] = extract_reservas()
    results["bombeo"] = extract_bombeo()

    print("\n" + "=" * 60)
    print("RESUMEN")
    print("=" * 60)
    for name, count in results.items():
        status = f"{count} features/registros" if count else "NO DISPONIBLE"
        print(f"  {name:25s} {status}")

    # Listar archivos generados
    print(f"\nArchivos en {GEOJSON_DIR}/:")
    for f in sorted(os.listdir(GEOJSON_DIR)):
        size = os.path.getsize(os.path.join(GEOJSON_DIR, f))
        print(f"  {f:40s} {size // 1024:>6d} KB")

    print(f"\nArchivos en {RAW_DIR}/:")
    for f in sorted(os.listdir(RAW_DIR)):
        size = os.path.getsize(os.path.join(RAW_DIR, f))
        print(f"  {f:40s} {size // 1024:>6d} KB")


if __name__ == "__main__":
    main()
