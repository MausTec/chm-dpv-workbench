import React, { useState } from 'react';
import { IPOSData } from './POSFileLoader';
import { IGerberData } from './GerberFileLoader';

export interface IPCBViewProps {
  posData: IPOSData[],
  gerberData: IGerberData[],
  onPartClick: (designator: string | null) => void,
  selectedPart: string | null,
}

const PCBView: React.FC<IPCBViewProps> = ({
  posData, gerberData, onPartClick, selectedPart,
}) => {
  const [scale, setScale] = useState<number>(2);
  const [pan, setPan] = useState<{ x: number, y: number }>({ x: 0, y: 0 });

  const maxX = posData.map((d) => d.pos_x).filter(Boolean).reduce((p, v) => (p > v ? p : v), 0);
  const maxY = posData.map((d) => d.pos_y).filter(Boolean).reduce((p, v) => (p > v ? p : v), 0);
  const outline = gerberData.filter((d) => d.filename.match(/\.gm1$/))[0];
  const pcbHeight = (outline && outline.height) || maxY;
  const pcbWidth = (outline && outline.width) || maxX;
  const offsetX = Math.abs((outline && outline.viewBox[0]) / 1000 || 0);
  const offsetY = Math.abs((outline && outline.viewBox[1]) / 1000 || 0) - 1;

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setScale(parseFloat(e.target.value));
  };

  const handleScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    const delta = e.deltaY / -200;
    setScale((s) => s + delta);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // eslint-disable-next-line no-bitwise
    if (e.buttons & 4) {
      setPan((p) => ({
        x: p.x + e.movementX,
        y: p.y + e.movementY,
      }));
    }
  };

  const handleFootprintClick = (designator: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onPartClick(designator === selectedPart ? null : designator);
  };

  const mm = (size: number, unit: 'in' | 'mm'): number => {
    if (unit === 'mm') return size;
    return size * 25.4;
  };

  return (
    <div className="pcb-view">
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div className="pcb-viewport" role="figure" onWheel={handleScroll} onMouseMove={handleMouseMove}>
        <div
          className="pcb-outline"
          style={{
            width: `${pcbWidth * scale}mm`,
            height: `${pcbHeight * scale}mm`,
            border: '1px solid black',
            position: 'absolute',
            margin: '30px auto',
            left: pan.x,
            top: pan.y,
            backgroundColor: '#003300',
          }}
        >
          { gerberData.map((data) => (
            <div
              dangerouslySetInnerHTML={{ __html: data.svg }}
              key={data.filename}
              className={data.filename.split('.').join(' ')}
              style={{
                position: 'absolute',
                bottom: `${(mm(data.viewBox[1] / 1000, data.units) + offsetY) * scale}mm`,
                left: `${(mm(data.viewBox[0] / 1000, data.units) + offsetX) * scale}mm`,
                transform: `scale(${scale * 100}%)`,
                transformOrigin: 'bottom left',
              }}
              data-gerber-filename={data.filename}
            />
          ))}
          { posData.filter((d) => d.reference).map((part) => (
            <button
              type="button"
              key={part.reference}
              className={`pcb-footprint ${part.reference === selectedPart ? ' active' : ''}`}
              onClick={handleFootprintClick(part.reference)}
              style={{
                left: `${(part.pos_x + offsetX) * scale}mm`,
                bottom: `${(part.pos_y + offsetY) * scale}mm`,
                transform: `translate(-50%, -50%) rotate(${360 - part.rotation}deg)`,
                transformOrigin: 'center',
                minWidth: `${2 * scale}mm`,
                minHeight: `${1.2 * scale}mm`,
                fontSize: 5 * scale,
                padding: 0,
                margin: 0,
              }}
            >
              <span style={{
                position: 'absolute', left: '50%', top: '50%', display: 'block', margin: 0, padding: 0, height: 'auto', transform: 'translate(-50%, -50%)',
              }}
              >
                { part.reference }
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="pcb-view-controls">
        <label htmlFor="scale">
          Zoom
          <input type="range" min={0.5} max={4.0} step={0.1} value={scale} name="scale" id="scale" onChange={handleZoomChange} />
        </label>
        <div style={{ float: 'right' }}>
          { posData.filter((p) => !!p.station).length }
          {' '}
          of
          {' '}
          { posData.length }
          {' '}
          associated.
        </div>
      </div>
    </div>
  );
};

export default PCBView;
