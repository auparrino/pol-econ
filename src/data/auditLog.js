// Data audit log shown in "Fuentes y método". Every dataset the dashboard
// displays, with its source, the period it describes, and what the
// 2026-10 audit found. vintageDate (YYYY-MM) drives the "data age" label.
// Full per-value tables live in docs/auditoria-datos-2026-10.md.

export const AUDIT_DATE = '2026-10-20';

export const AUDIT_NOTES = [
  'Se contrastaron todos los conjuntos de datos contra la fuente primaria (INDEC, Mecon-DNAP, Congreso, Secretaría de Energía, etc.). Más de 200 valores se corrigieron o actualizaron.',
  'Pobreza y desempleo pasaron a los últimos datos de INDEC (1er semestre y 2º trimestre de 2026). Varias cifras provinciales anteriores no coincidían con el período que declaraban.',
  'La dependencia fiscal tenía dos versiones contradictorias en el tablero. Ahora hay una sola, recalculada desde el archivo oficial de DNAP (2025) y consistente con el indicador de autonomía fiscal que publica Hacienda.',
  'La población usaba en parte cifras provisorias del Censo 2022. Se reemplazó por los resultados definitivos (45.892.285 habitantes).',
  'Se retiraron del ranking los "años de escolaridad" y la alfabetización: el Censo 2022 no publica esos indicadores, así que no podían verificarse.',
];

