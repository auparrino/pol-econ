/**
 * Download and process energy overlay data from datos.energia.gob.ar
 *
 * Outputs GeoJSON files matching the format used by EnergyLayers.jsx:
 *   - src/data/energy/yacimientos.json  (MultiPolygon, properties: nombre, empresa, id, provincia, oil_bpd, gas_mm3d, cuenca)
 *   - src/data/energy/refinerias.json   (Point, properties: empresa, provincia, planta, departamento, ...)
 *   - src/data/energy/centrales.json    (Point, properties: nombre, tecnologia, tecnologia_etiqueta, potencia_instalada_mw, provincia, ...)
 *   - src/data/energy/gasoductos.json   (MultiLineString — requires Shapefile, skipped)
 *
 * Usage:  node scripts/update-energy-overlays.mjs
 */

import { createReadStream, createWriteStream, existsSync, mkdirSync } from 'fs';
import { writeFile, readFile } from 'fs/promises';
import { parse } from 'csv-parse';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RAW_DIR = join(__dirname, 'raw');
const ENERGY_DIR = join(__dirname, '..', 'src', 'data', 'energy');

// Ensure directories exist
if (!existsSync(RAW_DIR)) mkdirSync(RAW_DIR, { recursive: true });
if (!existsSync(ENERGY_DIR)) mkdirSync(ENERGY_DIR, { recursive: true });

