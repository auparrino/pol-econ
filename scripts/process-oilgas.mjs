/**
 * Process Oil & Gas production data from Secretaría de Energía (Cap. IV)
 * Source: datos.energia.gob.ar - Producción de pozos de gas y petróleo
 *
 * Reads the 2025 CSV (~989K rows), aggregates by province and basin,
 * converts units, and outputs src/data/oilgas_production.json
 */

import { createReadStream } from 'fs';
import { writeFile } from 'fs/promises';
import { parse } from 'csv-parse';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CSV_PATH = join(__dirname, 'raw', 'oilgas_2025.csv');
const OUT_PATH = join(__dirname, '..', 'src', 'data', 'oilgas_production.json');

// 1 m³ oil = 6.28981 barrels
const M3_TO_BBL = 6.28981;

async function main() {
  console.log('Reading CSV:', CSV_PATH);

  // Province-level accumulators
  // Key: provincia → { oil_m3, gas_km3, wells: Set, basins: { basin → { oil_m3, gas_km3 } } }
  const provinces = {};
  let rowCount = 0;
  let skippedRows = 0;

  const parser = createReadStream(CSV_PATH, { encoding: 'utf-8' })
    .pipe(parse({
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      bom: true, // handle BOM
      trim: true,
    }));

  for await (const row of parser) {
    rowCount++;
    if (rowCount % 200000 === 0) console.log(`  processed ${rowCount} rows...`);

    const provincia = (row.provincia || '').trim();
    const cuenca = (row.cuenca || '').trim();
    const idpozo = (row.idpozo || '').trim();

    // Skip rows without a valid province
    if (!provincia) { skippedRows++; continue; }

    const prod_pet = parseFloat(row.prod_pet) || 0; // m³
    const prod_gas = parseFloat(row.prod_gas) || 0; // thousands m³

    if (!provinces[provincia]) {
      provinces[provincia] = { oil_m3: 0, gas_km3: 0, wells: new Set(), basins: {} };
    }
    const prov = provinces[provincia];
    prov.oil_m3 += prod_pet;
    prov.gas_km3 += prod_gas;
    if (idpozo) prov.wells.add(idpozo);

    if (cuenca) {
      if (!prov.basins[cuenca]) {
        prov.basins[cuenca] = { oil_m3: 0, gas_km3: 0 };
      }
      prov.basins[cuenca].oil_m3 += prod_pet;
      prov.basins[cuenca].gas_km3 += prod_gas;
    }
  }

  console.log(`Total rows: ${rowCount}, skipped: ${skippedRows}`);
  console.log(`Provinces found: ${Object.keys(provinces).join(', ')}`);

  // Days in 2025 (full year)
  const daysInPeriod = 365;

  // Build output sorted by oil production descending
  const provinceList = Object.entries(provinces)
    .map(([name, data]) => {
      const oil_bbl_day = Math.round((data.oil_m3 * M3_TO_BBL) / daysInPeriod);
      // gas_km3 is in thousands of m³ → to millions m³/day: (gas_km3 * 1000) / 1e6 / days = gas_km3 / 1000 / days
      const gas_mm3_day = parseFloat(((data.gas_km3 * 1000 / 1e6) / daysInPeriod).toFixed(1));

      const basins = Object.entries(data.basins)
        .map(([basin, bdata]) => ({
          basin,
          oil_pct: data.oil_m3 > 0 ? Math.round((bdata.oil_m3 / data.oil_m3) * 100) : 0,
          gas_pct: data.gas_km3 > 0 ? Math.round((bdata.gas_km3 / data.gas_km3) * 100) : 0,
        }))
        .filter(b => b.oil_pct > 0 || b.gas_pct > 0)
        .sort((a, b) => b.oil_pct - a.oil_pct);

      return {
        province: name,
        oil_m3: Math.round(data.oil_m3),
        oil_bbl_day,
        gas_km3: Math.round(data.gas_km3),
        gas_mm3_day,
        wells: data.wells.size,
        basins,
      };
    })
    .sort((a, b) => b.oil_m3 - a.oil_m3);

  // National totals
  const totalOilM3 = provinceList.reduce((s, p) => s + p.oil_m3, 0);
  const totalOilBblDay = provinceList.reduce((s, p) => s + p.oil_bbl_day, 0);
  const totalGasKm3 = provinceList.reduce((s, p) => s + p.gas_km3, 0);
  const totalGasMm3Day = parseFloat(provinceList.reduce((s, p) => s + p.gas_mm3_day, 0).toFixed(1));
  const totalWells = provinceList.reduce((s, p) => s + p.wells, 0);

  const output = {
    period: '2025',
    source: 'Secretaría de Energía - Cap. IV',
    updated: new Date().toISOString().slice(0, 10),
    national: {
      oil_m3: totalOilM3,
      oil_bbl_day: totalOilBblDay,
      gas_km3: totalGasKm3,
      gas_mm3_day: totalGasMm3Day,
      wells: totalWells,
    },
    provinces: provinceList,
  };

  await writeFile(OUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\nOutput written to: ${OUT_PATH}`);
  console.log('\n=== NATIONAL TOTALS ===');
  console.log(`Oil: ${totalOilM3.toLocaleString()} m³ = ${totalOilBblDay.toLocaleString()} bbl/day`);
  console.log(`Gas: ${totalGasKm3.toLocaleString()} thousand m³ = ${totalGasMm3Day} MMm³/day`);
  console.log(`Wells: ${totalWells.toLocaleString()}`);
  console.log('\n=== BY PROVINCE ===');
  for (const p of provinceList) {
    console.log(`${p.province}: oil=${p.oil_bbl_day.toLocaleString()} bbl/d, gas=${p.gas_mm3_day} MMm³/d, wells=${p.wells}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
