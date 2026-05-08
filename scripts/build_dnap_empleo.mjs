// Build src/data/dnap_empleo_provincial.json from the DNAP 2024 chart
// (empleados de la Administración provincial cada 1000 habitantes).
// Combines with Censo 2022 population from governors.js to compute absolute head counts.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { governors } from '../src/data/governors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Extracted from DNAP 2024 chart — "Empleados de la Administración provincial / 1000 hab"
const RATIOS = {
  'Córdoba': 33,
  'Buenos Aires': 37,
  'Santa Fe': 42,
  'Mendoza': 44,
  'Corrientes': 49,
  'Santiago del Estero': 51,
  'Misiones': 52,
  'Tucumán': 54,
  'Entre Ríos': 58,
  'Salta': 58,
  'San Juan': 59,
  'Ciudad de Buenos Aires': 62,
  'Formosa': 67,
  'San Luis': 69,
  'Chaco': 72,
  'Río Negro': 74,
  'Chubut': 78,
  'La Pampa': 79,
  'Jujuy': 79,
  'Santa Cruz': 104,
  'Neuquén': 105,
  'Catamarca': 106,
  'La Rioja': 114,
  'Tierra del Fuego': 130,
};
const NATIONAL_AVG = 50;   // "Total" bar in the chart

function normalize(name) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

// Build pop map from governors.js
const popMap = {};
for (const gov of governors) {
  popMap[normalize(gov.provincia)] = gov.poblacion_censo_2022;
}

const provinces = [];
for (const [prov, ratio] of Object.entries(RATIOS)) {
  const pop = popMap[normalize(prov)];
  if (!pop) {
    console.warn(`No population for ${prov}`);
    continue;
  }
  const employees = Math.round(ratio * pop / 1000);
  provinces.push({
    province: prov,
    ratioPer1000: ratio,
    population2022: pop,
    employees,
  });
}
// sort ascending by ratio (lower = slimmer)
provinces.sort((a, b) => a.ratioPer1000 - b.ratioPer1000);

const out = {
  source: 'DNAP — Secretaría de Hacienda, Subsecretaría de Coordinación Fiscal Provincial',
  year: 2024,
  unit: 'empleados de la Administración pública provincial',
  nationalAverage: NATIONAL_AVG,
  note: 'Incluye las 24 jurisdicciones. Cubre sólo empleo público de la Administración PROVINCIAL (no municipal, no nacional). Ratios "empleados / 1000 habitantes" del informe DNAP 2024; absolutos calculados cruzando con población Censo 2022.',
  provinces,
};

const outPath = path.join(ROOT, 'src', 'data', 'dnap_empleo_provincial.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf-8');
console.log(`Wrote ${provinces.length} provinces → ${outPath}`);
console.log('Top 5 most bloated:');
for (const p of provinces.slice(-5).reverse()) {
  console.log(`  ${p.province.padEnd(25)} ${p.ratioPer1000}/1000  ≈ ${p.employees.toLocaleString()} empleados`);
}
console.log('Top 5 slimmest:');
for (const p of provinces.slice(0, 5)) {
  console.log(`  ${p.province.padEnd(25)} ${p.ratioPer1000}/1000  ≈ ${p.employees.toLocaleString()} empleados`);
}
