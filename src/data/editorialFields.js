// Which fields are measurements and which are this tool's own judgement.
//
// The dashboard mixes both. "Ocupados: 21.094.987" comes from INDEC's census;
// "Alineamiento: Oposición dura" comes from whoever last edited governors.js.
// Rendering them with the same weight is the single largest editorial risk this
// project carries, and the registry exists so the distinction is declared once,
// enforced by the validator, and impossible to add to silently.
//
// A field goes in EDITORIAL when no source publishes it — when removing it from
// the repo would destroy the information rather than make it re-derivable.

export const EDITORIAL_FIELDS = {
  'governors.js': [
    'alineamiento_nacion',    // where the governor stands vs the national Executive
    'posicion_ideologica',    // free-text characterisation
  ],
  'politicalContext.js': [
    'alineacion_milei',
    'posicion_mineria',
    'riesgo_cambio_politico',
    'notas_politicas',
    'tracking_legislativo',
    'elecciones_2025_resultado',   // narrative summary, not a returns table
    'ley_glaciares_posicion',
    'legislatura_composicion',     // hand-tallied, no official machine-readable source
    'confianza',                   // the self-assessment of the above
  ],
  'rigiProjects.json': [
    'estado',   // curated from filings, not an official register export
  ],
};

/** Fields that are measurements: sourced, dated, re-derivable from `_meta.source`. */
export const MEASURED_FIELDS = {
  'governors.js': [
    'provincia', 'gobernador', 'vicegobernador', 'partido', 'coalicion',
    'inicio_mandato', 'fin_mandato', 'proxima_eleccion', 'region',
    'poblacion_censo_2022', 'superficie_km2', 'densidad',
  ],
  'politicalContext.js': [
    'provincia',
    'rigi_adhesion_provincial',   // the adhesion law exists or it does not
  ],
};

export function isEditorial(file, field) {
  return (EDITORIAL_FIELDS[file] || []).includes(field);
}