export const DATASETS = [
  // Social
  { area: 'Social', name: 'Pobreza por provincia', source: 'INDEC — EPH, Incidencia de la pobreza', url: 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-4-46-152', vintage: '1er semestre 2026', vintageDate: '2026-06', status: 'actualizado', note: 'Antes decía 2º semestre 2024 y 4 provincias no coincidían. Mide aglomerados urbanos: provincias con varios aglomerados se ponderan por personas.' },
  { area: 'Social', name: 'Desempleo por provincia', source: 'INDEC — EPH, Mercado de trabajo', url: 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-4-31-58', vintage: '2º trimestre 2026', vintageDate: '2026-06', status: 'actualizado', note: 'El total nacional figuraba 6,3 % para el 3T-2025; el valor oficial era 6,6 %. Hoy: 7,9 %.' },
  { area: 'Social', name: 'Empleo según el Censo 2022', source: 'INDEC — Censo 2022, características económicas', url: 'https://www.indec.gob.ar/ftp/cuadros/poblacion/censo2022_caracteristicas_economicas.pdf', vintage: 'Mayo 2022', vintageDate: '2022-05', status: 'corregido', note: 'Categoría ocupacional: tres columnas estaban intercambiadas (patrones, trabajo familiar y servicio doméstico). Sector privado nacional estaba sobrestimado en 500.000.' },
  // Economy
  { area: 'Economía', name: 'Producto per cápita (PPA)', source: 'CEPAL / Fundar-Argendata', url: 'https://argendata.fund.ar/', vintage: '2022', vintageDate: '2022-12', status: 'corregido', note: '11 provincias tenían valores redondeados sin fuente (p. ej. Chaco 13.500 → 18.313). La Rioja queda marcada como no verificada.' },
  { area: 'Economía', name: 'Exportaciones por provincia', source: 'INDEC — Origen provincial de las exportaciones', url: 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-2-79', vintage: '2025', vintageDate: '2025-12', status: 'actualizado' },
  { area: 'Economía', name: 'Empleo privado registrado', source: 'Secretaría de Trabajo — Situación y evolución del trabajo registrado (SIPA/ARCA)', url: 'https://www.argentina.gob.ar/sites/default/files/trabajoregistrado_2607_estadisticas.xlsx', vintage: 'Julio 2026 (provisorio)', vintageDate: '2026-07', status: 'actualizado', note: 'Antes usaba CEP XXI de noviembre de 2023 (serie discontinuada). Ahora toma el último dato provincial oficial y agrega la variación desde nov-2023.' },
  // State
  { area: 'Estado y fiscal', name: 'Dependencia fiscal y cuentas provinciales', source: 'Mecon — DNAP, Ejecución APNF', url: 'https://www.argentina.gob.ar/economia/sechacienda/asuntosprovinciales', vintage: '2025 (provisorio)', vintageDate: '2025-12', status: 'corregido', note: 'Fórmula: (tributos nacionales + transferencias corrientes y de capital) / ingresos totales. Antes excluía contribuciones y recursos de capital, y otra tabla usaba valores 2023 sin fuente. Las "transferencias discrecionales" mostraban en realidad fondos automáticos.' },
  { area: 'Estado y fiscal', name: 'Empleo público provincial', source: 'Mecon — DNAP, Ocupación y salarios', url: 'https://www.argentina.gob.ar/economia/sechacienda/coordinacion-fiscal-provincial/ejecucion-presupuestaria-provincial/ocupacion-y-salarios', vintage: 'Diciembre 2025', vintageDate: '2025-12', status: 'actualizado', note: '2.308.763 cargos (49,8 cada 1.000 hab.). Serie 2017–2024 reemplazada por la revisión oficial.' },
  { area: 'Estado y fiscal', name: 'Empleo público en los tres niveles', source: 'BIEP / INAP', url: 'https://www.argentina.gob.ar/jefatura/gestion-y-empleo-publico/empleo-publico/biep', vintage: 'Mediados 2023', vintageDate: '2023-06', status: 'corregido', note: 'Valores ajustados a la fuente: 711.879 nacional, 2.237.334 provincial, 440.687 municipal. No hay desagregación más reciente.' },
  // Politics
  { area: 'Política', name: 'Gobernadores, vices y mandatos', source: 'Sitios oficiales provinciales y prensa', vintage: 'Octubre 2026', vintageDate: '2026-10', status: 'corregido', note: 'Cinco vicegobernadores estaban mal (Chaco: vacante desde dic-2025). Partido de Sáenz: Identidad Salteña. Mandato de Tucumán: oct-2023 a oct-2027.' },
  { area: 'Política', name: 'Composición del Congreso y nóminas', source: 'HCDN y Senado de la Nación', url: 'https://www.diputados.gob.ar/diputados/', vintage: 'Octubre 2026', vintageDate: '2026-10', status: 'corregido', note: 'Senado verificado sin cambios. Diputados: UxP 92 (no 93). Se cotejaron los 329 nombres; reemplazos de 2026 incorporados.' },
  { area: 'Política', name: 'Votaciones nominales clave', source: 'HCDN y Senado — actas de votación', vintage: 'Dic. 2025 – feb. 2026', vintageDate: '2026-02', status: 'parcial', note: 'Los recuentos verificados coinciden. Fechas corregidas. Faltan la sanción final de la Ley de Glaciares (abr-2026) e Inocencia Fiscal II.' },
  { area: 'Política', name: 'Contexto político provincial', source: 'Resultados electorales y prensa', vintage: 'Octubre 2026', vintageDate: '2026-10', status: 'corregido', note: 'Resúmenes de las elecciones 2025 reescritos en 10 provincias (varios eran incorrectos). Composición de legislaturas y etiquetas de postura son editoriales.' },
  { area: 'Política', name: 'Gabinetes provinciales', source: 'Sitios oficiales provinciales', vintage: 'Octubre 2026 (muestra)', vintageDate: '2026-10', status: 'parcial', note: 'Revisados los de las provincias más grandes; el resto puede tener cambios no reflejados.' },
  // Demography
  { area: 'Demografía', name: 'Población, superficie y densidad', source: 'INDEC — Censo 2022, resultados definitivos', url: 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-2-41-165', vintage: 'Mayo 2022', vintageDate: '2022-05', status: 'corregido', note: 'Se usaban cifras provisorias (p. ej. Córdoba 3.978.984 → 3.840.905).' },
];
