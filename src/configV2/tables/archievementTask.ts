import { ConfigEnum, ConfigInt, ConfigTable, ConfigYaml } from '../table';
import { StoreGainInfo } from './store';

export enum ArchievementTaskType {
  once = 0,
  daily = 1,
  weekly = 2,
}

export enum ArchievementTaskCategory {
  unknown = 0,
  crafting = 1,
  combat = 2,
  social = 3,
}

export type SubmitItemsInfo = {
  total: number;
  check: string;
  description?: string;
  events?: {
    [key: string]: string;
  }
};

export class ArchievementTaskConfig extends ConfigTable {
  Name: string = '';
  Type: ArchievementTaskType = ArchievementTaskType.once;
  Category: ArchievementTaskCategory = ArchievementTaskCategory.unknown;
  Submit: SubmitItemsInfo[] = [];
  Award: {
    [key: string]: StoreGainInfo;
  } = {};

  constructor() {
    super();
    ConfigYaml()(this, 'Award');
    ConfigInt()(this, 'Test');
    ConfigEnum({
      once: ArchievementTaskType.once,
      daily: ArchievementTaskType.daily,
      Weekly: ArchievementTaskType.weekly,
    })(this, 'Type');
  }
}
