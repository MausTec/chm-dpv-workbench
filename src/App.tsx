import React, { useEffect, useState } from 'react';
import './App.scss';
import POSFileLoader, { IPOSData } from './components/POSFileLoader';
import GerberFileLoader, { IGerberData } from './components/GerberFileLoader';
import PCBView from './components/PCBView';
import BOMList from './components/BOMList';
import StationFileLoader, {
  IStationData,
} from './components/StationFileLoader';
import StationList from './components/StationList';
import { getRefInfo } from './util/getRefInfo';
import { generate } from './util/DPV';
import ObjectEditor from './components/ObjectEditor';

// TODO: These are all hardcoded for my personal workflow, but the station CSV should
//       support aliases, as well as some section for auto-ignoring fields.

const STATION_ALIASES: { [key: string]: string[] } = {
  '2N3904': ['MMBT3904'],
  DMG2302: ['Q_NMOS_GSD', 'Q_NMOS_GDS'],
  '15K': ['10K'],
  '750R': ['1K'],
  '120R': ['100R'],
  '300R': ['270R'],
  'FT231XS-R': ['FT231XS'],
};

const AUTO_IGNORE = [
  'USB_B',
  '500MA',
  'TX',
  'RX',
  'PWR',
  'ON',
  'RESET',
  'BOOT',
  'AT24CS01-STUM',
  'ESP32-WROOM-32D',
];

