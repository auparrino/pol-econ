import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { miningProjects } from '../data/miningProjects';
import EnergyLayers from './EnergyLayers';
import { sociodemographic } from '../data/sociodemographic';
import { getAllFiscal } from '../hooks/useEconomyData';
import alignmentScores from '../data/alignmentScores.json';

const PARTY_COLORS = {
  'PJ': '#1a6fa3',
  'Peronismo': '#1a6fa3',
  'UCR': '#c0392b',
  'PRO': '#d4a800',
  'LLA': '#7d3c98',
  'La Libertad Avanza': '#7d3c98',
  'MPN': '#1e8449',
  'Hacemos por Córdoba': '#d35400',
  'default': '#7f8c8d',
};

const ALIGNMENT_COLORS = {
  'oficialismo': '#7d3c98',
  'aliado': '#17a589',
  'negociador': '#d4a800',
  'oposición': '#C1121F',
  'oposición dura': '#780000',
  'default': '#7f8c8d',
};

const REGION_COLORS = {
  'NOA': '#e67e22',
  'NEA': '#27ae60',
  'Cuyo': '#8e44ad',
  'Pampeana': '#3498db',
  'Patagonia': '#1abc9c',
  'CABA': '#f1c40f',
};

const POPULATION_SCALE = [
  { max: 100000, color: '#1a3a5c' },
  { max: 500000, color: '#2a5a7c' },
  { max: 1000000, color: '#3a7a9c' },
  { max: 2000000, color: '#4a9abc' },
  { max: 5000000, color: '#669BBC' },
  { max: Infinity, color: '#FDF0D5' },
];

const MINERAL_COLORS = {
  'Litio':      '#00d4ff',
  'Oro':        '#ffd700',
  'Plata':      '#c0c0c0',
  'Cobre':      '#b87333',
  'Plomo':      '#7a7a7a',
  'Uranio':     '#7fff00',
  'Hierro':     '#a0522d',
  'Manganeso':  '#da70d6',
  'Zinc':       '#a8a8a8',
  'default':    '#669BBC',
};

const ESTADO_RADIUS = {
  'Producción':                    6,
  'Construcción':                  5.5,
  'Factibilidad':                  5,
  'Prefactibilidad':               4.5,
  'Evaluación Económica Preliminar': 4,
  'Exploración avanzada':          4,
  'Reingeniería':                  4,
  'Exploración inicial':           3,
  'Prospección':                   2.5,
  'default':                       3,
};

function getPartyColor(governor) {
  if (!governor) return PARTY_COLORS.default;
  const partido = governor.partido?.toLowerCase() || '';
  const coalicion = governor.coalicion?.toLowerCase() || '';

  // 1. Check partido name first (most reliable)
  if (partido.includes('libertad avanza')) return PARTY_COLORS['LLA'];
  if (partido.includes('ucr') || partido.includes('radical')) return PARTY_COLORS['UCR'];
  if (partido === 'pro' || partido.startsWith('pro ') || partido.startsWith('pro/')) return PARTY_COLORS['PRO'];
  if (partido.includes('hacemos por c')) return PARTY_COLORS['Hacemos por Córdoba'];
  if (partido.includes('justicialista') || partido.includes('pj')
    || partido.includes('peronism') || partido.includes('frente de todos')) return PARTY_COLORS['PJ'];

  // 2. Check coalicion as fallback
  if (coalicion.includes('unión por la patria')) return PARTY_COLORS['PJ'];
  if (coalicion.includes('pj') || coalicion.includes('justicialista')) return PARTY_COLORS['PJ'];
  if (coalicion.includes('lla') || coalicion.includes('libertad avanza')) return PARTY_COLORS['LLA'];

  // 3. Provincial parties (everything else)
  return PARTY_COLORS['MPN']; // green = provincial parties
}

function getAlignmentColor(governor) {
  if (!governor) return ALIGNMENT_COLORS.default;
  const a = governor.alineamiento_nacion?.toLowerCase() || '';
  if (a.includes('oficialismo')) return ALIGNMENT_COLORS['oficialismo'];
  if (a.includes('aliado')) return ALIGNMENT_COLORS['aliado'];
  if (a.includes('negociador') || a.includes('pragmát')) return ALIGNMENT_COLORS['negociador'];
  if (a.includes('oposición dura') || a.includes('oposicion dura')) return ALIGNMENT_COLORS['oposición dura'];
  if (a.includes('oposición') || a.includes('oposicion')) return ALIGNMENT_COLORS['oposición'];
  return ALIGNMENT_COLORS.default;
}

