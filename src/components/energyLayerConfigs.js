// Energy overlay definitions shared by LayerPanel (desktop), MobileMapTab and
// EnergyLayers. Kept out of EnergyLayers.jsx so that module exports only
// components, which is what React Fast Refresh needs.
export const ENERGY_LAYER_CONFIGS = [
  { id: 'yacimientos', label: 'HC Fields', icon: '🗺️', color: '#10B981' },
  { id: 'refinerias', label: 'Refineries', icon: '🏭', color: '#F97316' },
  { id: 'centrales', label: 'Power Plants', icon: '⚡', color: '#A855F7' },
];
