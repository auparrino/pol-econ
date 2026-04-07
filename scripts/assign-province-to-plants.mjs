/**
 * assign-province-to-plants.mjs
 * Assigns Argentine provinces to CAMMESA MEM plants from potencia-instalada.csv
 * and writes src/data/energy/cammesa-por-provincia.json
 *
 * Run: node scripts/assign-province-to-plants.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Step 1 — Parse CSV and aggregate by central code for the latest period only
// ---------------------------------------------------------------------------

const csvPath = resolve(ROOT, 'scripts/raw/cammesa-potencia-instalada.csv');
const rawCsv = readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, ''); // strip BOM
const lines = rawCsv.split('\n').filter(l => l.trim());
const headers = lines[0].split(',').map(h => h.trim());

function idx(name) {
  const i = headers.indexOf(name);
  if (i === -1) throw new Error(`Column not found: ${name}`);
  return i;
}

const COL_PERIOD  = idx('periodo');
const COL_CODE    = idx('central');
const COL_NAME    = idx('agente_descripcion');
const COL_REGION  = idx('region');
const COL_FUENTE  = idx('fuente_generacion');
const COL_MW      = idx('potencia_instalada_mw');

// Find latest period
let latestPeriod = '';
for (const line of lines.slice(1)) {
  const cols = line.split(',');
  const p = (cols[COL_PERIOD] || '').trim().substring(0, 10);
  if (p > latestPeriod) latestPeriod = p;
}
console.log(`\nLatest period: ${latestPeriod}`);

// Aggregate: code → { nombre, region, fuente, totalMW }
const plantMap = new Map();

for (const line of lines.slice(1)) {
  const cols = line.split(',');
  const period = (cols[COL_PERIOD] || '').trim().substring(0, 10);
  if (period !== latestPeriod) continue;

  const code   = (cols[COL_CODE]   || '').trim().toUpperCase();
  const nombre = (cols[COL_NAME]   || '').trim().toUpperCase();
  const region = (cols[COL_REGION] || '').trim().toUpperCase();
  const fuente = (cols[COL_FUENTE] || '').trim();
  const mw     = parseFloat(cols[COL_MW] || '0') || 0;

  if (!code) continue;

  if (!plantMap.has(code)) {
    plantMap.set(code, { code, nombre, region, fuente, totalMW: 0 });
  }
  plantMap.get(code).totalMW += mw;
}

const plants = [...plantMap.values()];
console.log(`Plants in latest period: ${plants.length}`);

// ---------------------------------------------------------------------------
// Step 2 — Province assignment
// ---------------------------------------------------------------------------

// 2a — Explicit code → province (exact match on plant code)
const CODE_MAP = {
  // ── Nuclear ──────────────────────────────────────────────────────────────
  'ATU1': 'BUENOS AIRES', 'ATU2': 'BUENOS AIRES',
  'ATUC': 'BUENOS AIRES', 'ATUN': 'BUENOS AIRES',
  'EMBA': 'CÓRDOBA',

  // ── COMAHUE hydro — Neuquén side ─────────────────────────────────────────
  'ALICHI': 'NEUQUÉN',   // Alicurá
  'RRCHI':  'NEUQUÉN',   // Río Neuquén
  'CERRO':  'NEUQUÉN',   // Cerros Colorados (Planicie Banderita)
  'PICHI':  'NEUQUÉN',   // Piedra del Águila
  'LLANO':  'NEUQUÉN',   // Planicie Banderita
  'CHIHU':  'NEUQUÉN',   // Chihuido
  'CHOCHI': 'NEUQUÉN',   // El Chocón
  'ARROHI': 'NEUQUÉN',   // Arroyito
  'MARHI':  'NEUQUÉN',   // Mari Menuco
  'PBANHI': 'NEUQUÉN',   // Planicie Banderita / Cerros Colorados
  'FILO':   'NEUQUÉN',   // Filo Morado (Rincón de los Sauces)
  'LDLA':   'NEUQUÉN',   // Loma de la Lata
  'RSAU':   'NEUQUÉN',   // Rincón de los Sauces (Medanitos)
  'ROMEHI': 'NEUQUÉN',   // Julián Romero / 5 Saltos (Neuquén river)
  'RESCHI': 'NEUQUÉN',   // Río Escondido (Patagónica Neuquén)
  'CAPE':   'NEUQUÉN',   // CAPEX SA (Rincón de los Sauces / Aguada Pichana)
  'CESPHI': 'NEUQUÉN',   // Central Céspedes
  'POM1EO': 'RÍO NEGRO', // Pomona (Río Negro)
  'POM2EO': 'RÍO NEGRO',

  // ── COMAHUE hydro — Río Negro side ───────────────────────────────────────
  'COLLAR': 'RÍO NEGRO',
  'PICHI2': 'RÍO NEGRO',
  'EZQHI':  'RÍO NEGRO',
  'BARZHI': 'RÍO NEGRO',
  'CIPOHI': 'RÍO NEGRO', // Cipolletti
  'CIPO':   'RÍO NEGRO', // CT Cipolletti
  'CPIEHI': 'RÍO NEGRO', // Casa de Piedra
  'ROCA':   'RÍO NEGRO', // CT Roca SA (General Roca)
  'SANDHI': 'RÍO NEGRO', // Salto Andersen
  'DIVIHI': 'LA PAMPA',  // APELP = Administración Provincial de Energía La Pampa

  // ── COMAHUE — La Pampa ───────────────────────────────────────────────────
  'REAL':   'LA PAMPA',  // CT Realicó (La Pampa)
  'BANDEO': 'LA PAMPA',  // P.Eólico La Banderita (Rancul, La Pampa)

  // ── NORESTE ──────────────────────────────────────────────────────────────
  'YACYHI':   'CORRIENTES',  // Yacyretá (AR side, Corrientes)
  'SGDEHIAR': 'ENTRE RÍOS',  // Salto Grande (AR side)

  // ── CENTRO hydro — Córdoba ───────────────────────────────────────────────
  'FMPHI':  'CÓRDOBA',  // Río Grande I-IV (Traslasierra)
  'GRANHI': 'CÓRDOBA',  // Río Grande
  'SFHI':   'CÓRDOBA',  // San Francisco (Los Molinos)
  'LOZHI':  'CÓRDOBA',  // La Viña (Lozada? Cruz del Eje?)
  'TAFHI':  'CÓRDOBA',  // Tafí del Valle area
  'REOLHI': 'CÓRDOBA',  // EPEC Generación hydro
  'RGDEHB': 'CÓRDOBA',  // EPEC Generación (Río Grande / embalse Cerro Pelado)
  'SROQHI': 'CÓRDOBA',  // San Roque (Córdoba)
  'LMO1HI': 'CÓRDOBA',  // Los Molinos I
  'LMO2HI': 'CÓRDOBA',  // Los Molinos II
  'LVINHI': 'CÓRDOBA',  // La Viña
  'PMORHI': 'CÓRDOBA',  // Peñas Moras
  'FSIMHI': 'CÓRDOBA',  // San Simón
  'CALEHI': 'CÓRDOBA',  // Calamuchita
  'CASSHI': 'CÓRDOBA',  // Cassafontes
  'CEJEHI': 'CÓRDOBA',  // Cejas
  'MJUA':   'CÓRDOBA',  // EPEC small unit
  // CENTRO thermal/other — Córdoba
  'BVIL':   'CÓRDOBA',  // Bell Ville
  'DFUN':   'CÓRDOBA',  // Dean Funes (EPEC)
  'ISVE':   'CÓRDOBA',  // Isla Verde
  'LEVA':   'CÓRDOBA',  // Leones (EPEC)
  'MMAR':   'CÓRDOBA',  // Mediterránea (Villa María area)
  'PILA':   'CÓRDOBA',  // CT Pilar - EPEC (Pilar, Córdoba)
  'SERT':   'CÓRDOBA',  // Río Tercero II
  'SFRA':   'CÓRDOBA',  // San Francisco (EPEC)
  'SOES':   'CÓRDOBA',  // EPEC
  'VMA2':   'CÓRDOBA',  // CT Villa María
  'VMAR':   'CÓRDOBA',  // Villa María (EPEC)
  'ACHIEO': 'CÓRDOBA',  // P.Eólico Achiras (Córdoba)
  'BRC1':   'CÓRDOBA',  // Bioelectrica Río Cuarto
  'BRC2':   'CÓRDOBA',
  'CUMBFV': 'CÓRDOBA',  // La Cumbre (Córdoba)
  'CUM2FV': 'CÓRDOBA',
  'GIG1':   'CÓRDOBA',  // Gigena (Córdoba)
  'JUNT':   'CÓRDOBA',  // Las Junturas (Córdoba)
  'CSOLFV': 'CÓRDOBA',  // Cerros del Sol
  'MANQEO': 'CÓRDOBA',  // Manque (Córdoba)
  'OLIVEO': 'CÓRDOBA',  // Los Olivos (Córdoba)
  'CALOFV': 'CÓRDOBA',  // Caldenes del Oeste (can be La Pampa or Córdoba; CENTRO → Córdoba)
  // CENTRO — San Luis
  'SPUNFV': 'SAN LUIS', // Solar de la Punta (Villa de la Punta, San Luis)
  'JDAR':   'SAN LUIS', // Biogas Justo Daract (San Luis)
  'YANQ':   'SAN LUIS', // Yanquetruz (Villa Mercedes, San Luis)

  // ── CUYO — Mendoza ────────────────────────────────────────────────────────
  'CDPI':   'MENDOZA',  // CT Mendoza
  'LDCU':   'MENDOZA',  // CT Mendoza
  'ADTOHI': 'MENDOZA',  // H. Diamante
  'ETIGHI': 'MENDOZA',  // H. Diamante (Ético)
  'LREYHB': 'MENDOZA',  // H. Diamante (Los Reyunos)
  'NIH1HI': 'MENDOZA',  // Los Nihuiles I
  'NIH2HI': 'MENDOZA',  // Los Nihuiles II
  'NIH3HI': 'MENDOZA',  // Los Nihuiles III
  'NIH4HI': 'MENDOZA',  // Los Nihuiles IV
  'CACHHI': 'MENDOZA',  // Potrerillos (Consorcio)
  'CARRHI': 'MENDOZA',  // Potrerillos
  'CONDHI': 'MENDOZA',  // Potrerillos
  'CACVHI': 'MENDOZA',  // Potrerillos
  'COROHI': 'MENDOZA',  // GEMSA (Generadora Eléctrica Mendoza)
  'SMARHI': 'MENDOZA',  // GEMSA
  'SALOHI': 'MENDOZA',  // Salto de la Loma (Mendoza)
  'ANCH':   'MENDOZA',  // CT Anchoris (Mendoza)
  'PASIFV': 'MENDOZA',  // Solar PASIP Palmira (Palmira, Mendoza)
  'SANDFV': 'MENDOZA',  // Solar de los Andes (Mendoza)
  // CUYO — San Juan
  'ULLHI':  'SAN JUAN', // Ullum
  'CHACHI': 'SAN JUAN', // Caracoles (Los Caracoles)
  'PORTHI': 'SAN JUAN', // Punta Negra / Portezuelo
  'CCOLHI': 'SAN JUAN', // CH Los Caracoles - EPSE
  'CVIEHI': 'SAN JUAN', // Cuesta del Viento - EPSE
  'QULLHI': 'SAN JUAN', // Quebrada Ullum - EPSE
  'PNEGHI': 'SAN JUAN', // CH Punta Negra - EPSE
  'SGUIHI': 'SAN JUAN', // CH San Guillermo (Reserva San Guillermo, Jáchal)
  'CHI1FV': 'SAN JUAN', // Chimberas I (San Juan)
  'HON1FV': 'SAN JUAN', // Cañada Honda I (San Juan)
  'HON2FV': 'SAN JUAN', // Cañada Honda II (San Juan)
  'SJUAFV': 'SAN JUAN', // Solar San Juan I - EPSE
  'SJU2FV': 'SAN JUAN', // Solar San Juan II - EPSE
  'ULN1FV': 'SAN JUAN', // Solar Ullum 1
  'ULN2FV': 'SAN JUAN', // Solar Ullum 2
  'ULL3FV': 'SAN JUAN', // Solar Ullum 3
  'ULL4FV': 'SAN JUAN', // Solar Ullum 4
  'UL42FV': 'SAN JUAN', // Solar Ullum Solargen2
  'IGLEFV': 'SAN JUAN', // Cordillera Solar (Iglesia, San Juan)
  'DIAGFV': 'SAN JUAN', // Diaguitas-Tambilerías (Rodeo, Iglesia, San Juan)
  'LLOMFV': 'SAN JUAN', // Las Lomitas (region CUYO → San Juan, not Formosa)

  // ── GRAN BS.AS. → Buenos Aires (GBA thermal plants) ──────────────────────
  'ABRO':   'BUENOS AIRES', // C.T. Almirante Brown (GBA)
  'DIQU':   'BUENOS AIRES', // Central Dique (Puerto Madero, CABA)
  'EBAR':   'BUENOS AIRES', // CT Barragán (La Plata area)
  'ENSE':   'BUENOS AIRES', // La Plata Cogeneración
  'GEBA':   'BUENOS AIRES', // GENELBA (Morón area)
  'LPLA':   'BUENOS AIRES', // CT La Plata
  'MAGD':   'BUENOS AIRES', // CT Magdalena
  'MATHEU': 'BUENOS AIRES', // CT Matheu (Pilar area)
  'NPUE':   'BUENOS AIRES', // Central Puerto (Puerto Madero)
  'PNUE':   'BUENOS AIRES', // Central Puerto
  'SMAN':   'BUENOS AIRES', // CT San Martín Norte
  'SMIG':   'BUENOS AIRES', // CT San Miguel Norte
  'SVIC':   'BUENOS AIRES', // CT San Vicente
  'ZAPA':   'BUENOS AIRES', // CT Zappalorto
  'PILB':   'BUENOS AIRES', // CT Pilar BS.AS.
  'MATE':   'BUENOS AIRES', // CT Matheu II
  'EZEI':   'BUENOS AIRES', // CT Ezeiza
  'MAT3':   'BUENOS AIRES', // CT Matheu III

  // ── BUENOS AIRES (region) → Buenos Aires province ─────────────────────────
  'ARGE':   'BUENOS AIRES', // SIDERCA (Campana area)
  'BBLA':   'BUENOS AIRES', // Central Piedrabuena (Bahía Blanca)
  'BBLM':   'BUENOS AIRES', // CT Piedrabuena MG
  'BROW':   'BUENOS AIRES', // Termoelectrica Guillermo Brown
  'CERI':   'BUENOS AIRES', // Pampa Energía
  'COLB':   'BUENOS AIRES', // CT Colón BS.AS.
  'CORTEO': 'BUENOS AIRES', // P.Eólico Corti
  'CSAR':   'BUENOS AIRES', // CT Capitán Sarmiento
  'EN1MEO': 'BUENOS AIRES', // P.Eólico La Energética
  'ENE1EO': 'BUENOS AIRES', // P.Eólico La Energética Renov2
  'GNV2EO': 'BUENOS AIRES', // P.Eólico La Genoveva II
  'GRIOEO': 'BUENOS AIRES', // P.Eólico García del Río
  'JUNI':   'BUENOS AIRES', // CT Junín
  'LCA2EO': 'BUENOS AIRES', // P.Eólico La Castellana 2
  'LCASEO': 'BUENOS AIRES', // P.Eólico La Castellana
  'LINC':   'BUENOS AIRES', // CT Lincoln
  'LOBO':   'BUENOS AIRES', // CT Lobos BS.AS.
  'MDAJ':   'BUENOS AIRES', // C.Costa Atlántica
  'MDPA':   'BUENOS AIRES', // C.Costa Atlántica
  'MDP2':   'BUENOS AIRES', // CT 9 de Julio
  'MIR1':   'BUENOS AIRES', // CT Miramar I
  'NECO':   'BUENOS AIRES', // C.Costa Atlántica (Necochea)
  'NECOEO': 'BUENOS AIRES', // Sea Energy P.Eólico
  'OLAD':   'BUENOS AIRES', // CT Olavarría
  'PAMEEO': 'BUENOS AIRES', // P.Eólico Pampa Energía
  'BAHIEO': 'BUENOS AIRES', // P.Eólico de la Bahía
  'PEDR':   'BUENOS AIRES', // CT San Pedro
  'PERG':   'BUENOS AIRES', // Biogas Pergamino
  'ROJO':   'BUENOS AIRES', // CT General Rojo
  'SAL2':   'BUENOS AIRES', // CT Salto 2
  'SNIC':   'BUENOS AIRES', // C.Térmica San Nicolás
  'VGAD':   'BUENOS AIRES', // CT Gral. Villegas
  'VGES':   'BUENOS AIRES', // C.Costa Atlántica
  'VLONEO': 'BUENOS AIRES', // P.Eólico Villalonga
  'VLO2EO': 'BUENOS AIRES', // P.Eólico Villalonga (GENNEIA)
  'ZARA':   'BUENOS AIRES', // CT Las Palmas 2 (Zárate area)
  'BRKE':   'BUENOS AIRES', // CT Barker (Sierra de la Ventana)
  'BOLI':   'BUENOS AIRES', // EDEN Generación
  '9JUL':   'BUENOS AIRES', // Coop. Municipal Moreno

  // ── LITORAL — Santa Fe ────────────────────────────────────────────────────
  'CERE':   'SANTA FE',    // CT Ceres
  'CGOM':   'SANTA FE',    // CT Cañada de Gómez
  'OCAM':   'SANTA FE',    // CT Villa Ocampo
  'PERZ':   'SANTA FE',    // CT Pérez
  'RAFA':   'SANTA FE',    // CT Rafaela
  'RENO':   'SANTA FE',    // CT Renova (Timbúes)
  'RUFI':   'SANTA FE',    // CT Rufino Sta.Fe
  'TIMB':   'SANTA FE',    // Termoelectrica José San Martín (Timbúes)
  'VTUD':   'SANTA FE',    // CT Venado Tuerto
  'SPEV':   'SANTA FE',    // Energia Agro (biogas, Santa Fe)
  'AVEL':   'SANTA FE',    // Biogas Avellaneda (Avellaneda, Santa Fe)
  // LITORAL — Entre Ríos
  'CURU':   'ENTRE RÍOS',  // CT Concepción del Uruguay
  'SSAL':   'ENTRE RÍOS',  // CT San Salvador E.Ríos
  'VIAL':   'ENTRE RÍOS',  // CT Viale
  // LITORAL — Santa Fe (border with Buenos Aires)
  'VOBL':   'SANTA FE',    // CT Vuelta de Obligado (on Paraná river, Santa Fe side)
  'SORR':   'ENTRE RÍOS',  // CT Sorrento (Concordia area)

  // ── NORESTE — Chaco ───────────────────────────────────────────────────────
  'BARD':   'CHACO',       // CT Barranqueras
  'CAST':   'CHACO',       // CT Castelli
  'CHAR':   'CHACO',       // CT Charata
  'LPAL':   'CHACO',       // CT Las Palmas (Chaco)
  'NPOM':   'CHACO',       // CT Nueva Pompeya
  'PROC':   'CHACO',       // CT Presidencia Roca
  'SCHA':   'CHACO',       // CT San Martín Chaco
  'SPE2':   'CHACO',       // CT Sáenz Peña II
  'SPEN':   'CHACO',       // CT Sáenz Peña
  'VANG':   'CHACO',       // CT Villa Ángela
  // NORESTE — Misiones (EMSA = distribuidora de Misiones)
  'ALEM':   'MISIONES',    // CT Leandro N. Alem
  'ARIS':   'MISIONES',    // CT Aristóbulo del Valle
  'OBER':   'MISIONES',    // EMSA Generación (Oberá)
  'SANA':   'MISIONES',    // EMSA Generación
  'BERI':   'MISIONES',    // EMSA Generación
  'OBEM':   'MISIONES',    // EMSA Generación
  // NORESTE — Formosa
  'JUAR':   'FORMOSA',     // CT Ingeniero Juárez
  'LBLA':   'FORMOSA',     // CT Laguna Blanca (Formosa)
  'PALM':   'FORMOSA',     // CT Palmar Largo
  // NORESTE — Corrientes
  'GOYD':   'CORRIENTES',  // CT Goya
  'ITAT':   'CORRIENTES',  // CT Itatí
  'PPAT':   'CORRIENTES',  // CT Paso de la Patria

  // ── PATAGONICA — Chubut ───────────────────────────────────────────────────
  'AMEGHI': 'CHUBUT',      // H. Ameghino
  'ALUAR':  'CHUBUT',      // ALUAR SA (Puerto Madryn)
  'ALUAEO': 'CHUBUT',      // ALUAR SA Aut. Ren. (Puerto Madryn)
  'ALU1EO': 'CHUBUT',      // P.Eólico Aluar I (Puerto Madryn)
  'BICEEO': 'CHUBUT',      // P.Eólico Bicentenario 1 (Trelew area)
  'BIC2EO': 'CHUBUT',      // P.Eólico Bicentenario 2
  'CRIV':   'CHUBUT',      // C.T. Patagonicas SA (Comodoro Rivadavia)
  'DIADEO': 'CHUBUT',      // P.Eólico Diadema (near Comodoro)
  'DIA2EO': 'CHUBUT',      // P.Eólico Diadema 2
  'ELEP':   'CHUBUT',      // Electropatagonia (Comodoro)
  'FUTAHI': 'CHUBUT',      // H. Futaleufú SA
  'GARAEO': 'CHUBUT',      // P.Eólico Garayalde (Chubut)
  'LOM2EO': 'CHUBUT',      // P.Eólico Loma Blanca 2 (near Trelew)
  'LOM4EO': 'CHUBUT',      // P.Eólico Loma Blanca IV
  'MANAEO': 'CHUBUT',      // P.Eólico Manantiales Behr (Comodoro area)
  'PMA1EO': 'CHUBUT',      // P.Eólico Madryn 1 (Puerto Madryn)
  'PMA2EO': 'CHUBUT',      // P.Eólico Madryn 2 (Puerto Madryn)
  'PMAD':   'CHUBUT',      // C.T. Patagonicas SA
  'PTR1':   'CHUBUT',      // C.T. Patagonicas SA
  'PATA':   'CHUBUT',      // Energia del Sur SA (Comodoro)
  'RAW1EO': 'CHUBUT',      // P.Eólico Rawson I
  'RAW2EO': 'CHUBUT',      // P.Eólico Rawson II
  'RAW3EO': 'CHUBUT',      // P.Eólico Rawson III (GENNEIA)
  'TORDEO': 'CHUBUT',      // CE El Tordillo (near Comodoro)
  // PATAGONICA — Santa Cruz
  'RCHI':   'SANTA CRUZ',  // CT Río Chico (Santa Cruz)

  // ── NOROESTE — Salta ─────────────────────────────────────────────────────
  'BRCH':   'SALTA',       // CT Bracho (near Aguaray)
  'CCORHI': 'SALTA',       // AES Juramento (Cabra Corral, Salta)
  'GUEM':   'SALTA',       // C.Térmica Güemes
  'PIQI':   'SALTA',       // CT Piquirenda (Tartagal area)
  'SMTU':   'SALTA',       // YPF Energía Eléctrica (ex-Pluspetrol, Campo Durán area, Salta)
  'TUNAHI': 'SALTA',       // AES Juramento (El Tunal, Salta)
  'CAFAFV': 'SALTA',       // Parque Fotovoltaico Cafayate
  // NOROESTE — Jujuy
  'CAIM':   'JUJUY',       // CT Caimancito
  'LIBE':   'JUJUY',       // CT Libertador Gral San Martín
  'LMADHI': 'JUJUY',       // H. Las Maderas (Jujuy)
  'RREYHI': 'JUJUY',       // H. Reyes (near San Salvador de Jujuy)
  // NOROESTE — Catamarca (EDECAT = distribuidora de Catamarca)
  'CATA':   'CATAMARCA',   // EDECAT Generación
  'SMAR':   'CATAMARCA',   // EDECAT Generación
  'PICA':   'CATAMARCA',   // CT Parque Industrial Catamarca
  'FIAMFV': 'CATAMARCA',   // Parque Solar Fiambalá
  'SAUJFV': 'CATAMARCA',   // Parque Solar Saujil
  'TINOFV': 'CATAMARCA',   // Parque Solar Tinogasta I
  'TIN2FV': 'CATAMARCA',   // Parque Solar Tinogasta II
  'TINO':   'CATAMARCA',   // CT Tinogasta
  // NOROESTE — La Rioja (EDELAR = distribuidora de La Rioja)
  'CHEP':   'LA RIOJA',    // EDELAR Generación (Chepes area)
  'OLPA':   'LA RIOJA',    // EDELAR Generación (Olta)
  'PZUE':   'LA RIOJA',    // EDELAR Generación (Pozuelos)
  'TELL':   'LA RIOJA',    // EDELAR Generación (Tello)
  'MALL':   'LA RIOJA',    // EDELAR Generación (Mallagua?)
  'LVIC':   'LA RIOJA',    // EDELAR Generación
  'MILA':   'LA RIOJA',    // EDELAR Generación
  'LRIO':   'LA RIOJA',    // Generación Riojana SA
  'CHLE':   'LA RIOJA',    // CT Chilecito
  'NONOFV': 'LA RIOJA',    // Parque Fotovolt. Nonogasta (La Rioja)
  'LLANFV': 'LA RIOJA',    // Parque Solar Pque de los Llanos (La Rioja)
  'CHEPFV': 'LA RIOJA',    // Parque Solar Chepes (La Rioja)
  // NOROESTE — Santiago del Estero
  'BAND':   'SANTIAGO DEL ESTERO', // CT Bandera
  'JUMEEO': 'SANTIAGO DEL ESTERO', // P.Eólico El Jume (code says SGO DEL ESTER)
  'LBAN':   'SANTIAGO DEL ESTERO', // Generación La Banda
  'LQUIHI': 'SANTIAGO DEL ESTERO', // H. Río Hondo
  'NESP':   'SANTIAGO DEL ESTERO', // Empresa Dist. Santiago del Estero
  'RHONHI': 'SANTIAGO DEL ESTERO', // H. Río Hondo
  'TERV':   'SANTIAGO DEL ESTERO', // CT Terevintos (near Monte Quemado, Stgo del Estero)
  // ── Remaining unambiguous ────────────────────────────────────────────────
  'PIRA':   'FORMOSA',     // CT Pirané (Pirané city, Formosa)
  'PPLEHI': 'NEUQUÉN',     // Pichi Picún Leufú hydro (Neuquén)
  'SJMTEO': 'BUENOS AIRES',// P.Eólico Mataco / Tres Picos (Buenos Aires)

  // NOROESTE — Tucumán
  'CITR':   'TUCUMÁN',     // Biogas Citrusvil (near Famaillá, Tucumán)
  'INDE':   'TUCUMÁN',     // Generación Independencia SA (Tucumán)
  'IND1':   'TUCUMÁN',     // CT Independencia Etapa 1
  'IND2':   'TUCUMÁN',     // CT Independencia Etapa 2
  'LEAL':   'TUCUMÁN',     // CTBM Ingenio Leales (Tucumán)
  'TUCU':   'TUCUMÁN',     // YPF Energía Eléctrica (TUCU code = Tucumán)
};

// 2b — Name fragment → province (checked against uppercase agente_descripcion)
// Ordered from most specific to least specific.
const NAME_FRAGS = [
  // Explicit nuclear plant names
  ['ATUCHA',            'BUENOS AIRES'],
  ['EMBALSE',           'CÓRDOBA'],
  // Buenos Aires GBA / CABA landmarks
  ['COSTANERA',         'BUENOS AIRES'],
  ['PUERTO NUEVO',      'BUENOS AIRES'],
  ['DOCK SUD',          'BUENOS AIRES'],
  ['BELGRANO',          'BUENOS AIRES'],
  ['BARRAGAN',          'BUENOS AIRES'],
  ['BARRAGÁN',          'BUENOS AIRES'],
  ['LA PLATA',          'BUENOS AIRES'],
  ['QUILMES',           'BUENOS AIRES'],
  ['CAMPANA',           'BUENOS AIRES'],
  ['ENSENADA',          'BUENOS AIRES'],
  ['BAHIA BLANCA',      'BUENOS AIRES'],
  ['BAHÍA BLANCA',      'BUENOS AIRES'],
  ['MAR DEL PLATA',     'BUENOS AIRES'],
  ['PINAMAR',           'BUENOS AIRES'],
  ['BRAGADO',           'BUENOS AIRES'],
  ['ARRECIFES',         'BUENOS AIRES'],
  ['LAS ARMAS',         'BUENOS AIRES'],
  ['LUJAN',             'BUENOS AIRES'],
  ['TRES ARROYOS',      'BUENOS AIRES'],
  ['TANDIL',            'BUENOS AIRES'],
  ['OLAVARRIA',         'BUENOS AIRES'],
  ['OLAVARRÍA',         'BUENOS AIRES'],
  ['SAN NICOLAS',       'BUENOS AIRES'],
  ['SAN NICOLÁS',       'BUENOS AIRES'],
  ['MIRAMAR',           'BUENOS AIRES'],
  ['NECOCHEA',          'BUENOS AIRES'],
  // City → province
  ['ROSARIO',           'SANTA FE'],
  ['BARILOCHE',         'RÍO NEGRO'],
  ['USHUAIA',           'TIERRA DEL FUEGO'],
  ['COMODORO',          'CHUBUT'],
  ['CAMARONES',         'CHUBUT'],
  ['PUERTO MADRYN',     'CHUBUT'],
  ['RAWSON',            'CHUBUT'],
  ['FUTALEUFÚ',         'CHUBUT'],
  ['FUTALEUFU',         'CHUBUT'],
  ['SANTA ROSA',        'LA PAMPA'],
  ['REALICO',           'LA PAMPA'],
  ['REALICÓ',           'LA PAMPA'],
  ['VILLA MERCEDES',    'SAN LUIS'],
  ['VILLA DE LA PUNTA', 'SAN LUIS'],
  ['JUSTO DARACT',      'SAN LUIS'],
  ['AÑATUYA',           'SANTIAGO DEL ESTERO'],
  ['ANUYA',             'SANTIAGO DEL ESTERO'],
  ['FRÍAS',             'SANTIAGO DEL ESTERO'],
  ['FRIAS',             'SANTIAGO DEL ESTERO'],
  ['BANDERA',           'SANTIAGO DEL ESTERO'],
  ['LA BANDA',          'SANTIAGO DEL ESTERO'],
  ['RIO HONDO',         'SANTIAGO DEL ESTERO'],
  ['TARTAGAL',          'SALTA'],
  ['ORAN',              'SALTA'],
  ['ORÁN',              'SALTA'],
  ['GUEMES',            'SALTA'],
  ['GÜEMES',            'SALTA'],
  ['CAFAYATE',          'SALTA'],
  ['CAIMANCITO',        'JUJUY'],
  ['LIBERTADOR GSM',    'JUJUY'],
  ['LIBERTADOR GRAL',   'JUJUY'],
  ['ARAUCO',            'LA RIOJA'],
  ['CHILECITO',         'LA RIOJA'],
  ['TINOGASTA',         'CATAMARCA'],
  ['FIAMBALA',          'CATAMARCA'],
  ['FIAMBALÁ',          'CATAMARCA'],
  ['ALTO VALLE',        'NEUQUÉN'],
  ['AGUA DEL CAJON',    'NEUQUÉN'],
  ['AGUA DEL CAJÓN',    'NEUQUÉN'],
  ['PIEDRA DEL AGUILA', 'NEUQUÉN'],
  ['PIEDRA DEL ÁGUILA', 'NEUQUÉN'],
  ['ALICURA',           'NEUQUÉN'],
  ['ALICURÁ',           'NEUQUÉN'],
  ['LOMA DE LA LATA',   'NEUQUÉN'],
  ['RINCON DE LOS SAUCES', 'NEUQUÉN'],
  ['RINCÓN DE LOS SAUCES', 'NEUQUÉN'],
  ['CIPOLLETTI',        'RÍO NEGRO'],
  ['GENERAL ROCA',      'RÍO NEGRO'],
  ['CASA DE PIEDRA',    'RÍO NEGRO'],
  ['POMONA',            'RÍO NEGRO'],
  ['SALTO GRANDE',      'ENTRE RÍOS'],
  ['YACYRETA',          'CORRIENTES'],
  ['YACYRETÁ',          'CORRIENTES'],
  ['GOYA',              'CORRIENTES'],
  ['CONCEPCION DEL URUGUAY', 'ENTRE RÍOS'],
  ['CONCEPCIÓN DEL URUGUAY', 'ENTRE RÍOS'],
  ['VIALE',             'ENTRE RÍOS'],
  ['OBERÁ',             'MISIONES'],
  ['OBERA',             'MISIONES'],
  ['BARRANQUERAS',      'CHACO'],
  ['SAENZ PEÑA',        'CHACO'],
  ['SÁENZ PEÑA',        'CHACO'],
  ['PRESIDENCIA ROCA',  'CHACO'],
  ['VILLA ANGELA',      'CHACO'],
  ['VILLA ÁNGELA',      'CHACO'],
  ['CHARATA',           'CHACO'],
  ['INGENIERO JUAREZ',  'FORMOSA'],
  ['INGENIERO JUÁREZ',  'FORMOSA'],
  ['PALMAR LARGO',      'FORMOSA'],
  // Province names in plant name
  ['TUCUMAN',           'TUCUMÁN'],
  ['TUCUMÁN',           'TUCUMÁN'],
  ['SALTA',             'SALTA'],
  ['JUJUY',             'JUJUY'],
  ['MENDOZA',           'MENDOZA'],
  ['CORDOBA',           'CÓRDOBA'],
  ['CÓRDOBA',           'CÓRDOBA'],
  ['SAN JUAN',          'SAN JUAN'],
  ['CHUBUT',            'CHUBUT'],
  ['SANTA CRUZ',        'SANTA CRUZ'],
  ['MISIONES',          'MISIONES'],
  ['IGUAZU',            'MISIONES'],
  ['IGUAZÚ',            'MISIONES'],
  ['FORMOSA',           'FORMOSA'],
  ['CORRIENTES',        'CORRIENTES'],
  ['ENTRE RIOS',        'ENTRE RÍOS'],
  ['ENTRE RÍOS',        'ENTRE RÍOS'],
  ['CATAMARCA',         'CATAMARCA'],
  ['LA RIOJA',          'LA RIOJA'],
  ['SANTIAGO DEL ESTERO', 'SANTIAGO DEL ESTERO'],
  ['TIERRA DEL FUEGO',  'TIERRA DEL FUEGO'],
  ['LA PAMPA',          'LA PAMPA'],
  ['SAN LUIS',          'SAN LUIS'],
  ['RIO NEGRO',         'RÍO NEGRO'],
  ['RÍO NEGRO',         'RÍO NEGRO'],
  ['NEUQUEN',           'NEUQUÉN'],
  ['NEUQUÉN',           'NEUQUÉN'],
  ['SANTA FE',          'SANTA FE'],
  ['PARANA',            'ENTRE RÍOS'],
  ['PARANÁ',            'ENTRE RÍOS'],
  // Sector-known aliases
  ['BRIGADIER',         'SANTA FE'],    // Brigadier López power station
  ['EDELAR',            'LA RIOJA'],    // La Rioja distributor
  ['EDECAT',            'CATAMARCA'],   // Catamarca distributor
  ['EMSA ',             'MISIONES'],    // Misiones electric company (note trailing space)
  ['EPEC ',             'CÓRDOBA'],     // Córdoba electric company
  ['EPSE ',             'SAN JUAN'],    // San Juan electric company
  ['H. DIAMANTE',       'MENDOZA'],
  ['NIHUILES',          'MENDOZA'],
  ['POTRERILLOS',       'MENDOZA'],
  ['AES JURAMENTO',     'SALTA'],
  ['JURAMENTO',         'SALTA'],
  ['CABRA CORRAL',      'SALTA'],
];

// 2c — No single-province CAMMESA regions exist → step skipped

// Helper
function assignProvince(plant) {
  const code   = plant.code.toUpperCase();
  const nombre = plant.nombre.toUpperCase();

  // 2a: exact code match
  if (CODE_MAP[code]) return CODE_MAP[code];

  // 2b: name fragment match
  for (const [frag, prov] of NAME_FRAGS) {
    if (nombre.includes(frag.toUpperCase())) return prov;
  }

  // 2d: unassigned → region bucket
  return `region:${plant.region}`;
}

// Assign provinces
for (const plant of plants) {
  plant.provincia = assignProvince(plant);
}

const assigned   = plants.filter(p => !p.provincia.startsWith('region:'));
const unassigned = plants.filter(p =>  p.provincia.startsWith('region:'));

console.log(`\nAssigned:   ${assigned.length} plants`);
console.log(`Unassigned: ${unassigned.length} plants`);
if (unassigned.length > 0) {
  console.log('\nUnassigned plants (genuinely ambiguous):');
  unassigned.forEach(p =>
    console.log(`  [${p.region.padEnd(12)}] ${p.code.padEnd(10)} ${p.nombre.substring(0, 50).padEnd(50)} ${p.totalMW.toFixed(1)} MW → ${p.provincia}`)
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Build per-province aggregates
// ---------------------------------------------------------------------------

function buildAgg(plantList) {
  const agg = {};
  for (const p of plantList) {
    const key = p.provincia;
    if (!agg[key]) agg[key] = { totalMW: 0, byFuente: {}, plantCount: 0, plantList: [] };
    agg[key].totalMW    += p.totalMW;
    agg[key].plantCount += 1;
    agg[key].byFuente[p.fuente] = (agg[key].byFuente[p.fuente] || 0) + p.totalMW;
    agg[key].plantList.push(p);
  }
  return agg;
}

const provAgg   = buildAgg(assigned);
const regionAgg = buildAgg(unassigned);

function finalizeAgg(agg) {
  const out = {};
  for (const [key, v] of Object.entries(agg)) {
    const rounded = {};
    for (const [f, mw] of Object.entries(v.byFuente)) rounded[f] = Math.round(mw * 10) / 10;
    const topPlants = v.plantList
      .sort((a, b) => b.totalMW - a.totalMW)
      .slice(0, 5)
      .map(p => ({ nombre: p.nombre, fuente: p.fuente, mw: Math.round(p.totalMW * 10) / 10 }));
    out[key] = {
      totalMW:    Math.round(v.totalMW * 10) / 10,
      byFuente:   rounded,
      plantCount: v.plantCount,
      topPlants,
    };
  }
  return out;
}

const provinces = finalizeAgg(provAgg);
const unassAgg  = finalizeAgg(regionAgg);

// Stats
const totalCSV     = plants.reduce((s, p) => s + p.totalMW, 0);
const assignedMW   = assigned.reduce((s, p) => s + p.totalMW, 0);
const unassignedMW = unassigned.reduce((s, p) => s + p.totalMW, 0);

const output = {
  generated: '2026-04-07',
  source: 'CAMMESA potencia-instalada Feb-2020',
  note: 'Plants with ambiguous province assigned to unassigned region bucket',
  provinces,
  unassigned: unassAgg,
  stats: {
    totalPlants:     plants.length,
    totalAssigned:   assigned.length,
    totalUnassigned: unassigned.length,
    assignedMW:      Math.round(assignedMW),
    unassignedMW:    Math.round(unassignedMW),
    totalMW:         Math.round(totalCSV),
  },
};

// ---------------------------------------------------------------------------
// Step 4 — Cross-check reconciliation
// ---------------------------------------------------------------------------

console.log('\n--- Reconciliation ---');
console.log(`CSV total MW:        ${totalCSV.toFixed(1)}`);
console.log(`Assigned MW:         ${assignedMW.toFixed(1)}`);
console.log(`Unassigned MW:       ${unassignedMW.toFixed(1)}`);
console.log(`Sum check:           ${(assignedMW + unassignedMW).toFixed(1)}`);
const discrepancy = Math.abs(totalCSV - assignedMW - unassignedMW);
if (discrepancy / totalCSV > 0.001) {
  console.warn(`⚠ Discrepancy: ${discrepancy.toFixed(1)} MW (${(discrepancy / totalCSV * 100).toFixed(2)}%)`);
} else {
  console.log(`✓ Discrepancy within 0.1% (${discrepancy.toFixed(2)} MW)`);
}

console.log('\n--- Per-province totals (assigned, sorted by MW) ---');
const sortedProvs = Object.entries(provinces).sort((a, b) => b[1].totalMW - a[1].totalMW);
for (const [prov, data] of sortedProvs) {
  const fuentes = Object.entries(data.byFuente)
    .sort((a, b) => b[1] - a[1])
    .map(([f, mw]) => `${f.substring(0,3)}:${Math.round(mw)}`)
    .join(' | ');
  console.log(`  ${prov.padEnd(28)} ${String(Math.round(data.totalMW)).padStart(7)} MW  [${data.plantCount} plants]  ${fuentes}`);
}

console.log('\n--- Unassigned region buckets ---');
for (const [key, data] of Object.entries(unassAgg)) {
  console.log(`  ${key.padEnd(28)} ${String(Math.round(data.totalMW)).padStart(7)} MW  [${data.plantCount} plants]`);
}

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------

const outPath = resolve(ROOT, 'src/data/energy/cammesa-por-provincia.json');
writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`\n✓ Written: ${outPath}`);
