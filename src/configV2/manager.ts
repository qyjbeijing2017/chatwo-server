/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { defineMetadata } from '../utils/meta-data';
import { ConfigTable } from './table';
import { ArchievementTaskConfig } from './tables/archievementTask';
import { Item } from './tables/Items';
import { Monster } from './tables/monster';
import { Store } from './tables/store';

export function ConfigParse<T extends ConfigTable>(
  type: new () => T,
  path: string,
) {
  return function (target: ConfigManager, propertyKey: string) {
    defineMetadata('configManager:filePath', path, ConfigManager, propertyKey);
    defineMetadata('configManager:parseType', type, ConfigManager, propertyKey);
  };
}

export interface ConfigManagerData {
  [key: string]: ConfigTable[];
}

export class ConfigManager {
  items: Item[] = [];
  store: Store[] = [];
  archievementTask: ArchievementTaskConfig[] = [];
  monsters: Monster[] = [];
  itemMap: Map<string, Item> = new Map();
  storeMap: Map<string, Store> = new Map();
  archievementTaskMap: Map<string, ArchievementTaskConfig> = new Map();
  monsterMap: Map<string, Monster> = new Map();

  constructor(data: ConfigManagerData) {
    ConfigParse(Item, 'items.csv')(this, 'items');
    ConfigParse(Store, 'store.csv')(this, 'store');
    ConfigParse(ArchievementTaskConfig, 'archievementTask.csv')(
      this,
      'archievementTask',
    );
    ConfigParse(Monster, 'monster.csv')(this, 'monsters');

    // 赋值
    for (const key in data) {
      (this as any)[key] = data[key];
    }

    // 构建map
    for (const item of this.items) {
      this.itemMap.set(item.key, item);
    }

    for (const store of this.store) {
      this.storeMap.set(store.key, store);
    }

    for (const task of this.archievementTask) {
      this.archievementTaskMap.set(task.Name, task);
    }

    for (const monster of this.monsters) {
      this.monsterMap.set(monster.Name, monster);
    }
  }
}
