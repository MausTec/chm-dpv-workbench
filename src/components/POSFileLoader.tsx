import React, { ChangeEvent, useState } from 'react';
import { parse } from 'papaparse';

export interface IPOSData {
  reference: string;
  value: string;
  package: string;
  pos_x: number;
  pos_y: number;
  rotation: number;
  side: ('top' | 'bottom');
  station?: string | null;
  nozzle?: string | null;
}

interface ICSVInputData {
  Package: string;
  PosX: string;
  PosY: string;
  Ref: string;
  Side: ('top' | 'bottom');
  Val: string;
  Rot: string;
  Station?: string | null;
  Nozzle?: string | null;
}

interface IEasyEDAFormatData {
  Designator: string;
  Footprint: string;
  'Mid X': string;
  'Mid Y': string;
  'Ref X': string;
  'Ref Y': string;
  'Pad X': string;
  'Pad Y': string;
  Layer: ('T' | 'B');
  Rotation: string;
  Comment: string;
}

type TUnknownFileType = (IEasyEDAFormatData | ICSVInputData);

export interface IPOSFileLoaderProps {
  onLoad: (data: IPOSData[]) => void;
}

const isEasyEDAFormat = (data: TUnknownFileType): data is IEasyEDAFormatData => typeof (data as IEasyEDAFormatData)['Mid X'] !== 'undefined';

const POSFileLoader: React.FC<IPOSFileLoaderProps> = ({ onLoad }) => {
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (f) => {
        if (f.target) {
          const text = f.target.result;
          const data: IPOSData[] = [];

          if (text && typeof text === 'string') {
            const parsed = parse<TUnknownFileType>(text, {
              header: true,
            });

            parsed.data.forEach((line) => {
              if (isEasyEDAFormat(line)) {
                data.push({
                  reference: line.Designator,
                  value: line.Comment,
                  package: line.Footprint,
                  pos_x: parseFloat(line['Mid X']),
                  pos_y: parseFloat(line['Mid Y']),
                  side: line.Layer === 'T' ? 'top' : 'bottom',
                  rotation: parseFloat(line.Rotation),
                });
              } else if (line.Ref !== '') {
                data.push({
                  reference: line.Ref,
                  value: line.Val,
                  package: line.Package,
                  pos_x: parseFloat(line.PosX),
                  pos_y: parseFloat(line.PosY),
                  rotation: parseFloat(line.Rot),
                  side: line.Side,
                  station: line.Station,
                  nozzle: line.Nozzle,
                });
              }
            });
          } else {
            alert('Error parsing the CSV file?');
          }

          onLoad(data);
          console.log({ data });
        }
      };

      if (file) {
        reader.readAsText(file);
      }
      console.log(file);
    }
  };

  return (
    <div className="file-loader">
      <label htmlFor="pos-file-input">
        Load Position CSV
        <input id="pos-file-input" type="file" onChange={handleFileChange} accept="text/csv" />
      </label>
    </div>
  );
};

export default POSFileLoader;
