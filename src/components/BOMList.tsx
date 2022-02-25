import React, { useEffect, useRef } from 'react';
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
  const ulRef = useRef<HTMLUListElement>(null);
  const selectedPartRef = useRef<HTMLLIElement>(null);

  const handlePartClick = (reference: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    onPartSelect(reference);
  };

  useEffect(() => {
    if (ulRef.current) {
      let top = selectedPartRef.current ? selectedPartRef.current.offsetTop : null;
      if (top !== null) {
        top -= ulRef.current.clientHeight / 2;
        ulRef.current.scrollTo({ top, behavior: 'smooth' });
      }
    }
  }, [selectedPart, selectedPartRef]);

  return (
    <ul className="bom-list" ref={ulRef}>
      {posData.map((part) => (
        <li
          key={part.reference}
          className={part.reference === selectedPart ? ' active' : ''}
          ref={part.reference === selectedPart ? selectedPartRef : null}
        >
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
