import React, { useState } from 'react';
import './App.css';
import POSFileLoader, { IPOSData } from './components/POSFileLoader';
import GerberFileLoader, { IGerberData } from './components/GerberFileLoader';
import PCBView from './components/PCBView';
import BOMList from './components/BOMList';

const App: React.FC = () => {
  const [posData, setPosData] = useState<IPOSData[]>([]);
  const [gerberData, setGerberData] = useState<IGerberData[]>([]);
  const [selectedPart, selectPart] = useState<string | null>(null);

  return (
    <div className="App">
      <div className="left">
        <div className="files">
          <POSFileLoader onLoad={setPosData} />
          <GerberFileLoader onLoad={setGerberData} />
        </div>
        <div className="bom-list">
          <BOMList posData={posData} selectedPart={selectedPart} />
        </div>
      </div>
      <main>
        <PCBView
          posData={posData}
          gerberData={gerberData}
          onPartClick={selectPart}
          selectedPart={selectedPart}
        />
      </main>
    </div>
  );
};

export default App;
