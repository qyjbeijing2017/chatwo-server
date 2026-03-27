/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { defineMetadata } from '../utils/meta-data';
import { ChatwoConfigFileName } from './filesName';
import { ConfigTable } from './table';
import { ArchievementTaskConfig } from './tables/archievementTask';
import { BladeAppearance } from './tables/bladeAppearance';
import { Hilt } from './tables/hilt';
import { Item } from './tables/Items';
import { Level } from './tables/level';
import { Monster } from './tables/monster';
import { Purchase } from './tables/purchase';
import { Redeem } from './tables/redeem';
import { Statistic } from './tables/statistic';
import { Store } from './tables/store';

export function ConfigParse<T extends ConfigTable>(
  type: new () => T,
  ...paths: ChatwoConfigFileName[]
) {
  return function (target: ConfigManager, propertyKey: string) {
    defineMetadata('configManager:filePath', paths, ConfigManager, propertyKey);
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
  hilts: Hilt[] = [];
  redeem: Redeem[] = [];
  purchases: Purchase[] = [];
  levels: Level[] = [];
  statistic: Statistic[] = [];
  bladeAppearance: BladeAppearance[] = [];

  itemMap: Map<string, Item> = new Map();
  storeMap: Map<string, Store> = new Map();
  archievementTaskMap: Map<string, ArchievementTaskConfig> = new Map();
  monsterMap: Map<string, Monster> = new Map();
  hiltMap: Map<string, Hilt> = new Map();
  redeemMap: Map<string, Redeem> = new Map();
  purchaseMap: Map<string, Purchase> = new Map();
  statisticMap: Map<string, Statistic> = new Map();
  bladeAppearanceMap: Map<string, BladeAppearance[]> = new Map();

  constructor(data: ConfigManagerData) {
    ConfigParse(Item, 'items.csv', 'arm.csv')(this, 'items');
    ConfigParse(Store, 'store.csv')(this, 'store');
    ConfigParse(ArchievementTaskConfig, 'archievementTask.csv')(
      this,
      'archievementTask',
    );
    ConfigParse(Monster, 'monster.csv')(this, 'monsters');
    ConfigParse(Hilt, 'hilt.csv')(this, 'hilts');
    ConfigParse(Redeem, 'redeem.csv')(this, 'redeem');
    ConfigParse(Purchase, 'purchase.csv')(this, 'purchases');
    ConfigParse(Level, 'level.csv')(this, 'levels');
    ConfigParse(Statistic, 'statistic.csv')(this, 'statistic');
    ConfigParse(BladeAppearance, 'bladeAppearance.csv')(this, 'bladeAppearance');

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

    for (const hilt of this.hilts) {
      this.hiltMap.set(hilt.key, hilt);
    }

    this.bladeAppearance.sort((a, b) => a.Index - b.Index);
    for (const bladeAppearance of this.bladeAppearance) {
      if (!this.bladeAppearanceMap.has(bladeAppearance.BladeKey)) {
        this.bladeAppearanceMap.set(bladeAppearance.BladeKey, []);
      }
      this.bladeAppearanceMap.get(bladeAppearance.BladeKey)!.push(bladeAppearance);
    }

    for (const redeem of this.redeem) {
      this.redeemMap.set(redeem.code, redeem);
    }

    for (const purchase of this.purchases) {
      this.purchaseMap.set(purchase.sku, purchase);
    }

    for (const statistic of this.statistic) {
      this.statisticMap.set(statistic.Name, statistic);
    }

    this.levels.sort((a, b) => a.Level - b.Level);
  }
}
