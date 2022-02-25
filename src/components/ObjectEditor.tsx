import React, { useEffect, useState } from 'react';
import './ObjectEditor.scss';

export type TKey<T> = keyof T & string;

export interface IObjectEditorProps<T> {
  title: string;
  obj: T;
  readOnlyFields?: (TKey<T>)[];
  idField: TKey<T>;
  hiddenFields?: (TKey<T>)[];
  enumFields?: { [key in TKey<T>]?: (T[key])[] };
  onChange: (id: string, obj: Partial<T>) => void | boolean;
}

export const humanize = <T, >(name: TKey<T>) : string => (
  name.split(/[_-]/g).map((s) => s[0].toUpperCase() + s.substring(1)).join(' ')
);

const ObjectEditor = <T, >({
  title, obj, onChange, readOnlyFields, idField, hiddenFields, enumFields
}: React.PropsWithChildren<IObjectEditorProps<T>>) => {
  const [dirty, setDirty] = useState<boolean>(false);
  const [dirtyObj, setDirtyObj] = useState<T>(obj);
  const keys = Object.keys(obj) as (TKey<T>)[];

  useEffect(() => {
    setDirty(false);
    setDirtyObj(obj);
  }, [obj]);

  const handleChange = (key: TKey<T>) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setDirty(true);
    setDirtyObj((o) => ({
      ...o,
      [key]: (typeof o[key] === 'number') ? parseFloat(e.target.value) : e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onChange(((obj[idField] as unknown) as string), dirtyObj)) {
      setDirty(false);
    }
  };

  const asVal = (val: T[TKey<T>]) : string | number => {
    let value = (val as unknown) as string | number | null | undefined;
    if (value === null || typeof value === 'undefined') { value = ''; }
    return value;
  };

  return (
    <form className="object-editor" onSubmit={handleSubmit}>
      <div className="oe-header">
        <div className="oe-title">
          { title }
          { dirty ? '*' : '' }
        </div>
        <button type="submit">Save</button>
      </div>
      <div className="oe-table">
        { keys.map((key) => {
          if (hiddenFields && hiddenFields.indexOf(key) >= 0) return null;
          const value = asVal(dirtyObj[key]);

          const readOnly = readOnlyFields && readOnlyFields.indexOf(key) >= 0;
          const fieldEnums = enumFields && enumFields[key];

          if (fieldEnums) {
            return (
              <div className="oe-kvp" key={key}>
                <div className="oe-key">{humanize(key)}</div>
                <div className="select-wrapper">
                  <select className="oe-value" value={value.toString()} onChange={handleChange(key)}>
                    { fieldEnums.map(asVal).map((e) => <option key={e} value={e}>{e}</option>) }
                  </select>
                </div>
              </div>
            );
          }

          const isNumber = typeof value === 'number';

          return (
            <div className="oe-kvp" key={key}>
              <div className="oe-key">{humanize(key)}</div>
              <input
                className="oe-value"
                type={isNumber ? 'number' : 'text'}
                value={value.toString()}
                onChange={handleChange(key)}
                readOnly={readOnly}
              />
            </div>
          );
        })}
      </div>
    </form>
  );
};

export default ObjectEditor;