function getPopulationColor(governor) {
  const pop = governor?.poblacion_censo_2022 || 0;
  return POPULATION_SCALE.find(s => pop <= s.max)?.color || POPULATION_SCALE[POPULATION_SCALE.length - 1].color;
}

function getRegionColor(governor) {
  return REGION_COLORS[governor?.region] || '#669BBC';
}

function getFiscalColor(provinceName) {
  const pn = (provinceName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const isCABA = pn.includes('ciudad') || pn === 'caba';
  const allFiscal = getAllFiscal();
  const entry = allFiscal.find(d => {
    const dn = d.province.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (isCABA) return dn.includes('ciudad') || dn === 'caba';
    if (dn.includes('ciudad')) return false;
    return dn === pn || dn.includes(pn) || pn.includes(dn);
  });
  const dep = entry?.dependency ?? 50;
  // Lower dependency = greener
  if (dep <= 30) return '#27ae60';
  if (dep <= 50) return '#2ecc71';
  if (dep <= 70) return '#669BBC';
  if (dep <= 85) return '#d4a800';
  return '#C1121F';
}

const POVERTY_SCALE = [
  { max: 25, color: '#27ae60' },
  { max: 35, color: '#f39c12' },
  { max: 45, color: '#e67e22' },
  { max: 55, color: '#C1121F' },
  { max: Infinity, color: '#780000' },
];

function getAlignScoreColor(provinceName) {
  const target = provinceName?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (!target) return '#e5e5e5';
  const isCABA = target.includes('ciudad') || target === 'caba';
  let match = null;
  for (const [key, val] of Object.entries(alignmentScores.per_province || {})) {
    const k = key.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (isCABA) {
      if (k.includes('ciudad') || k === 'caba') { match = val; break; }
      continue;
    }
    if (k.includes('ciudad')) continue;
    if (k === target || k.includes(target) || target.includes(k)) { match = val; break; }
  }
  const s = match?.score_executive;
  if (s == null) return '#e5e5e5';
  if (s < 0.2) return '#780000';
  if (s < 0.4) return '#C1121F';
  if (s < 0.6) return '#d4a800';
  if (s < 0.8) return '#17a589';
  return '#7d3c98';
}

function getPovertyColor(provinceName) {
  const pn = provinceName?.toLowerCase();
  const isCABA = pn?.includes('ciudad');
  const data = sociodemographic.find(s => {
    const sn = s.provincia?.toLowerCase();
    if (isCABA) return sn === 'ciudad de buenos aires' || sn === 'caba';
    if (sn === 'ciudad de buenos aires' || sn === 'caba') return false;
    return sn === pn || sn?.includes(pn) || pn?.includes(sn);
  });
  const pov = data?.pobreza ?? 40;
  return POVERTY_SCALE.find(s => pov <= s.max)?.color || '#669BBC';
}


// Creates custom panes with explicit z-index so energy layers always render above provinces
function CreatePanes() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane('provincesPane')) {
      const pp = map.createPane('provincesPane');
      pp.style.zIndex = 395;
    }
    if (!map.getPane('energyPane')) {
      const ep = map.createPane('energyPane');
      ep.style.zIndex = 420;
      ep.style.pointerEvents = 'none'; // tooltips still work via SVG events
    }
    if (!map.getPane('markersPane')) {
      const mp = map.createPane('markersPane');
      mp.style.zIndex = 440;
    }
  }, [map]);
  return null;
}

function MapEvents({ onProvinceClick }) {
  // Empty — events handled via GeoJSON
  return null;
}