const URLS = {
  yacimientos: 'http://datos.energia.gob.ar/dataset/7378520e-4d10-48a9-92e9-7e20e69a8277/resource/6130ac5d-e78e-4aef-9925-030db6434c56/download/produccin-hidrocarburos-yacimientos.csv',
  refinerias: 'http://datos.energia.gob.ar/dataset/a9eed347-78ab-45c0-a489-b227fe42ee1b/resource/fcad1e1a-1cb1-4ef8-8529-ea4ee5ef548a/download/refinacin-hidrocarburos-refineras.csv',
  centrales: 'http://datos.energia.gob.ar/dataset/c62df6c6-73af-4039-b956-db081ff6eebe/resource/230fdf38-8f12-4017-a1e8-d7a1bc4a1c1c/download/generacin-elctrica-centrales-de-generacin.csv',
  potencia: 'http://datos.energia.gob.ar/dataset/2b4dfee6-6fca-4e4d-9611-a12d65cd4aa8/resource/b05fbb16-7278-463f-8895-087e2495bfee/download/potencia-instalada.csv',
  gasoductos_shp: 'http://datos.energia.gob.ar/dataset/gasoductos-enargas',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function download(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(destPath);
    const proto = url.startsWith('https') ? https : http;

    function doRequest(reqUrl, redirects = 0) {
      if (redirects > 5) return reject(new Error('Too many redirects'));
      const p = reqUrl.startsWith('https') ? https : http;
      p.get(reqUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return doRequest(res.headers.location, redirects + 1);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for ${reqUrl}`));
        }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', reject);
    }

    doRequest(url);
  });
}

function parseCSV(filePath, options = {}) {
  return new Promise((resolve, reject) => {
    const rows = [];
    createReadStream(filePath, { encoding: 'utf-8' })
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        relax_quotes: true,
        bom: true,
        trim: true,
        ...options,
      }))
      .on('data', (row) => rows.push(row))
      .on('error', reject)
      .on('end', () => resolve(rows));
  });
}

/** Try to parse a GeoJSON geometry string from a CSV column */
function parseGeoColumn(value) {
  if (!value) return null;
  try {
    const geo = JSON.parse(value);
    if (geo && geo.type && (geo.coordinates || geo.geometries)) return geo;
  } catch { /* ignore */ }
  return null;
}

/** Parse a WKT POINT string like "POINT(-68.5 -38.9)" */
function parseWKTPoint(value) {
  if (!value) return null;
  const m = value.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
  if (m) return { type: 'Point', coordinates: [parseFloat(m[1]), parseFloat(m[2])] };
  return null;
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

// ─── 1. Yacimientos ────────────────────────────────────────────────────────────

/**
 * The geometry CSV (produccin-hidrocarburos-yacimientos.csv) has columns:
 *   idya, areayacimiento, empresa_informante, idempresa_informante,
 *   empresa_operadora, idempresa_operadora, alta_planos_base,
 *   modificacion_planos_base, geojson
 *
 * Production data comes from the per-well CSV (oilgas_2025.csv) which has:
 *   idareayacimiento, areayacimiento, cuenca, provincia, prod_pet, prod_gas, ...
 *
 * We merge them by idya ↔ idareayacimiento.
 */
async function processYacimientos() {
  console.log('\n=== YACIMIENTOS (HC Fields) ===');
  const csvPath = join(RAW_DIR, 'yacimientos.csv');
  const prodCsvPath = join(RAW_DIR, 'oilgas_2025.csv');

  console.log('Downloading geometry CSV...');
  await download(URLS.yacimientos, csvPath);
  console.log('Parsing geometry CSV...');
  const geoRows = await parseCSV(csvPath);
  console.log(`  Geometry rows: ${geoRows.length}`);

  // Build geometry lookup by idya
  const geoMap = new Map(); // idya → { geometry, nombre, empresa }
  for (const row of geoRows) {
    const id = (row.idya || '').trim();
    if (!id) continue;
    let geometry = parseGeoColumn(row.geojson);
    if (!geometry) continue;
    geoMap.set(id, {
      geometry,
      nombre: (row.areayacimiento || '').trim(),
      empresa: (row.empresa_operadora || row.empresa_informante || '').trim(),
    });
  }
  console.log(`  Fields with geometry: ${geoMap.size}`);

  // Aggregate production data from the per-well CSV if available
  const prodMap = new Map(); // idareayacimiento → { oil_m3, gas_km3, cuenca, provincia, months }
  const M3_TO_BBL = 6.28981;

  if (existsSync(prodCsvPath)) {
    console.log('Aggregating production from oilgas_2025.csv (this may take a minute)...');
    let rowCount = 0;

    const parser = createReadStream(prodCsvPath, { encoding: 'utf-8' })
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        bom: true,
        trim: true,
      }));

    // Collect unique (field, year, month) combos to compute monthly averages
    const fieldMonths = new Map(); // id → Set of "YYYY-MM"

    for await (const row of parser) {
      rowCount++;
      if (rowCount % 200000 === 0) console.log(`    processed ${rowCount} rows...`);

      const id = (row.idareayacimiento || '').trim();
      if (!id) continue;

      const oil = parseFloat(row.prod_pet) || 0;   // m³
      const gas = parseFloat(row.prod_gas) || 0;    // thousands m³

      if (!prodMap.has(id)) {
        prodMap.set(id, {
          oil_m3: 0,
          gas_km3: 0,
          cuenca: (row.cuenca || '').trim(),
          provincia: (row.provincia || '').trim(),
        });
        fieldMonths.set(id, new Set());
      }

      const p = prodMap.get(id);
      p.oil_m3 += oil;
      p.gas_km3 += gas;

      const ym = `${row.anio}-${row.mes}`;
      fieldMonths.get(id).add(ym);
    }

    // Convert totals to daily averages
    for (const [id, p] of prodMap) {
      const months = fieldMonths.get(id)?.size || 1;
      // Average monthly production, then daily
      p.oil_bpd = p.oil_m3 > 0 ? Math.round((p.oil_m3 / months) * M3_TO_BBL / 30.4) : 0;
      p.gas_mm3d = p.gas_km3 > 0 ? parseFloat(((p.gas_km3 / months) / 30.4 / 1000).toFixed(2)) : 0;
    }

    console.log(`    Total production rows: ${rowCount}`);
    console.log(`    Fields with production: ${prodMap.size}`);
  } else {
    console.log(`  Production CSV not found at ${prodCsvPath}`);
    console.log('  To include production data, first download oilgas_2025.csv to scripts/raw/');
  }

  // Build GeoJSON by merging geometry + production
  const features = [];
  for (const [id, geo] of geoMap) {
    const prod = prodMap.get(id) || {};

    features.push({
      type: 'Feature',
      geometry: geo.geometry,
      properties: {
        nombre: geo.nombre,
        empresa: geo.empresa,
        id,
        provincia: prod.provincia || '',
        oil_bpd: prod.oil_bpd || 0,
        gas_mm3d: prod.gas_mm3d || 0,
        cuenca: prod.cuenca || '',
      },
    });
  }

  const geojson = { type: 'FeatureCollection', features, _updated: new Date().toISOString() };
  const outPath = join(ENERGY_DIR, 'yacimientos.json');
  await writeFile(outPath, JSON.stringify(geojson));
  console.log(`  Output: ${features.length} features → ${outPath}`);

  const withProd = features.filter(f => f.properties.oil_bpd > 0 || f.properties.gas_mm3d > 0).length;
  console.log(`  With production data: ${withProd} / ${features.length}`);
  return features.length;
}

// ─── 2. Refinerías ─────────────────────────────────────────────────────────────

async function processRefinerias() {
  console.log('\n=== REFINERIAS ===');
  const csvPath = join(RAW_DIR, 'refinerias.csv');

  console.log('Downloading CSV...');
  await download(URLS.refinerias, csvPath);
  console.log('Parsing CSV...');
  const rows = await parseCSV(csvPath);
  console.log(`  Raw rows: ${rows.length}`);

  const cols = Object.keys(rows[0] || {});
  console.log(`  Columns: ${cols.join(', ')}`);

  // Find geometry column
  let geoCol = cols.find(c => /geojson|geo_shape|geometria|wkt|the_geom/i.test(c));
  if (!geoCol) {
    geoCol = cols.find(c => {
      const v = (rows[0] || {})[c] || '';
      return v.includes('"type"') && v.includes('"coordinates"');
    });
  }
  console.log(`  Geometry column: ${geoCol || 'NOT FOUND'}`);

  const features = [];
  for (const row of rows) {
    let geometry = null;

    // Try geometry column
    if (geoCol && row[geoCol]) {
      geometry = parseGeoColumn(row[geoCol]);
      if (!geometry) geometry = parseWKTPoint(row[geoCol]);
    }

    // Try lat/lon columns
    if (!geometry) {
      const latCol = cols.find(c => /^lat/i.test(c));
      const lonCol = cols.find(c => /^lon|^lng/i.test(c));
      if (latCol && lonCol) {
        const lat = parseFloat(row[latCol]);
        const lon = parseFloat(row[lonCol]);
        if (lat && lon) geometry = { type: 'Point', coordinates: [lon, lat] };
      }
    }

    if (!geometry || geometry.type !== 'Point') continue;

    // Build properties matching existing refinerias.json format
    const properties = {};
    for (const c of cols) {
      if (c === geoCol) continue; // skip geometry column
      const val = (row[c] || '').trim();
      if (val) properties[c.toLowerCase().replace(/\s+/g, '_')] = val;
    }

    features.push({ type: 'Feature', geometry, properties });
  }

  const geojson = { type: 'FeatureCollection', features, _updated: new Date().toISOString() };
  const outPath = join(ENERGY_DIR, 'refinerias.json');
  await writeFile(outPath, JSON.stringify(geojson));
  console.log(`  Output: ${features.length} features → ${outPath}`);
  return features.length;
}

// ─── 3. Centrales de generación ────────────────────────────────────────────────

async function processCentrales() {
  console.log('\n=== CENTRALES (Power Plants) ===');
  const csvPath = join(RAW_DIR, 'centrales.csv');
  const potPath = join(RAW_DIR, 'potencia-instalada.csv');

  console.log('Downloading centrales CSV...');
  await download(URLS.centrales, csvPath);
  console.log('Downloading potencia instalada CSV...');
  try {
    await download(URLS.potencia, potPath);
  } catch (err) {
    console.log(`  Warning: could not download potencia CSV: ${err.message}`);
  }

  console.log('Parsing centrales CSV...');
  const rows = await parseCSV(csvPath);
  console.log(`  Raw rows: ${rows.length}`);

  const cols = Object.keys(rows[0] || {});
  console.log(`  Columns: ${cols.join(', ')}`);

  // Parse potencia data if available — build lookup by central name
  const potenciaMap = new Map(); // nombre_central → { potencia_mw, tecnologia }
  if (existsSync(potPath)) {
    try {
      console.log('Parsing potencia instalada CSV...');
      const potRows = await parseCSV(potPath);
      console.log(`  Potencia rows: ${potRows.length}`);
      const potCols = Object.keys(potRows[0] || {});
      console.log(`  Potencia columns: ${potCols.join(', ')}`);

      // Aggregate total MW per central (summing across machine types for latest period)
      // Group by central code, sum MW, keep the agente_descripcion for name matching
      const centralAgg = new Map(); // central_code → { totalMw, desc, tec }

      for (const pr of potRows) {
        const code = (pr.central || '').trim().toUpperCase();
        if (!code) continue;
        const mw = parseFloat(pr.potencia_instalada_mw) || 0;
        const periodo = pr.periodo || '';
        const desc = (pr.agente_descripcion || '').trim().toUpperCase();

        if (!centralAgg.has(code)) {
          centralAgg.set(code, { totalMw: 0, desc, tec: (pr.fuente_generacion || '').trim(), periodo });
        }
        const agg = centralAgg.get(code);
        // Only sum MW from the latest period per central
        if (periodo >= agg.periodo) {
          if (periodo > agg.periodo) {
            agg.totalMw = 0;
            agg.periodo = periodo;
          }
          agg.totalMw += mw;
        }
        if (desc) agg.desc = desc;
      }

      // Build lookup by multiple keys: code, description, cleaned name
      for (const [code, agg] of centralAgg) {
        if (agg.totalMw <= 0) continue;
        const entry = { potencia_mw: Math.round(agg.totalMw * 10) / 10, tecnologia: agg.tec };
        potenciaMap.set(code, entry);
        // Also index by description (e.g. "C.T. ALMIRANTE BROWN")
        if (agg.desc) {
          potenciaMap.set(agg.desc, entry);
          // Strip prefix like "C.T. ", "H. ", "P.E. " for fuzzy matching
          const cleaned = agg.desc.replace(/^(C\.T\.|H\.|P\.E\.|P\.S\.|C\.H\.)\s*/i, '').trim();
          if (cleaned) potenciaMap.set(cleaned, entry);
        }
      }
      console.log(`  Potencia lookup: ${potenciaMap.size} entries (${centralAgg.size} centrales)`);

    } catch (err) {
      console.log(`  Warning: error parsing potencia CSV: ${err.message}`);
    }
  }

  // Find geometry column
  let geoCol = cols.find(c => /geojson|geo_shape|geometria|wkt|the_geom/i.test(c));
  if (!geoCol) {
    geoCol = cols.find(c => {
      const v = (rows[0] || {})[c] || '';
      return v.includes('"type"') && v.includes('"coordinates"');
    });
  }
  console.log(`  Geometry column: ${geoCol || 'NOT FOUND'}`);

  // Technology mapping — normalize short codes like existing centrales.json
  const TEC_MAP = {
    'térmica': 'TE', 'termica': 'TE', 'thermal': 'TE',
    'hidroeléctrica': 'HI', 'hidroelectrica': 'HI', 'hidro': 'HI', 'hydro': 'HI',
    'nuclear': 'NU',
    'eólica': 'EO', 'eolica': 'EO', 'wind': 'EO',
    'solar': 'SO', 'fotovoltaica': 'SO',
    'biomasa': 'BI', 'biogás': 'BI', 'biogas': 'BI',
  };
  const TEC_LABELS = {
    TE: 'Térmica', TV: 'Térmica', TG: 'Térmica', CC: 'Térmica',
    HI: 'Hidroeléctrica', NU: 'Nuclear',
    EO: 'Eólica', SO: 'Solar', BI: 'Biomasa',
  };

  function normalizeTec(raw) {
    if (!raw) return '';
    const lower = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const [key, val] of Object.entries(TEC_MAP)) {
      if (lower.includes(key.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) return val;
    }
    // Check if it's already a short code
    const upper = raw.toUpperCase().slice(0, 2);
    if (['TE', 'TV', 'TG', 'CC', 'HI', 'NU', 'EO', 'SO', 'BI'].includes(upper)) return upper;
    return raw.slice(0, 2).toUpperCase();
  }

  // Key columns
  // The centrales CSV columns match the existing centrales.json property names exactly
  console.log(`  Columns: ${cols.join(', ')}`);

  const features = [];
  const seen = new Set(); // deduplicate by name

  for (const row of rows) {
    let geometry = null;

    if (geoCol && row[geoCol]) {
      geometry = parseGeoColumn(row[geoCol]);
      if (!geometry) geometry = parseWKTPoint(row[geoCol]);
    }
    if (!geometry) {
      const latCol = cols.find(c => /^lat/i.test(c));
      const lonCol = cols.find(c => /^lon|^lng/i.test(c));
      if (latCol && lonCol) {
        const lat = parseFloat(row[latCol]);
        const lon = parseFloat(row[lonCol]);
        if (lat && lon) geometry = { type: 'Point', coordinates: [lon, lat] };
      }
    }

    if (!geometry || geometry.type !== 'Point') continue;

    const nombre = (row.nombre || '').trim();
    const dedupeKey = `${nombre}|${geometry.coordinates[0].toFixed(3)}|${geometry.coordinates[1].toFixed(3)}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    // The CSV already provides short tech codes (HI, TV, TG, etc.) in 'tecnologia'
    const rawTec = (row.tecnologia || '').trim();
    const tecnologia = rawTec || normalizeTec(row.tecnologia_etiqueta || '');
    const tecnologia_etiqueta = (row.tecnologia_etiqueta || TEC_LABELS[tecnologia] || '').trim();

    // Get MW from CSV, or from potencia lookup
    let potencia_mw = (row.potencia_instalada_mw || '').trim();
    if (!potencia_mw || potencia_mw === '0') {
      const nameUp = nombre.toUpperCase();
      // Try exact match, then cleaned name, then partial
      let lookup = potenciaMap.get(nameUp);
      if (!lookup) {
        const cleaned = nameUp.replace(/^(C\.T\.|H\.|P\.E\.|P\.S\.|C\.H\.)\s*/i, '').trim();
        lookup = potenciaMap.get(cleaned);
      }
      if (!lookup) {
        // Fuzzy: only match against long description keys (≥8 chars) to avoid
        // 4-letter central codes (e.g. "COST") falsely matching place names
        // like "GOBERNADOR COSTA". Require the full name to be contained in the
        // key or vice-versa, not just a short substring.
        for (const [key, val] of potenciaMap) {
          if (key.length >= 8 && (key.includes(nameUp) || (nameUp.length >= 8 && nameUp.includes(key)))) {
            lookup = val;
            break;
          }
        }
      }
      if (lookup) potencia_mw = String(lookup.potencia_mw);
    }

    features.push({
      type: 'Feature',
      geometry,
      properties: {
        tecnologia,
        tecnologia_etiqueta,
        central: (row.central || '').trim(),
        pah: (row.pah || '').trim(),
        aglomeracion: (row.aglomeracion || '').trim(),
        fuente: (row.fuente || 'energia.gob.ar').trim(),
        id_renovar: (row.id_renovar || '').trim(),
        departamento: (row.departamento || '').trim(),
        potencia_instalada_mw: potencia_mw,
        nombre_agente: (row.nombre_agente || '').trim(),
        sistema: (row.sistema || '').trim(),
        tecnologia_maquinas: (row.tecnologia_maquinas || '').trim(),
        nombre,
        resolucion_renovables: (row.resolucion_renovables || '').trim(),
        provincia: (row.provincia || '').trim(),
      },
    });
  }

  // Append manually-added nuclear plants if they are missing
  const NUCLEAR_MANUAL = [
    { nombre: 'ATUCHA I', mw: '362', coords: [-59.2068, -33.9705], prov: 'BUENOS AIRES', dep: 'Zárate' },
    { nombre: 'ATUCHA II', mw: '745', coords: [-59.2075, -33.9710], prov: 'BUENOS AIRES', dep: 'Zárate' },
    { nombre: 'EMBALSE', mw: '656', coords: [-64.4264, -32.1847], prov: 'CORDOBA', dep: 'Calamuchita' },
  ];

  for (const nuc of NUCLEAR_MANUAL) {
    const exists = features.some(f => {
      const n = (f.properties.nombre || '').toUpperCase();
      return n.includes(nuc.nombre);
    });
    if (!exists) {
      console.log(`  Adding manual nuclear plant: ${nuc.nombre}`);
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: nuc.coords },
        properties: {
          tecnologia: 'NU',
          tecnologia_etiqueta: 'Nuclear',
          central: '', pah: '', aglomeracion: '',
          fuente: 'manual',
          id_renovar: '',
          departamento: nuc.dep,
          potencia_instalada_mw: nuc.mw,
          nombre_agente: '',
          sistema: 'SADI',
          tecnologia_maquinas: '',
          nombre: nuc.nombre,
          resolucion_renovables: '',
          provincia: nuc.prov,
        },
      });
    }
  }

  const geojson = { type: 'FeatureCollection', features, _updated: new Date().toISOString() };
  const outPath = join(ENERGY_DIR, 'centrales.json');
  await writeFile(outPath, JSON.stringify(geojson));
  console.log(`  Output: ${features.length} features → ${outPath}`);

  // Summary by technology
  const byTec = {};
  for (const f of features) {
    const t = f.properties.tecnologia || '??';
    byTec[t] = (byTec[t] || 0) + 1;
  }
  console.log('  By technology:', JSON.stringify(byTec));

  return features.length;
}

