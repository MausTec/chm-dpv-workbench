import React, { ChangeEvent, useState } from 'react';
import { parse } from 'papaparse';

export interface IStationData {
  DelayTake: number;
  DeltX: number;
  DeltY: number;
  FeedRates: number;
  Height: number;
  HeightTake: number;
  ID: string;
  Note: string;
  SizeX: string;
  SizeY: string;
  Speed: string;
  Status: string;
  Rotation: number;
  Nozzle: string | null;
}

export interface IStationInputData {
  DelayTake: string;
  DeltX: string;
  DeltY: string;
  FeedRates: string;
  Height: string;
  HeightTake: string;
  ID: string;
  Note: string;
  SizeX: string;
  SizeY: string;
  Speed: string;
  Status: string;
  Rotation: string;
  Nozzle?: string | null;
}

export interface IStationFileLoaderProps {
  onLoad: (data: IStationData[]) => void;
}

const StationFileLoader: React.FC<IStationFileLoaderProps> = ({ onLoad }) => {
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (f) => {
        if (f.target) {
          const text = f.target.result;
          let data: IStationData[] = [];

          if (text && typeof text === 'string') {
            if (file.type === 'application/json') {
              data = JSON.parse(text);
            } else if (file.type === 'text/csv' || file.type === 'application/vnd.ms-excel') {
              const parsed = parse<IStationInputData>(text, {
                header: true,
              });
              data = parsed.data.map((d) => ({
                Nozzle: '1',
                DelayTake: parseFloat(d.DelayTake),
                DeltX: parseFloat(d.DeltX),
                DeltY: parseFloat(d.DeltY),
                FeedRates: parseFloat(d.FeedRates),
                Height: parseFloat(d.Height),
                HeightTake: parseFloat(d.HeightTake),
                ID: d.ID,
                Note: d.Note,
                SizeX: d.SizeX,
                SizeY: d.SizeY,
                Speed: d.Speed,
                Status: d.Status,
                Rotation: parseFloat(d.Rotation),
              }));
            } else {
              throw Error(`Invalid file type, got: ${file.type}`);
            }

            onLoad(data.filter((d) => d.ID !== ''));
            console.log({ data });
          }
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
      <label htmlFor="station-file-input">
        Load Station File
        <input id="station-file-input" type="file" onChange={handleFileChange} accept="text/csv, application/json" />
      </label>
    </div>
  );
};

export default StationFileLoader;