function MiningMarkers({ visible }) {
  if (!visible) return null;

  return (
    <>
      {miningProjects.map((project, i) => {
        const color = MINERAL_COLORS[project.mineral] || MINERAL_COLORS.default;
        const radius = ESTADO_RADIUS[project.estado] || ESTADO_RADIUS.default;
        const allPais = [project.pais, project.pais2, project.pais3].filter(Boolean).join(' · ');

        return (
          <CircleMarker
            key={i}
            center={[project.lat, project.lon]}
            radius={radius}
            pane="markersPane"
            pathOptions={{
              color: color,
              fillColor: color,
              fillOpacity: 0.75,
              weight: 1,
              opacity: 0.9,
            }}
          >
            <Tooltip direction="top" offset={[0, -5]}>
              <div className="font-display">
                <strong>{project.nombre}</strong>
                <br />
                <span className="text-steel">{project.mineral} — {project.provincia}</span>
                <br />
                <span style={{ color: '#94A3B8' }}>{project.estado}</span>
                {project.operador && (
                  <><br /><span className="text-cream-muted">{project.operador}</span></>
                )}
                {allPais && (
                  <><br /><span style={{ color: '#94A3B8' }}>{allPais}</span></>
                )}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}


function FlyToProvince({ geoData, selectedProvince }) {
  const map = useMap();
  const prevSelected = useRef(null);

  useEffect(() => {
    if (!geoData) return;
    if (selectedProvince) {
      const feature = geoData.features.find(
        f => f.properties.NAME_1?.toLowerCase() === selectedProvince.toLowerCase()
      );
      if (!feature) return;
      const bounds = L.geoJSON(feature).getBounds();
      if (bounds.isValid()) {
        map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 7, duration: 0.8 });
      }
    } else if (prevSelected.current) {
      // Deselected — fly back to full Argentina view.
      map.flyToBounds([[-55, -74], [-21, -53]], { padding: [20, 20], duration: 0.8 });
    }
    prevSelected.current = selectedProvince;
  }, [selectedProvince, geoData, map]);

  return null;
}

function FitBounds({ geoData }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (geoData && !fitted.current) {
      // Argentina bounds: roughly -55 to -21 lat, -73 to -53 lon
      map.fitBounds([[-55, -74], [-21, -53]], { padding: [20, 20] });
      fitted.current = true;
    }
  }, [geoData, map]);

  return null;
}

export default function ArgentinaMap({
  governors,
  choroplethMode,
  overlays,
  energyLayers,
  selectedProvince,
  onProvinceSelect,
}) {
  const [geoData, setGeoData] = useState(null);
  const geoRef = useRef(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}argentina-provinces.geojson`)
      .then(r => r.json())
      .then(setGeoData)
      .catch(console.error);
  }, []);

  const getColor = useCallback((provinceName) => {
    const pn = provinceName?.toLowerCase();
    const gov = governors.find(g => g.provincia?.toLowerCase() === pn)
      || governors.find(g => {
        const gp = g.provincia?.toLowerCase();
        if (!gp || !pn) return false;
        if (pn.includes('ciudad') !== gp.includes('ciudad')) return false;
        return gp.includes(pn) || pn.includes(gp);
      });

    switch (choroplethMode) {
      case 'none': return '#d6cfc0';
      case 'partido': return getPartyColor(gov);
      case 'alineamiento': return getAlignmentColor(gov);
      case 'poblacion': return getPopulationColor(gov);
      case 'region': return getRegionColor(gov);
      case 'pobreza': return getPovertyColor(provinceName);
      case 'fiscal': return getFiscalColor(provinceName);
      case 'score_executive': return getAlignScoreColor(provinceName);
      default: return '#669BBC';
    }
  }, [governors, choroplethMode]);

  const style = useCallback((feature) => {
    const name = feature.properties.NAME_1;
    const isSelected = selectedProvince?.toLowerCase() === name?.toLowerCase();
    const fillColor = getColor(name);

    return {
      fillColor,
      weight: isSelected ? 2.5 : 1,
      opacity: 1,
      color: '#000',
      fillOpacity: isSelected ? 0.85 : 0.6,
    };
  }, [getColor, selectedProvince]);

  // Store the latest callback in a ref so GeoJSON event handlers always call current version
  const onProvinceSelectRef = useRef(onProvinceSelect);
  onProvinceSelectRef.current = onProvinceSelect;

  const onEachFeature = useCallback((feature, layer) => {
    const name = feature.properties.NAME_1;

    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({
          weight: 2,
          color: '#FDF0D5',
          fillOpacity: 0.8,
        });
      },
      mouseout: (e) => {
        if (geoRef.current) {
          geoRef.current.resetStyle(e.target);
        }
      },
      click: () => {
        onProvinceSelectRef.current(name);
      },
    });

    layer.bindTooltip(name, {
      sticky: true,
      className: 'province-tooltip',
      direction: 'auto',
    });
  }, []); // stable callback — uses ref for onProvinceSelect

  // Update styles when choropleth or selection changes (without re-creating GeoJSON)
  useEffect(() => {
    if (geoRef.current) {
      geoRef.current.setStyle((feature) => style(feature));
    }
  }, [style]);

  return (
    <MapContainer
      center={[-38.5, -64]}
      zoom={4}
      minZoom={3}
      maxZoom={12}
      className="w-full h-full"
      zoomControl={true}
      attributionControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
      />

      <CreatePanes />

      {geoData && (
        <GeoJSON
          key={choroplethMode}
          ref={geoRef}
          data={geoData}
          style={style}
          onEachFeature={onEachFeature}
          pane="provincesPane"
        />
      )}

      <EnergyLayers activeLayers={energyLayers} />
      <MiningMarkers visible={overlays.mining} />
      <FitBounds geoData={geoData} />
      <FlyToProvince geoData={geoData} selectedProvince={selectedProvince} />
    </MapContainer>
  );
}