const App: React.FC = () => {
  const [posData, setPosData] = useState<IPOSData[]>([]);
  const [gerberData, setGerberData] = useState<IGerberData[]>([]);
  const [stationData, setStationData] = useState<IStationData[]>([]);
  const [selectedPart, selectPart] = useState<string | null>(null);
  const [selectedStation, selectStation] = useState<string | null>(null);
  const [filterUnassignedFootprints, setFilterUnassignedFootprints] = useState<boolean>(false);
  const [filterPartSide, setFilterPartSide] = useState<'top' | 'bottom' | 'all'>('top');

  const getPart = (reference: string | null | undefined): IPOSData | undefined => (
    posData.find((p) => p.reference === reference)
  );

  const getStation = (id: string | null | undefined): IStationData | undefined => (
    stationData.find((s) => s.ID === id)
  );

  let selectedPartData: IPOSData | undefined;
  if (selectedPart) {
    selectedPartData = getPart(selectedPart);
  }

  let selectedStationData: IStationData | undefined;
  if (selectedStation) {
    selectedStationData = getStation(selectedStation);
  }

  type TUpdater<T> = Partial<T> | ((data: T) => Partial<T>);
  type TUpdatePartChanges = TUpdater<IPOSData>;

  const updatePart = (reference: string, updater: TUpdatePartChanges) => {
    const parts = [...posData];
    const part = getPart(reference);
    let changes = updater;
    if (!part) return;

    if (typeof changes === 'function') {
      changes = changes(part);
    }

    parts.forEach((p) => {
      if (p.reference === part.reference) {
        Object.assign(p, changes);
      }
    });
    setPosData(parts);
  };

  type TUpdateStationChanges = TUpdater<IStationData>;

  const updateStation = (id: string, updater: TUpdateStationChanges) => {
    const stations = [...stationData];
    const station = getStation(id);
    let changes = updater;
    if (!station) return;

    if (typeof changes === 'function') {
      changes = changes(station);
    }

    stations.forEach((s) => {
      if (s.ID === station.ID) {
        Object.assign(s, changes);
      }
    });
    setStationData(stations);
  };

  useEffect(() => {
    if (selectedPartData) {
      selectStation(selectedPartData.station || null);
    }
  }, [selectedPartData]);

  let bomListEntries = posData.filter((b) => b.reference);

  if (filterUnassignedFootprints) {
    bomListEntries = bomListEntries.filter((b) => !b.station || b.station === '0');
  }

  if (filterPartSide !== 'all') {
    bomListEntries = bomListEntries.filter((b) => b.side === filterPartSide);
  }

  const selectNextPart = () => {
    if (selectedPart) {
      const idx = bomListEntries.findIndex((b) => b.reference === selectedPart);
      selectPart(bomListEntries[idx + 1]?.reference || null);
    } else {
      selectPart(bomListEntries[0]?.reference || null);
    }
  };

  const handleManualAssociation = (e: React.MouseEvent) => {
    e.preventDefault();
    if (selectedPart && selectedStation) {
      updatePart(selectedPart, (part) => ({
        station: selectedStation === part.station ? null : selectedStation,
      }));
      selectNextPart();
    }
  };

  const handlePartIgnore = (e: React.MouseEvent) => {
    e.preventDefault();
    if (selectedPart) {
      updatePart(selectedPart, { station: '-' });
      selectNextPart();
    }
  };

  const handleAutoAssociate = (e: React.MouseEvent) => {
    e.preventDefault();

    const findBestStation = (v: string): string | null => {
      let value = v.toUpperCase();
      if (AUTO_IGNORE.indexOf(value) >= 0) {
        return '-';
      }

      Object.entries(STATION_ALIASES).forEach(([realName, aliases]) => {
        if (aliases.indexOf(value) >= 0) value = realName;
      });

      const partInfo = getRefInfo(value);
      const partName = partInfo.name?.toUpperCase();

      if (partName && AUTO_IGNORE.indexOf(partName) >= 0) {
        return '-';
      }

      const results = stationData.filter((s) => {
        const stationInfo = getRefInfo(s.Note);
        if (partInfo.type === stationInfo.type) {
          if (partInfo.value) {
            return partInfo.value === stationInfo.value;
          }
          if (partName) {
            const stationName = stationInfo.name?.toUpperCase();
            return partName === stationName;
          }
          return false;
        }
        return false;
      });
      return results[0]?.ID || null;
    };

    posData.forEach((part) => {
      const station = findBestStation(part.value);
      const sData = getStation(station);

      updatePart(part.reference, {
        station,
        nozzle: sData?.Nozzle,
      });
    });
  };

  const handleExportPosClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    const dpgText = generate(stationData, posData);
    const el = window.document.createElement('a');
    el.href = `data:application/octet-stream,${encodeURIComponent(dpgText)}`;
    el.download = 'export.dpv';
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
  };

  const handleFilterBom = (e: React.MouseEvent) => {
    e.preventDefault();
    setFilterUnassignedFootprints((b) => !b);
  };

  const handlePartChange = (id: string, part: Partial<IPOSData>) => {
    updatePart(id, part);
    return true;
  };

  const handleStationChange = (id: string, station: Partial<IStationData>) => {
    updateStation(id, station);
    return true;
  };

  return (
    <div className="App">
      <div className="left">
        <POSFileLoader onLoad={setPosData} />
        <BOMList
          posData={bomListEntries}
          selectedPart={selectedPart}
          onPartSelect={selectPart}
        />
        {selectedPartData && (
          <ObjectEditor
            title={`Edit Part ${selectedPart}`}
            obj={selectedPartData}
            hiddenFields={['station', 'reference']}
            enumFields={{ side: ['top', 'bottom'], nozzle: ['1', '2'] }}
            idField="reference"
            onChange={handlePartChange}
          />
        )}
        <div className="controls">
          <button type="button" onClick={handleAutoAssociate}>
            Auto-Associate
          </button>
          <button type="button" onClick={handleFilterBom}>
            Show
            {' '}
            {filterUnassignedFootprints ? 'All' : 'Unassigned'}
          </button>
        </div>
        <div className="controls">
          <button type="button" onClick={handleExportPosClick}>
            Export with Associations
          </button>
        </div>
      </div>
      <main>
        <GerberFileLoader onLoad={setGerberData} />
        <PCBView
          posData={posData}
          gerberData={gerberData}
          onPartClick={selectPart}
          selectedPart={selectedPart}
        />
      </main>
      <div className="left">
        <StationFileLoader onLoad={setStationData} />
        <StationList
          stationData={stationData}
          partsData={posData}
          onStationSelect={selectStation}
          selectedStation={selectedStation}
        />
        {selectedStationData && (
          <ObjectEditor
            title={`Edit Station ${selectedStation}`}
            obj={selectedStationData}
            hiddenFields={['ID']}
            enumFields={{ Nozzle: ['1', '2'] }}
            idField="ID"
            onChange={handleStationChange}
          />
        )}
        <div className="controls">
          {selectedPartData && selectedStation && (
            <button type="button" onClick={handleManualAssociation}>
              {selectedStation === selectedPartData.station
                ? `Dissociate ${selectedPart}`
                : `Use ${selectedStation} for ${selectedPart}`}
            </button>
          )}
          {selectedPart && !selectedStation && (
            <button type="button" onClick={handlePartIgnore}>
              Ignore
              {' '}
              {selectedPart}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
