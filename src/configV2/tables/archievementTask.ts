import { ConfigInt, ConfigTable, ConfigYaml } from '../table';

export enum ArchievementTaskType {
  once = 0,
  daily = 1,
  longterm = 2,
}

export class ArchievementTaskConfig extends ConfigTable {
  Name: string = '';
  Type: ArchievementTaskType = ArchievementTaskType.once;
  Award: {
    [key: string]: number;
  } = {};
  Progress: string = 'false';
  Test: number = 0;

  constructor() {
    super();
    ConfigYaml()(this, 'Award');
    ConfigInt()(this, 'Test');
  }
}
