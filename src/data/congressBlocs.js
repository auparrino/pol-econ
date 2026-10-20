// Official data from senado.gob.ar and diputados.gob.ar — verified as of 2026-10-20
// Senate: https://www.senado.gob.ar/senadores/listados/agrupados-por-bloques
//   LLA 21 · Justicialista 21 · UCR 10 · Frente PRO 3 · Prov. 17 (Convicción Federal 3, Justicia Social
//   Federal 2, Frente Cívico por Santiago 2, Movere Santa Cruz 2, Movimiento por Misiones 2, Provincias
//   Unidas 2, Despierta Chubut 1, Independencia 1, La Neuquinidad 1, Primero los Salteños 1)
// Deputies: https://www.diputados.gob.ar/diputados/ (bloc column)
//   LLA 95 · UxP 92 · PRO 12 · UCR 6 · FIT 4 (PTS 2, PO 1, IS 1)
//   Prov. 42 = Provincias Unidas 18, Argentina Federal 9, Elijo Catamarca 3, Independencia 3,
//     Primero San Luis 2, Producción y Trabajo 2, Encuentro Federal 2, Por Santa Cruz 1,
//     La Neuquinidad 1, Defendamos Córdoba 1
//   Other 6 = Coalición Cívica 2, MID 2, Adelante Buenos Aires 1, Coherencia 1
//   (one CABA LLA seat shown as "pendiente de incorporación" on the official list)
export const senateBlocs = [
  { code: 'LLA', label: 'LLA', seats: 21, color: '#8e44ad' },
  { code: 'PJ', label: 'PJ/UxP', seats: 21, color: '#2980b9' },
  { code: 'UCR', label: 'UCR', seats: 10, color: '#e74c3c' },
  { code: 'PRO', label: 'PRO', seats: 3, color: '#f1c40f' },
  { code: 'PROV', label: 'Prov.', seats: 17, color: '#27ae60' },
];

export const deputyBlocs = [
  { code: 'LLA', label: 'LLA', seats: 95, color: '#8e44ad' },
  { code: 'PJ', label: 'UxP', seats: 92, color: '#2980b9' },
  { code: 'PROV', label: 'Prov.', seats: 42, color: '#27ae60' },
  { code: 'PRO', label: 'PRO', seats: 12, color: '#f1c40f' },
  { code: 'UCR', label: 'UCR', seats: 6, color: '#e74c3c' },
  { code: 'FIT', label: 'FIT', seats: 4, color: '#c0392b' },
  { code: 'OTROS', label: 'Otros', seats: 6, color: '#669BBC' },
];

export const SENATE_TOTAL = 72;
export const DEPUTY_TOTAL = 257;
