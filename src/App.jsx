import { useState } from 'react';
import Header from './components/Header';
import LayerPanel from './components/LayerPanel';
import ArgentinaMap from './components/ArgentinaMap';
import ProvincePanel from './components/ProvincePanel';
import BottomBar from './components/BottomBar';
import Legend from './components/Legend';
import { governors } from './data/governors';
import useCongressData from './hooks/useCongressData';

export default function App() {
  const [choroplethMode, setChoroplethMode] = useState('partido');
  const [overlays, setOverlays] = useState({ mining: false });
  const [energyLayers, setEnergyLayers] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [bottomBarH, setBottomBarH] = useState(155);
  const { congress } = useCongressData();

  const panelWidth = selectedProvince ? 320 : 280;

  return (
    <div className="h-screen w-screen overflow-hidden bg-cream">
      <Header />

      <LayerPanel
        choroplethMode={choroplethMode}
        setChoroplethMode={setChoroplethMode}
        overlays={overlays}
        setOverlays={setOverlays}
        energyLayers={energyLayers}
        setEnergyLayers={setEnergyLayers}
      />

      <div
        className="fixed top-[64px] left-[200px] transition-all duration-300"
        style={{ right: panelWidth, bottom: bottomBarH }}
      >
        <ArgentinaMap
          governors={governors}
          choroplethMode={choroplethMode}
          overlays={overlays}
          energyLayers={energyLayers}
          selectedProvince={selectedProvince}
          onProvinceSelect={setSelectedProvince}
        />
        <Legend choroplethMode={choroplethMode} showMining={overlays.mining} />
      </div>

      <ProvincePanel
        province={selectedProvince}
        governors={governors}
        congress={congress}
        onClose={() => setSelectedProvince(null)}
        width={panelWidth}
      />

      <BottomBar
        panelWidth={panelWidth}
        congress={congress}
        overlays={overlays}
        energyLayers={energyLayers}
        selectedProvince={selectedProvince}
        governors={governors}
        onHeightChange={setBottomBarH}
      />
    </div>
  );
}
