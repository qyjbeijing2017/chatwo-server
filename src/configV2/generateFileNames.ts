/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { writeFileSync } from 'fs';
import { join } from 'path';
import { getMetadata, hasMetadata } from '../utils/meta-data';
import { ConfigManager } from './manager';

function generateFileNames() {
  const manager = new ConfigManager({});
  const fileNames = new Set<string>();

  for (const propertyKey of Object.keys(manager)) {
    if (hasMetadata('configManager:filePath', ConfigManager, propertyKey)) {
      const paths = getMetadata(
        'configManager:filePath',
        ConfigManager,
        propertyKey,
      ) as string[];
      for (const path of paths) {
        fileNames.add(path);
      }
    }
  }

  // 生成 filesName.ts
  const fileNamesArray = Array.from(fileNames).sort();
  const fileNamesText = `// This file is auto-generated. Do not edit manually.
export type ChatwoConfigFileName = ${fileNamesArray.map(name => `"${name}"`).join(' | ')} | "unknown";
`;
  const fileNamesPath = join(__dirname, 'filesName.ts');
  writeFileSync(fileNamesPath, fileNamesText, 'utf-8');
  console.log(`Generated filesName.ts with ${fileNamesArray.length} file names`);
}

generateFileNames();
