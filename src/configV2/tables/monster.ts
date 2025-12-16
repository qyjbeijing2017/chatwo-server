import { ConfigEnum, ConfigName, ConfigTable } from '../table';

export enum MonsterType {
  Small = 'Small',
  Medium = 'Medium',
  Large = 'Large',
  Boss = 'Boss',
}

export class Monster extends ConfigTable {
  Name: string = '';
  Type: MonsterType = MonsterType.Small;
  constructor() {
    super();
    ConfigName('Name (Key)')(this, 'Name');
    ConfigEnum({
      Small: MonsterType.Small,
      Medium: MonsterType.Medium,
      Large: MonsterType.Large,
      Boss: MonsterType.Boss,
    })(this, 'Type');
  }
}
