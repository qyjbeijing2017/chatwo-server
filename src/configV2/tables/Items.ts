import { ItemType } from '../../entities/item.entity';
import { ConfigBool, ConfigEnum, ConfigFloat, ConfigKey, ConfigTable } from '../table';

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
    ConfigEnum({
      item: ItemType.item,
      arm: ItemType.arm,
      head: ItemType.head,
      eye: ItemType.eye,
      body: ItemType.body,
      vfx: ItemType.vfx,
      currency: ItemType.currency,
    })(this, 'type');
    ConfigFloat()(this, 'packagedSIze');
    ConfigBool()(this, 'InitInStorage');
  }
}
