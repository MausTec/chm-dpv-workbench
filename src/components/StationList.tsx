import React from 'react';
import { IStationData } from './StationFileLoader';
import './BOMList.scss';

export interface IStationListProps {
  stationData: IStationData[];
  onStationSelect: (station: string) => void;
  selectedStation: string | null;
}

const StationList: React.FC<IStationListProps> = ({
  stationData,
  onStationSelect,
  selectedStation,
}) => {
  const handleStationClick = (station: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    onStationSelect(station);
  };

  const sorted = stationData.sort((a, b) => parseInt(a.ID, 10) - parseInt(b.ID, 10));

  return (
    <ul className="bom-list">
      { sorted.map((station) => (
        <li key={station.ID} className={station.ID === selectedStation ? 'active' : ''}>
          <button type="button" onClick={handleStationClick(station.ID)}>
            <div className="reference">{station.ID}</div>
            <div className="details">
              <div>{station.Note}</div>
              <div>
                S:
                {station.Status}
                , R:
                {station.FeedRates}
                , H:
                {station.HeightTake}
                , N:
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
};

export default StationList;
