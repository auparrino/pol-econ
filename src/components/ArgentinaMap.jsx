import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, GeoJSON, CircleMarker, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { miningProjects } from '../data/miningProjects';
import EnergyLayers from './EnergyLayers';
import { INDICATOR_BY_ID, colorFor } from '../lib/indicators';
import { provinceKey } from '../lib/provinces';

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
  'oposición': '#C0392B',
  'oposición dura': '#7B1E14',
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
  'default':    '#4F86B5',
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

function getRegionColor(governor) {
  return REGION_COLORS[governor?.region] || '#4F86B5';
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
        map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 6, duration: 0.8 });
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
      case 'none': return '#E9E5DB';
      case 'partido': return getPartyColor(gov);
      case 'alineamiento': return getAlignmentColor(gov);
      case 'region': return getRegionColor(gov);
      default: {
        const ind = INDICATOR_BY_ID[choroplethMode];
        return ind ? colorFor(ind, ind.values[provinceKey(provinceName)]) : '#4F86B5';
      }
    }
  }, [governors, choroplethMode]);

  const style = useCallback((feature) => {
    const name = feature.properties.NAME_1;
    const isSelected = selectedProvince?.toLowerCase() === name?.toLowerCase();
    const fillColor = getColor(name);

    return {
      fillColor,
      weight: isSelected ? 2.5 : 0.9,
      opacity: 1,
      color: isSelected ? '#14213D' : '#FFFFFF',
      fillOpacity: selectedProvince && !isSelected ? 0.55 : 0.92,
    };
  }, [getColor, selectedProvince]);

  // Store the latest callback in a ref so GeoJSON event handlers always call current version
  const onProvinceSelectRef = useRef(onProvinceSelect);
  const modeRef = useRef(choroplethMode);
  useEffect(() => {
    onProvinceSelectRef.current = onProvinceSelect;
    modeRef.current = choroplethMode;
  }, [onProvinceSelect, choroplethMode]);

  const onEachFeature = useCallback((feature, layer) => {
    const name = feature.properties.NAME_1;

    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({
          weight: 2,
          color: '#14213D',
          fillOpacity: 1,
        });
        l.bringToFront();
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

    layer.bindTooltip(() => {
      const ind = INDICATOR_BY_ID[modeRef.current];
      const v = ind?.values[provinceKey(name)];
      if (!ind) return name;
      return `<strong>${name}</strong><br/><span style="opacity:.75">${ind.label}:</span> ${v != null ? ind.fmt(v) : 's/d'}`;
    }, {
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
      zoomControl={false}
      attributionControl={false}
      zoomSnap={0.25}
    >
      <ZoomControl position="bottomright" />
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
