// Canonical source metadata for every dataset in PoliticDash.
// Each entry: { name, url, updated, notes (optional) }
// `updated` reflects the data vintage as of last import.

export const SOURCES = {
  // ─── Macroeconomic ────────────────────────────────────────────
  dolarapi: {
    name: 'dolarapi.com',
    url: 'https://dolarapi.com/docs/argentina',
    updated: 'live',
  },
  argentinadatos: {
    name: 'ArgentinaDatos API',
    url: 'https://argentinadatos.com',
    updated: 'live',
  },
  bcra: {
    name: 'BCRA — Principales variables',
    url: 'https://www.bcra.gob.ar/estadisticas-indicadores/',
    updated: '2026',
  },

  // ─── Demographics & Socioeconomic ─────────────────────────────
  census2022: {
    name: 'Censo Nacional 2022 (INDEC)',
    url: 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-2-41-165',
    updated: '2022',
    notes: 'Resultados definitivos del Censo 2022 (INDEC).',
  },
  ephPoverty: {
    name: 'INDEC EPH — Pobreza e Indigencia',
    url: 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-4-46-152',
    updated: 'H2 2024',
    notes: 'Urban aggregates only (GBA + provincial capitals) — not province-wide.',
  },
  ephUnemployment: {
    name: 'INDEC EPH — Mercado de trabajo (tasas)',
    url: 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-4-31-58',
    updated: 'Q3 2025',
    notes: 'Encuesta Permanente de Hogares — tasa de desocupación por aglomerado urbano (Q3 2025). Cobertura: 31 aglomerados urbanos (no es provincia-nivel). Valores provinciales mapean la provincia a la tasa de su(s) aglomerado(s) EPH; provincias con varios aglomerados usan promedio ponderado por población. Total urbano nacional Q3 2025: 6,3 %.',
  },
  fundarArgendata: {
    name: 'Fundar / Argendata — VAB provincial',
    url: 'https://argendata.fund.ar/graficos/valor-agregado-bruto-vab-por-provincia-y-region/',
    updated: '2024',
  },
  cepalProvincial: {
    name: 'CEPAL / Fundar — VAB per cápita provincial',
    url: 'https://argendata.fund.ar/graficos/vab-per-capita-por-provincia/',
    updated: '2022',
    notes: 'PBG per cápita (PPA) provincial. Fuente primaria: CEPAL — Desagregación provincial del VAB (base 2004), replicado por Argendata.',
  },

  // ─── Employment ───────────────────────────────────────────────
  cepxxiSipa: {
    name: 'CEP XXI / SIPA — Puestos de trabajo por provincia y sector',
    url: 'https://datos.produccion.gob.ar/dataset/puestos-de-trabajo-registrados-por-provincia-y-sector-de-actividad',
    updated: 'Nov 2023 (discontinuado)',
    notes: 'Sistema Integrado Previsional Argentino — puestos asalariados registrados por provincia × CLAE2 (por ubicación del establecimiento). Dataset descontinuado en nov 2023.',
  },
  sipaDeptoPubPriv: {
    name: 'CEP XXI / SIPA — Puestos por departamento (pub + priv)',
    url: 'https://datos.produccion.gob.ar/dataset/puestos-de-trabajo-por-departamento-partido-y-sector-de-actividad',
    updated: 'Nov 2023 (discontinuado)',
    notes: 'Puestos asalariados registrados (puestos, no personas), agregados por provincia desde archivos per-departamento (residencia del trabajador). Métrica distinta a la BIEP/CIPPEC — SIPA cuenta puestos vía registros AFIP del empleador; BIEP cuenta trabajadores.',
  },
  biep: {
    name: 'BIEP / Sec. Gestión y Empleo Público — Empleo público total',
    url: 'https://www.argentina.gob.ar/jefatura/gestion-y-empleo-publico/empleo-publico/biep',
    updated: 'mid-2023',
    notes: 'Base Integrada de Empleo Público y Salarios. Total empleo público en los 3 niveles de gobierno (3,39M en mid-2023): 711k nacional (incl. APN civil, FFAA/FFSS, universidades, empresas públicas, bancos), 2,2M provincial (DNAP), 441k municipal. Cuenta personas/cargos (no puestos como SIPA). Cifra citada por Chequeado, CIPPEC, INAP webinar "Mitos del empleo público" (jun-23).',
  },
  minTrabajo: {
    name: 'Min. Trabajo — OEDE provincial',
    url: 'https://www.argentina.gob.ar/trabajo/estadisticas/oede-estadisticas-provinciales',
    updated: '2024',
  },
  dnapEmpleoProvincial: {
    name: 'DNAP — Ocupación y salarios provinciales (AC+OD+CE)',
    url: 'https://www.argentina.gob.ar/economia/sechacienda/coordinacion-fiscal-provincial/ejecucion-presupuestaria-provincial/ocupacion-y-salarios',
    updated: '2024',
    notes: 'Serie oficial 1987–2024 (xlsx "Provincias y CABA - AC+OD"). Cobertura: cargos ocupados en Administración Central + Organismos Descentralizados + Cuentas Especiales de las 24 jurisdicciones al mes de diciembre. Cuenta cargos, no personas. Excluye Instituciones de Seguridad Social (cajas), Fondos Fiduciarios y organismos públicos con carácter empresarial, así como contratos/becas/pasantías imputados a otras partidas (metodología: DAIPEF-DNCFP, "El Empleo Público en las Provincias Argentinas", 2014). Denominador poblacional: proyección INDEC 2022-2040.',
  },
  censo2022Empleo: {
    name: 'INDEC — Censo Nacional de Población 2022 (características económicas)',
    url: 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-2-41-165',
    updated: '2022',
    notes: 'Censo nacional (conteo total, no muestra) al 18 de mayo de 2022. Universo: población de 14 años y más en viviendas particulares. Tasa de actividad = PEA / pob. 14+; tasa de empleo = ocupados / pob. 14+; tasa de desocupación = desocupados / PEA. Cubre todo el mercado laboral (formal + informal + público + privado + no remunerado no registrado). Los tres indicadores son internamente consistentes: comparten universo y definiciones. Fuente: "Características económicas de la población — Resultados definitivos", cuadros 4.1 y 4.2 (pp. 46-47), feb. 2024.',
  },

  // ─── Fiscal ───────────────────────────────────────────────────
  meconDnap: {
    name: 'Mecon DNAP — APNF',
    url: 'https://www.argentina.gob.ar/economia/sechacienda/asuntosprovinciales',
    updated: '2024',
    notes: 'Administración Pública No Financiera — ejecuciones provinciales. El xlsx "Ejecución trimestral APNF" está en la página de Asuntos Provinciales.',
  },
  meconDnapDeuda: {
    name: 'Mecon DNAP — Stock de Deuda Provincial',
    url: 'https://www.argentina.gob.ar/economia/sechacienda/coordinacion-fiscal-provincial/deuda-publica-provincial',
    updated: '3T 2025',
    notes: 'Stock de deuda al 30-sep-2025, excluye deuda flotante y contingente. Bonos a valor residual.',
  },
  meconMapaFiscal: {
    name: 'Mecon — Mapa Fiscal Provincial',
    url: 'https://www.argentina.gob.ar/economia/sechacienda/coordinacion-fiscal-provincial/mapa-fiscal',
    updated: '3T 2025',
    notes: 'Dashboard oficial de la Subsec. de Coordinación Fiscal Provincial.',
  },
  secHaciendaTop: {
    name: 'Mecon DNAP — Recursos provinciales (APNF + TOP)',
    url: 'https://www.argentina.gob.ar/economia/sechacienda/asuntosprovinciales/direccion-de-recursos-provinciales/recursos-tributarios-de-origen-provincial-top',
    updated: '2024',
    notes: 'Regalías hidrocarburíferas/mineras: surgen del componente "Recursos no tributarios" del APNF de Mecon DNAP (misma fuente que meconDnap).',
  },

  // ─── Exports / Trade ──────────────────────────────────────────
  indecExports: {
    name: 'INDEC — Origen provincial de las exportaciones (OPEX)',
    url: 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-2-79',
    updated: '2025',
    notes: 'OPEX — asigna el origen provincial de los bienes exportados. Serie histórica 1993–2025 por provincia y grandes rubros.',
  },

  // ─── Production ───────────────────────────────────────────────
  magypEstimates: {
    name: 'MAGyP — Estimaciones agrícolas',
    url: 'https://datosestimaciones.magyp.gob.ar',
    updated: '2024/25',
  },
  inv: {
    name: 'INV — Instituto Nacional de Vitivinicultura',
    url: 'https://www.argentina.gob.ar/inv/vinos/estadisticas',
    updated: '2024',
  },
  ipaat: {
    name: 'IPAAT — Instituto Provincial Azucarero Tucumán',
    url: 'https://www.ipaat.gov.ar/',
    updated: '2024',
  },
  secEnergiaOilGas: {
    name: 'Sec. Energía — Producción de petróleo y gas',
    url: 'http://datos.energia.gob.ar/dataset/produccion-de-petroleo-y-gas-por-pozo',
    updated: '2024',
  },
  senasaSigsa: {
    name: 'SENASA — Estadísticas animales (hub)',
    url: 'https://www.argentina.gob.ar/senasa/mercados-y-estadisticas/estadisticas/animal-estadisticas',
    updated: '2024 (bovinos/porcinos/equinos) · 2022 (ovinos/caprinos)',
    notes: 'Landing de estadísticas ganaderas SENASA. Cada especie tiene su propia página de "sector primario" (referenciadas individualmente por especie).',
  },
  senasaBovinos: {
    name: 'SENASA — Existencias bovinas y bubalinas',
    url: 'https://www.argentina.gob.ar/senasa/mercados-y-estadisticas/estadisticas/animal-estadisticas/bovinos/bovinos-y-bubalinos-sector-primario',
    updated: '2024',
    notes: 'Stock bovino por provincia. Serie histórica y tabla maestra en xlsx.',
  },
  senasaOvinos: {
    name: 'SENASA — Existencias ovinas',
    url: 'https://www.argentina.gob.ar/senasa/ovinos-sector-primario',
    updated: '2022',
    notes: 'Caracterización ovinos marzo 2022 (tabla por provincia y departamento).',
  },
  senasaPorcinos: {
    name: 'SENASA — Existencias porcinas',
    url: 'https://www.argentina.gob.ar/senasa/porcinos-sector-primario',
    updated: '2024 (Anuario Porcino)',
    notes: 'Stock porcino por provincia. Anuario Porcino SENASA + tabla de existencias.',
  },
  senasaCaprinos: {
    name: 'SENASA — Existencias caprinas',
    url: 'https://www.argentina.gob.ar/senasa/caprinos-sector-primario',
    updated: '2022',
    notes: 'Caracterización caprinos marzo 2022 (tabla por provincia y departamento).',
  },
  senasaEquinos: {
    name: 'SENASA — Existencias equinas',
    url: 'https://www.argentina.gob.ar/senasa/mercados-y-estadisticas/estadisticas/animal-estadisticas/equinos/equinos-sector-primario',
    updated: '2024',
    notes: 'Stock equino por provincia y departamento.',
  },
  adefa: {
    name: 'ADEFA — Asociación de Fábricas de Automotores',
    url: 'https://www.adefa.org.ar/es/estadisticas-mensuales',
    updated: '2024',
  },
  cafam: {
    name: 'CAFAM — Cámara de Fabricantes de Motovehículos',
    url: 'https://web.archive.org/web/2024/https://www.cafam.org.ar',
    updated: '2024',
    notes: 'CAFAM site intermittently down; archived snapshot linked.',
  },
  cna2018: {
    name: 'Censo Nacional Agropecuario 2018',
    url: 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-8-87',
    updated: '2018',
  },

  // ─── Energy ───────────────────────────────────────────────────
  datosEnergia: {
    name: 'Sec. Energía — Datos abiertos (centrales, refinerías, yacimientos)',
    url: 'http://datos.energia.gob.ar/dataset?groups=generacion-de-energia-electrica',
    updated: 'Feb 2020 (plant registry) / 2024 (production)',
    notes: 'Centrales: dataset/generacion-electrica-centrales-de-generacion. Refinerías: dataset/refinacion-hidrocarburos-refinerias. Áreas HC: dataset/produccion-hidrocarburos-concesiones-de-explotacion.',
  },
  cammesa: {
    name: 'CAMMESA — Variables relevantes del MEM (resumen anual)',
    url: 'https://cammesaweb.cammesa.com/variables-relevantes-del-mem-resumen-anual/',
    updated: 'End-2024',
  },
  enargas: {
    name: 'ENARGAS — Ente Nacional Regulador del Gas',
    url: 'https://www.enargas.gob.ar/secciones/transporte-y-distribucion/datos-operativos.php',
    updated: '2024',
  },

  // ─── Mining ───────────────────────────────────────────────────
  siacam: {
    name: 'SIACAM — Cartera de Proyectos Mineros Metalíferos y Litio',
    url: 'https://www.argentina.gob.ar/economia/mineria/siacam',
    updated: 'Mar 2026',
  },

  // ─── Congress / Political ─────────────────────────────────────
  comovoto: {
    name: 'comovoto.dev.ar',
    url: 'https://comovoto.dev.ar',
    updated: '2024–2026',
    notes: 'Roll-call votes scraped from Congreso (Senate + Deputies).',
  },
  congresoSenado: {
    name: 'HCDN / HCSN — Registros de votación',
    url: 'https://votaciones.hcdn.gob.ar',
    updated: '2024–2026',
  },

  // ─── Governors / Cabinet ──────────────────────────────────────
  govOfficial: {
    name: 'Sitios oficiales provinciales + medios',
    url: null,
    updated: 'Mar 2026',
    notes: 'Cross-checked with Wikipedia and press reporting.',
  },

  // ─── RIGI ─────────────────────────────────────────────────────
  rigiOfficial: {
    name: 'RIGI — Régimen de Incentivo para Grandes Inversiones (Ley 27.742)',
    url: 'https://www.argentina.gob.ar/normativa/nacional/ley-27742-401266/texto',
    updated: 'Mar 2026',
    notes: 'Texto completo de Ley 27.742 (Ley de Bases). RIGI está en Título VII.',
  },

  // ─── Geography / Maps ─────────────────────────────────────────
  ign: {
    name: 'IGN — Capas SIG',
    url: 'https://www.ign.gob.ar/NuestrasActividades/InformacionGeoespacial/CapasSIG',
    updated: '2024',
  },

  // ─── Commodities ──────────────────────────────────────────────
  lme: {
    name: 'LME / Market data',
    url: 'https://www.lme.com',
    updated: '2026',
    notes: 'Metal reference prices (Au, Cu, Li).',
  },
};
