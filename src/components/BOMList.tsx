import React from 'react';
import { IPOSData } from './POSFileLoader';
import './BOMList.scss';

interface IBOMListProps {
  posData: IPOSData[];
  selectedPart: string | null;
}

const BOMList: React.FC<IBOMListProps> = ({ posData, selectedPart }) => (
  <ul className="bom-list">
    {posData.map((part) => (
      <li key={part.reference} className={part.reference === selectedPart ? ' active' : ''}>
        <div className="reference">{part.reference}</div>
        <div className="details">
          <div>{part.value}</div>
          <div>{part.package}</div>
        </div>
      </li>
    ))}
  </ul>
);

export default BOMList;
