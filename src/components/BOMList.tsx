import React from 'react';
import { IPOSData } from './POSFileLoader';
import './BOMList.scss';

interface IBOMListProps {
  posData: IPOSData[];
  selectedPart: string | null;
  onPartSelect: (reference: string) => void;
}

const BOMList: React.FC<IBOMListProps> = ({
  posData, selectedPart, onPartSelect,
}) => {
  const handlePartClick = (reference: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    onPartSelect(reference);
  };

  return (
    <ul className="bom-list">
      {posData.map((part) => (
        <li key={part.reference} className={part.reference === selectedPart ? ' active' : ''}>
          <button type="button" onClick={handlePartClick(part.reference)}>
            <div className="reference">{part.reference}</div>
            <div className="details">
              <div>{part.value}</div>
              <div>{part.package}</div>
            </div>
            <div className="reference">
              {part.station}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
};

export default BOMList;
