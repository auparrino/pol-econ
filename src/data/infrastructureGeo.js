// Approximate geographic coordinates for infrastructure items
// Used for map overlay display

export const infraCoords = [
  { id: 'leat-rodeo-josemaria', nombre: 'LEAT 500kV Rodeo-Josemaría', tipo: 'electrica', lat: -29.50, lon: -69.50, criticidad: 'crítica', provincia: 'San Juan' },
  { id: 'leat-rodeo-chaparro', nombre: 'LEAT 500kV Rodeo-Chaparro', tipo: 'electrica', lat: -29.85, lon: -69.80, criticidad: 'alta', provincia: 'San Juan' },
  { id: 'leat-iglesia-larioja', nombre: 'LEAT 500kV Iglesia-La Rioja', tipo: 'electrica', lat: -29.90, lon: -68.90, criticidad: 'media', provincia: 'San Juan' },
  { id: 'et-rodeo', nombre: 'Ampliación ET Rodeo', tipo: 'electrica', lat: -30.21, lon: -69.13, criticidad: 'crítica', provincia: 'San Juan' },
  { id: 'red-puna-salta', nombre: 'Red eléctrica Puna Salteña (Taca Taca)', tipo: 'electrica', lat: -24.55, lon: -67.70, criticidad: 'crítica', provincia: 'Salta' },
  { id: 'red-calingasta', nombre: 'Red eléctrica Calingasta', tipo: 'electrica', lat: -31.33, lon: -69.42, criticidad: 'alta', provincia: 'San Juan' },
  { id: 'ruta-agua-negra', nombre: 'Túnel Agua Negra (RN150)', tipo: 'vialidad', lat: -30.20, lon: -69.95, criticidad: 'alta', provincia: 'San Juan' },
  { id: 'ruta-josemaria', nombre: 'RN40 tramo Iglesia-Josemaría', tipo: 'vialidad', lat: -29.10, lon: -69.40, criticidad: 'alta', provincia: 'San Juan' },
  { id: 'fc-belgrano', nombre: 'FFCC Belgrano Cargas (NOA)', tipo: 'ferroviario', lat: -24.80, lon: -65.40, criticidad: 'media', provincia: 'Salta' },
  { id: 'puerto-caleta', nombre: 'Puerto Caleta Olivia', tipo: 'portuario', lat: -46.44, lon: -67.52, criticidad: 'baja', provincia: 'Santa Cruz' },
  { id: 'puerto-rosario', nombre: 'Puerto Rosario / Bahía Blanca', tipo: 'portuario', lat: -38.72, lon: -62.27, criticidad: 'media', provincia: 'Buenos Aires' },
  { id: 'alumbrera-infra', nombre: 'Alumbrera (infraestructura MARA)', tipo: 'minera', lat: -27.33, lon: -66.60, criticidad: 'crítica', provincia: 'Catamarca' },
  { id: 'gas-puna-cat', nombre: 'Energía Puna Catamarqueña', tipo: 'electrica', lat: -25.90, lon: -67.40, criticidad: 'media', provincia: 'Catamarca' },
  { id: 'paso-sf', nombre: 'Paso San Francisco', tipo: 'vialidad', lat: -26.90, lon: -68.30, criticidad: 'media', provincia: 'Catamarca' },
];

export const INFRA_TYPE_COLORS = {
  electrica: '#f1c40f',
  vialidad: '#e74c3c',
  ferroviario: '#95a5a6',
  portuario: '#3498db',
  minera: '#e67e22',
};

export const CRITICIDAD_OPACITY = {
  crítica: 1,
  alta: 0.85,
  media: 0.65,
  baja: 0.45,
};
