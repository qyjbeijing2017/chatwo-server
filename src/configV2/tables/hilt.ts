import { ConfigBool, ConfigEnum, ConfigFloat, ConfigInt, ConfigKey, ConfigName, ConfigTable } from '../table';

export enum HiltType {
    Mystic = 'Mystic',
    Relic = 'Relic',
    Techno = 'Techno',
    Tutorial = 'Tutorial',
}

export enum HiltGrade {
    A = 'A',
    B = 'B',
    C = 'C',
}

export class Hilt extends ConfigTable {
  key: string = '';
  type: HiltType = HiltType.Mystic;
  grade: HiltGrade = HiltGrade.C;
  skillCDMultiplier: number = 1;
  moduleSlots: number = 0;
  hpBonus: number = 0;
  speedMultiplier: number = 1;

  constructor() {
    super();
    ConfigKey()(this, 'key');
    ConfigName('Key')(this, 'key');
    ConfigName('Type')(this, 'type');
    ConfigEnum({
      Mystic: HiltType.Mystic,
      Relic: HiltType.Relic,
      Techno: HiltType.Techno,
      Tutorial: HiltType.Tutorial,
    })(this, 'type');
    ConfigName('Grade')(this, 'grade');
    ConfigEnum({
      A: HiltGrade.A,
      B: HiltGrade.B,
      C: HiltGrade.C,
    })(this, 'grade');
    ConfigName('Skill CD Multiplier')(this, 'skillCDMultiplier');
    ConfigFloat()(this, 'skillCDMultiplier');
    ConfigName('Module Slots')(this, 'moduleSlots');
    ConfigInt()(this, 'moduleSlots');
    ConfigName('HP Bonus')(this, 'hpBonus');
    ConfigInt()(this, 'hpBonus');
    ConfigName('Speed Multiplier')(this, 'speedMultiplier');
    ConfigFloat()(this, 'speedMultiplier');
  }
}
