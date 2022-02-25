import * as Papa from 'papaparse';
import { IStationData } from '../components/StationFileLoader';
import { IPOSData } from '../components/POSFileLoader';

export interface IStationTableEntry {
  ID: string;
  DeltX: string;
  DeltY: string;
  FeedRates: string;
  Note: string;
  Height: string;
  Speed: string;
  Status: string;
  SizeX: string;
  SizeY: string;
  HeightTake: string;
  DelayTake: string;
  Rotation: string;
}

export function parse() {}

export function buildTable<T>(name: string, data: T[]) {
  if (!data[0]) return '';

  const headers = ['Table', 'No.', ...Object.keys(data[0])];
  const rows = data.filter(Boolean).map((row, i) => ({
    Table: name,
    'No.': i,
    ...row,
  }));

  return Papa.unparse(rows, {
    skipEmptyLines: true,
    columns: headers,
    header: true,
    newline: '\n',
  });
}

export function generateStationTable(stationData: IStationData[]) {
  return buildTable<IStationTableEntry>('Station', stationData.map((station) => ({
    ID: station.ID,
    DeltX: station.DeltX.toString(),
    DeltY: station.DeltY.toString(),
    FeedRates: station.FeedRates.toString(),
    Note: station.Note,
    Height: station.Height.toString(),
    Speed: station.Speed.toString(),
    Status: station.Status.toString(),
    SizeX: station.SizeX.toString(),
    SizeY: station.SizeY.toString(),
    HeightTake: station.HeightTake.toString(),
    DelayTake: station.DelayTake.toString(),
    Rotation: station.Rotation.toString(),
  })));
}

export function generateComponentsTable(
  partData: IPOSData[],
  stationData: IStationData[],
) {
  const rotate = (deg: number, adjust: number) => {
    // This is really because I can't *actually* trust my input data right now:
    console.assert(typeof deg === 'number' && typeof adjust === 'number');

    let rot = deg + adjust;
    rot -= 90; // I don't remember why but we start 90 degress off
    rot %= 360; // Limit to a circle
    if (rot > 180) rot -= 360; // CHM rotates left or right from center by 180deg
    return Math.round(rot * 100) / 100;
  };

  const componentData = partData.map((part, i) => {
    const station = stationData.find((s) => s.ID === part.station);
    if (!station) return null;

    return ({
      ID: i + 1,
      PHead: part.nozzle || 1,
      'STNo.': part.station,
      DeltX: part.pos_x.toString(10),
      DeltY: part.pos_y.toString(10),
      Angle: rotate(part.rotation, station.Rotation),
      Height: station.Height,
      Skip: 4, // 4 = no, 5 = skip
      Speed: station.Speed,
      Explain: part.reference,
      Note: part.value,
      Delay: station.DelayTake,
    });
  });

  return buildTable('EComponent', componentData);
}

export interface IPanelArray {
  countX: number, countY: number, intervalX: number, intervalY: number
}

export function generatePanelTable(panels: IPanelArray[]) {
  return buildTable('Panel_Array', panels.map((panel, i) => ({
    ID: i + 1,
    IntervalX: panel.intervalX,
    IntervalY: panel.intervalY,
    NumX: panel.countX,
    NumY: panel.countY,
  })));
}

export interface ICalibPoint {
  offsetX: number,
  offsetY: number,
  note?: string | null,
}

export function generateCalibPointTable(points: ICalibPoint[]) {
  return buildTable('CalibPoint', points.map((point, i) => ({
    ID: i + 1,
    offsetX: point.offsetX,
    offsetY: point.offsetY,
    Note: point.note,
  })));
}

export interface ICalibFator {
  deltaX: number,
  deltaY: number,
  alphaX: number,
  alphaY: number,
  betaX: number,
  betaY: number,
  deltaAngle: number;
}

export function generateCalibFatorTable(points: ICalibFator[]) {
  return buildTable('CalibFator', points.map((point, i) => ({
    DeltX: point.deltaX,
    DeltY: point.deltaY,
    AlphaX: point.alphaX,
    AlphaY: point.alphaY,
    BetaX: point.betaX,
    BetaY: point.betaY,
    DeltaAngle: point.deltaAngle,
  })));
}

export function generateHeader(filename: string, pcbFile: string, panelType: number) {
  const date = new Date();

  return `
separated
FILE,${filename}
PCBFILE,${pcbFile}
DATE,${date.getFullYear()}/${date.getMonth()}/${date.getDate()}
TIME,${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}
PANELTYPE,${panelType}`;
}

export function generate(
  stationData: IStationData[],
  partData: IPOSData[],
) {
  const stations = generateStationTable(stationData);
  const components = generateComponentsTable(partData, stationData);

  const panels = generatePanelTable([{
    countX: 1,
    countY: 1,
    intervalX: 0,
    intervalY: 0,
  }]);

  const calibPoints = generateCalibPointTable([{
    offsetY: 0,
    offsetX: 0,
    note: 'Origin',
  }]);

  const calibFator = generateCalibFatorTable([{
    deltaX: 0,
    deltaY: 0,
    alphaX: 0,
    alphaY: 0,
    betaX: 1,
    betaY: 1,
    deltaAngle: 0,
  }]);

  const header = generateHeader('js.dpv', 'jsDpvTest', 1);

  const output = [
    header,
    stations,
    components,
    panels,
    calibPoints,
    calibFator,
  ].join('\n\n');

  return output;
}
