import React, { ChangeEvent, useState } from 'react';
import * as Zip from '@zip.js/zip.js';
import gerberToSvg from 'gerber-to-svg';

export interface IGerberData {
  filename: string;
  svg: string;
  viewBox: number[];
  width: number;
  height: number;
  units: 'in' | 'mm';
}

export interface IGerberFileLoaderProps {
  onLoad: (data: IGerberData[]) => void;
}

const GerberFileLoader: React.FC<IGerberFileLoaderProps> = ({ onLoad }) => {
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      console.log('Loading gerber file: ', file);

      if (file) {
        const reader = new Zip.BlobReader(file);
        const zip = new Zip.ZipReader(reader);
        const out: IGerberData[] = [];

        const entries = await zip.getEntries();
        const promises = entries.map(async (f) => {
          if (f.getData && f.filename.match(/(gbr|g[tb].|gm1|drl|gko)$/i)) {
            const writer = new Zip.Uint8ArrayWriter();
            const data = await f.getData(writer);

            const converter = gerberToSvg(data, {
              backupUnits: 'in',
            });

            const internal = new Promise((resolve, reject) => {
              converter.on('error', (error) => reject(error));
              converter.on('warning', (error) => console.warn(f.filename, error));
              converter.on('data', (d) => {
                const gerb: IGerberData = {
                  filename: f.filename.toLowerCase(),
                  svg: d,
                  viewBox: converter.viewBox,
                  width: converter.width,
                  height: converter.height,
                  units: converter.units,
                };

                out.push(gerb);
                resolve(gerb);
              });
            });

            return internal;
          }
          return null;
        });

        Promise.allSettled(promises)
          .then(() => {
            onLoad(out);
            return null;
          })
          .finally(() => {
            e.target.value = '';
          })
          .catch(console.error);
      }
    }
  };

  return (
    <div className="file-loader">
      <label htmlFor="gerber-file-input">
        Load Gerber
        <input id="gerber-file-input" type="file" onChange={handleFileChange} accept="application/zip" />
      </label>
    </div>
  );
};

export default GerberFileLoader;
