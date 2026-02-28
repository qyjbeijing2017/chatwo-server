import { ItemType } from '../../entities/item.entity';
import { ConfigBool, ConfigEnum, ConfigFlagEnum, ConfigFloat, ConfigKey, ConfigTable } from '../table';

export class Item extends ConfigTable {
  key: string = '';
  InitInStorage: string = '';
  description: string = '';
  name: string = '';
  type: ItemType = ItemType.item;
  packagedSIze: number = 0;

  constructor() {
    super();
    ConfigKey()(this, 'key');
    ConfigFlagEnum({
      item: ItemType.item,
      arm: ItemType.arm,
      head: ItemType.head,
      eye: ItemType.eye,
      body: ItemType.body,
      vfx: ItemType.vfx,
      currency: ItemType.currency,
      ownable: ItemType.ownable,
      lock: ItemType.lock,
      ownableArm: ItemType.ownableArm,
      lockOwnableArm: ItemType.lockOwnableArm,
      skin: ItemType.skin,
      dropable: ItemType.dropable,
      ore: ItemType.ore,
    })(this, 'type');
    ConfigFloat()(this, 'packagedSIze');
    ConfigBool()(this, 'InitInStorage');
  }
}
