export type TPartName = 'resistor' | 'capacitor' | 'fuse' | 'other';

export interface IRefInfo {
  type: TPartName;
  value?: number;
  name?: string;
}

export const getRefInfo = (ref: string | null) : IRefInfo => {
  if (!ref) return { type: 'other' };

  // This is wrong but sometimes I write k instead of K.
  const m = ref.toLowerCase().match(/^((?:\d+\.)?\d+)([uknmgrp])?([foa])?$/i);
  if (m) {
    let value = parseFloat(m[1]);
    let magnitude = m[2];
    let unit = m[3];
    let type: TPartName = 'other';

    if (!magnitude) {
      magnitude = 'r';
    }

    if (!unit) {
      unit = ['u', 'n', 'p'].indexOf(magnitude) >= 0 ? 'f' : 'o';
    }

    switch (unit) {
      case 'o':
        type = 'resistor';
        break;
      case 'a':
        type = 'fuse';
        break;
      case 'f':
        type = 'capacitor';
        break;
      default:
      // this is trivial
    }

    switch (magnitude) {
      case 'm':
        value *= 1000000;
        break;
      case 'k':
        value *= 1000;
        break;
      case 'u':
        value /= 1000;
        break;
      case 'n':
        value /= 1000000;
        break;
      case 'p':
        value /= 1000000000;
        break;
      default:
      // this is trivial
    }

    if (type === 'capacitor') {
      // capacitor markings are often in picofarads, actually
      value *= 1000000000;
    }

    return {
      type,
      value,
    };
  }
  return {
    type: 'other',
    name: ref,
  };
};
