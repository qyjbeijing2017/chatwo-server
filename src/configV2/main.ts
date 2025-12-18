/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ConfigManager, ConfigManagerData } from './manager';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parseCsv } from '../utils/csvReader';
import { ConfigTable } from './table';
import { getMetadata, hasMetadata } from '../utils/meta-data';

function main() {
  const manager = new ConfigManager({});
  const data = {} as ConfigManagerData;
  
  for (const propertyKey of Object.keys(manager)) {
    if (hasMetadata('configManager:filePath', ConfigManager, propertyKey)) {
      const paths = getMetadata(
        'configManager:filePath',
        ConfigManager,
        propertyKey,
      ) as string[];
      const list: ConfigTable[] = [];
      for (const path of paths) {
        if (!existsSync(join(__dirname, path))) {
          throw new Error(`Config file not found: ${path}`);
        }
        const text = readFileSync(join(__dirname, path), 'utf-8');
        const array = parseCsv(text);

        const title = array.shift();
        const ConfigType = getMetadata(
          'configManager:parseType',
          ConfigManager,
          propertyKey,
        ) as new () => ConfigTable;
        for (const line of array) {
          if (line[0].startsWith('#')) {
            continue; // 跳过注释行
          }
          const instance = new ConfigType();
          instance.fromFile = path;
          for (const key in instance) {
            if(key === 'fromFile') {
              continue;
            }
            const name = getMetadata('configTable:name', ConfigType, key) || key;
            const index = title?.findIndex((t) => {
              const [id] = t.split('?').map((s) => s.trim());
              return id === name;
            });
            if (index === -1) {
              throw new Error(`Config column not found: ${name} in file ${path}`);
            }
            const transformer =
              getMetadata('configTable:transformer', ConfigType, key) ||
              ((val: string) => val);

            instance[key] = transformer(line[index!])
          }
          list.push(instance);
        }
      }
      data[propertyKey] = list;
    }
  }

  const configText = `// This file is auto-generated. Do not edit manually.
import { ConfigManager } from "./manager";
export const configManager = new ConfigManager(${JSON.stringify(data, null, 4)});
`;

  const outPath = join(__dirname, 'config.ts');
  writeFileSync(outPath, configText, 'utf-8');
  console.log('Generated config.ts');
}
main();
