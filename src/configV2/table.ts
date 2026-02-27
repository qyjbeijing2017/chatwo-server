/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import YAML from 'yaml';
import { defineMetadata } from '../utils/meta-data';
import { ChatwoConfigFileName } from './filesName';

export function ConfigName(name: string) {
  return function (target: ConfigTable, propertyKey: string) {
    const classConstructor = target.constructor;
    defineMetadata('configTable:name', name, classConstructor, propertyKey);
  };
}

export function ConfigKey() {
  return function (target: ConfigTable, propertyKey: string) {
    const classConstructor = target.constructor;
    defineMetadata('configTable:key', propertyKey, classConstructor);
  };
}

export function ConfigTransform(transformer: (val: string) => any) {
  return function (target: ConfigTable, propertyKey: string) {
    const classConstructor = target.constructor;
    defineMetadata(
      'configTable:transformer',
      transformer,
      classConstructor,
      propertyKey,
    );
  };
}

export function ConfigFloat() {
  return ConfigTransform((val: string) => parseFloat(val));
}

export function ConfigInt() {
  return ConfigTransform((val: string) => parseInt(val, 10));
}

export function ConfigBool() {
  return ConfigTransform((val: string) => {
    return val.toLowerCase() === 'true' || val === '1';
  });
}

export function ConfigEnum(enumObj: { [key: string]: any }) {
  return ConfigTransform((val: string) => {
    return enumObj[val];
  });
}

export function ConfigFlagEnum(enumObj: { [key: string]: any }) {
  return ConfigTransform((val: string) => {
    const parts = val.split(',').map((part) => part.trim());
    let result = 0;
    for (const part of parts) {
      if (enumObj[part] !== undefined) {
        result |= enumObj[part];
      }
    }
    return result;
  });
}

export function ConfigYaml() {
  return ConfigTransform((val: string) => {
    return YAML.parse(val);
  });
}

export abstract class ConfigTable {
  fromFile: ChatwoConfigFileName;
  [key: string]: any;
}