// ─── 4. Gasoductos ─────────────────────────────────────────────────────────────

function skipGasoductos() {
  console.log('\n=== GASODUCTOS (Gas Pipelines) ===');
  console.log('  Gas pipelines require Shapefile conversion (ogr2ogr) - skipping.');
  console.log(`  Download Shapefile from: ${URLS.gasoductos_shp}`);
  console.log('  To convert manually:');
  console.log('    ogr2ogr -f GeoJSON gasoductos.json gasoductos.shp -simplify 0.001');
  console.log('  Then place the output at: src/data/energy/gasoductos.json');
  console.log('  Expected format: FeatureCollection with MultiLineString features, property "tipo"');
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const t0 = Date.now();
  console.log(`\nEnergy Overlay Updater — ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  const results = {};

  try {
    results.yacimientos = await processYacimientos();
  } catch (err) {
    console.error(`  ERROR processing yacimientos: ${err.message}`);
    results.yacimientos = `ERROR: ${err.message}`;
  }

  try {
    results.refinerias = await processRefinerias();
  } catch (err) {
    console.error(`  ERROR processing refinerias: ${err.message}`);
    results.refinerias = `ERROR: ${err.message}`;
  }

  try {
    results.centrales = await processCentrales();
  } catch (err) {
    console.error(`  ERROR processing centrales: ${err.message}`);
    results.centrales = `ERROR: ${err.message}`;
  }

  skipGasoductos();

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('-'.repeat(60));
  for (const [key, val] of Object.entries(results)) {
    const status = typeof val === 'number' ? `${val} features` : val;
    console.log(`  ${key}: ${status}`);
  }
  console.log(`  gasoductos: skipped (Shapefile)`);
  console.log(`\nElapsed: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
