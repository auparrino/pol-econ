/**
 * Energy Infrastructure Layers for Leaflet Map
 * Data: datos.energia.gob.ar (CKAN API)
 *
 * 4 layers:
 *  1. Yacimientos (879 polygon areas)
 *  2. Gasoductos ENARGAS (3000 line segments)
 *  3. Refinerías (15 points)
 *  4. Centrales de generación (75 points)
 */

import { useEffect, useState } from 'react';
import { GeoJSON, CircleMarker, Tooltip } from 'react-leaflet';

/* ─── Colors ─── */
const CENTRAL_COLORS = {
  TE: '#EF4444',    // Térmica
  HI: '#3B82F6',    // Hidráulica
  NU: '#A855F7',    // Nuclear
  EO: '#10B981',    // Eólica
  SO: '#FBBF24',    // Solar
  BI: '#84CC16',    // Biomasa
  default: '#6B7280',
};

const CENTRAL_LABELS = {
  TE: 'Thermal', HI: 'Hydro', NU: 'Nuclear',
  EO: 'Wind', SO: 'Solar', BI: 'Biomass',
};

/* ─── Lazy data loading with cache ─── */
const dataCache = {};

async function loadLayerData(layerId) {
  if (dataCache[layerId]) return dataCache[layerId];
  try {
    let mod;
    switch (layerId) {
      case 'yacimientos': mod = await import('../data/energy/yacimientos.json'); break;
      case 'gasoductos': mod = await import('../data/energy/gasoductos.json'); break;
      case 'centrales': mod = await import('../data/energy/centrales.json'); break;
      case 'refinerias': mod = await import('../data/energy/refinerias.json'); break;
      default: return null;
    }
    dataCache[layerId] = mod.default || mod;
    return dataCache[layerId];
  } catch (err) {
    console.error(`Error loading ${layerId}:`, err);
    return null;
  }
}

/* ─── Yacimientos (polygon fill) ─── */
function YacimientosLayer() {
  const [data, setData] = useState(null);
  useEffect(() => { loadLayerData('yacimientos').then(setData); }, []);
  if (!data) return null;

  return (
    <GeoJSON
      data={data}
      pane="energyPane"
      style={() => ({
        fillColor: '#10B981',
        fillOpacity: 0.18,
        weight: 0.7,
        color: '#10B981',
        opacity: 0.45,
      })}
      onEachFeature={(feature, layer) => {
        const p = feature.properties || {};
        layer.bindTooltip(
          `<div class="font-display text-xs">
            <strong>${p.nombre || 'S/N'}</strong><br/>
            <span style="color:#94A3B8">${p.empresa || ''}</span>
          </div>`,
          { sticky: true, className: 'province-tooltip' }
        );
      }}
    />
  );
}

/* ─── Gasoductos (line layer) ─── */
function GasoductosLayer() {
  const [data, setData] = useState(null);
  useEffect(() => { loadLayerData('gasoductos').then(setData); }, []);
  if (!data) return null;

  return (
    <GeoJSON
      data={data}
      pane="energyPane"
      style={() => ({
        color: '#3B82F6',
        weight: 1.5,
        opacity: 0.55,
      })}
      onEachFeature={(feature, layer) => {
        const p = feature.properties || {};
        const name = p.nombre || 'Gasoducto';
        const extra = p.concesion || '';
        layer.bindTooltip(
          `<div class="font-display text-xs">
            <strong>${name}</strong>
            ${extra ? `<br/><span style="color:#94A3B8">${extra}</span>` : ''}
          </div>`,
          { sticky: true, className: 'province-tooltip' }
        );
      }}
    />
  );
}

/* ─── Refinerías (large circle points) ─── */
function RefineriasLayer() {
  const [data, setData] = useState(null);
  useEffect(() => { loadLayerData('refinerias').then(setData); }, []);
  if (!data?.features) return null;

  return (
    <>
      {data.features.map((feat, i) => {
        const coords = feat.geometry?.coordinates;
        if (!coords || feat.geometry.type !== 'Point') return null;
        const [lng, lat] = coords;
        if (!lat || !lng || lat > 0 || lng > 0) return null;
        const p = feat.properties || {};

        return (
          <CircleMarker
            key={`ref-${i}`}
            center={[lat, lng]}
            radius={7}
            pane="markersPane"
            pathOptions={{
              color: '#fff',
              fillColor: '#F97316',
              fillOpacity: 0.9,
              weight: 2,
              opacity: 0.9,
            }}
          >
            <Tooltip direction="top" offset={[0, -5]}>
              <div className="font-display text-xs">
                <strong>{p.nombre || p.razon_social || 'Refinería'}</strong>
                <br />
                <span style={{ color: '#94A3B8' }}>{p.empresa || p.razon_social || ''}</span>
                {p.provincia && <><br />{p.provincia}</>}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}

/* ─── Centrales de generación (sized circle points) ─── */
function CentralesLayer() {
  const [data, setData] = useState(null);
  useEffect(() => { loadLayerData('centrales').then(setData); }, []);
  if (!data?.features) return null;

  return (
    <>
      {data.features.map((feat, i) => {
        const coords = feat.geometry?.coordinates;
        if (!coords || feat.geometry.type !== 'Point') return null;
        const [lng, lat] = coords;
        if (!lat || !lng || lat > 0 || lng > 0) return null;
        const p = feat.properties || {};

        const tec = (p.tecnologia || '').toUpperCase().slice(0, 2);
        const color = CENTRAL_COLORS[tec] || CENTRAL_COLORS.default;
        const label = CENTRAL_LABELS[tec] || p.tecnologia_etiqueta || p.tecnologia || '';
        const mw = parseFloat(p.potencia_instalada_mw) || 0;
        const radius = mw > 500 ? 8 : mw > 100 ? 6 : mw > 10 ? 5 : 3;

        return (
          <CircleMarker
            key={`cen-${i}`}
            center={[lat, lng]}
            radius={radius}
            pane="markersPane"
            pathOptions={{
              color: '#fff',
              fillColor: color,
              fillOpacity: 0.85,
              weight: 1.5,
              opacity: 0.9,
            }}
          >
            <Tooltip direction="top" offset={[0, -5]}>
              <div className="font-display text-xs">
                <strong>{p.nombre || p.central || 'Central'}</strong>
                <br />
                <span style={{ color: '#94A3B8' }}>{label}</span>
                {mw > 0 && <><br /><span style={{ color }}>{mw} MW</span></>}
                {p.provincia && <><br />{p.provincia}</>}
                {p.nombre_agente && <><br /><span style={{ color: '#64748B' }}>{p.nombre_agente}</span></>}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}

/* ─── Layer config (exported for LayerPanel) ─── */
export const ENERGY_LAYER_CONFIGS = [
  { id: 'yacimientos', label: 'HC Fields', icon: '🗺️', color: '#10B981' },
  { id: 'refinerias', label: 'Refineries', icon: '🏭', color: '#F97316' },
  { id: 'centrales', label: 'Power Plants', icon: '⚡', color: '#A855F7' },
];

/* ─── Main export ─── */
export default function EnergyLayers({ activeLayers }) {
  if (!activeLayers || activeLayers.length === 0) return null;

  return (
    <>
      {activeLayers.includes('yacimientos') && <YacimientosLayer />}
      {activeLayers.includes('refinerias') && <RefineriasLayer />}
      {activeLayers.includes('centrales') && <CentralesLayer />}
    </>
  );
}
