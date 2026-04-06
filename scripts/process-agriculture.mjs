/**
 * Process MAGyP agricultural estimates CSV into a province-level JSON summary.
 * Input:  scripts/raw/estimaciones-agricolas.csv
 * Output: src/data/agriculture.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// --- Crop translations ---
const CROP_EN = {
  'soja': 'Soybeans',
  'maíz': 'Corn',
  'trigo': 'Wheat',
  'girasol': 'Sunflower',
  'cebada cervecera': 'Malting Barley',
  'cebada forrajera': 'Feed Barley',
  'cebada': 'Barley',
  'sorgo granífero': 'Grain Sorghum',
  'sorgo': 'Sorghum',
  'arroz': 'Rice',
  'avena': 'Oats',
  'maní': 'Peanuts',
  'algodón': 'Cotton',
  'caña de azúcar': 'Sugarcane',
  'yerba mate': 'Yerba Mate',
  'té': 'Tea',
  'tabaco': 'Tobacco',
  'vid': 'Grapes',
  'olivo': 'Olives',
  'limón': 'Lemon',
  'naranja': 'Orange',
  'poroto': 'Beans',
  'centeno': 'Rye',
  'lino': 'Flax',
  'colza': 'Canola',
  'cartamo': 'Safflower',
  'mijo': 'Millet',
  'alpiste': 'Canary Grass',
  'trigo candeal': 'Durum Wheat',
  'papa': 'Potato',
  'mandioca': 'Cassava',
  'poroto seco': 'Dry Beans',
  'garbanzo': 'Chickpea',
  'lenteja': 'Lentil',
  'arveja': 'Pea',
  'ajo': 'Garlic',
  'cebolla': 'Onion',
  'pomelo': 'Grapefruit',
  'mandarina': 'Mandarin',
  'maíz palomero': 'Popcorn',
  'maíz pisingallo': 'Popcorn',
  'tung': 'Tung',
  'soja total': 'Soybeans',
  'soja 1ra': 'Soybeans (1st)',
  'soja 2da': 'Soybeans (2nd)',
  'maíz total': 'Corn',
  'trigo total': 'Wheat',
  'cebada total': 'Barley',
  'cebada cervecera total': 'Malting Barley',
  'cebada forrajera total': 'Feed Barley',
  'poroto total': 'Beans',
  'poroto alubia': 'White Beans',
  'poroto negro': 'Black Beans',
  'poroto otros': 'Other Beans',
  'sorgo granífero total': 'Grain Sorghum',
  'cártamo': 'Safflower',
};

function translateCrop(name) {
  const key = name.toLowerCase().trim();
  if (CROP_EN[key]) return CROP_EN[key];
  // Title-case fallback
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// --- Simple CSV parser (handles quoted fields) ---
function parseCSVLine(line) {
  const fields = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      // Quoted field
      let j = i + 1;
      let val = '';
      while (j < line.length) {
        if (line[j] === '"' && j + 1 < line.length && line[j + 1] === '"') {
          val += '"';
          j += 2;
        } else if (line[j] === '"') {
          j++; // closing quote
          break;
        } else {
          val += line[j];
          j++;
        }
      }
      fields.push(val);
      // skip comma after closing quote
      if (j < line.length && line[j] === ',') j++;
      i = j;
    } else {
      let j = line.indexOf(',', i);
      if (j === -1) j = line.length;
      fields.push(line.substring(i, j));
      i = j + 1;
    }
  }
  return fields;
}

// --- Main ---
const csvPath = resolve(ROOT, 'scripts/raw/estimaciones-agricolas.csv');
const raw = readFileSync(csvPath, 'utf8');
const lines = raw.split('\n').filter(l => l.trim());

const header = parseCSVLine(lines[0]);
const colIdx = {};
header.forEach((h, i) => { colIdx[h.trim()] = i; });

// Parse all rows
const rows = [];
for (let i = 1; i < lines.length; i++) {
  const fields = parseCSVLine(lines[i]);
  if (fields.length < header.length) continue;
  rows.push({
    cultivo: fields[colIdx['cultivo']]?.trim(),
    campania: fields[colIdx['campania']]?.trim(),
    provincia: fields[colIdx['provincia']]?.trim(),
    superficie_sembrada_ha: parseFloat(fields[colIdx['superficie_sembrada_ha']]) || 0,
    superficie_cosechada_ha: parseFloat(fields[colIdx['superficie_cosechada_ha']]) || 0,
    produccion_tm: parseFloat(fields[colIdx['produccion_tm']]) || 0,
    rendimiento_kgxha: parseFloat(fields[colIdx['rendimiento_kgxha']]) || 0,
  });
}

// Find latest campaign
const campaigns = [...new Set(rows.map(r => r.campania))].sort();
const latestCampaign = campaigns[campaigns.length - 1];
console.log(`Latest campaign: ${latestCampaign}`);

// Filter to latest campaign
const filtered = rows.filter(r => r.campania === latestCampaign);
console.log(`Rows for ${latestCampaign}: ${filtered.length}`);

// Group by province, then by crop (summing across departamentos)
const provMap = {};
for (const r of filtered) {
  if (!r.provincia) continue;
  if (!provMap[r.provincia]) provMap[r.provincia] = {};
  const crops = provMap[r.provincia];
  if (!crops[r.cultivo]) {
    crops[r.cultivo] = { tons: 0, area_ha: 0 };
  }
  crops[r.cultivo].tons += r.produccion_tm;
  crops[r.cultivo].area_ha += r.superficie_cosechada_ha;
}

// Exclude sub-categories when a "total" variant exists (e.g. soja 1ra/2da when soja total exists)
// Also exclude "trigo candeal" when "trigo total" exists, etc.
function filterSubCategories(cropMap) {
  const names = Object.keys(cropMap);
  const totals = names.filter(n => n.endsWith(' total'));
  const exclude = new Set();
  for (const t of totals) {
    const base = t.replace(/ total$/, '');
    for (const n of names) {
      if (n !== t && n.startsWith(base)) exclude.add(n);
    }
  }
  const result = {};
  for (const [k, v] of Object.entries(cropMap)) {
    if (!exclude.has(k)) result[k] = v;
  }
  return result;
}

// Build output
const provinces = Object.entries(provMap)
  .map(([prov, cropMap]) => {
    const dedupedMap = filterSubCategories(cropMap);
    const crops = Object.entries(dedupedMap)
      .filter(([, v]) => v.tons > 0)
      .map(([crop, v]) => ({
        crop,
        crop_en: translateCrop(crop),
        tons: Math.round(v.tons),
        area_ha: Math.round(v.area_ha),
        yield_kg_ha: v.area_ha > 0 ? Math.round(v.tons * 1000 / v.area_ha) : 0,
      }))
      .sort((a, b) => b.tons - a.tons);

    const total_tons = crops.reduce((s, c) => s + c.tons, 0);
    const total_area_ha = crops.reduce((s, c) => s + c.area_ha, 0);

    return { province: prov, total_tons, total_area_ha, crops };
  })
  .filter(p => p.total_tons > 0)
  .sort((a, b) => b.total_tons - a.total_tons);

const output = {
  campaign: latestCampaign,
  source: 'MAGyP - Estimaciones Agrícolas',
  provinces,
};

const outPath = resolve(ROOT, 'src/data/agriculture.json');
writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');

console.log(`\nWrote ${outPath}`);
console.log(`Provinces: ${provinces.length}`);
console.log(`Top 5 provinces by production:`);
provinces.slice(0, 5).forEach(p => {
  console.log(`  ${p.province}: ${(p.total_tons / 1e6).toFixed(1)}M tons, top crop: ${p.crops[0]?.crop_en}`);
});
console.log(`\nTotal national production: ${(provinces.reduce((s, p) => s + p.total_tons, 0) / 1e6).toFixed(1)}M tons`);
