import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  DeleteDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v4 } from 'uuid';
import { ChatwoUser } from './user.entity';
import { ChatwoContainer } from './container.entity';
import { IgnoreInhJsonPath, Patchable, TransformToPathJson } from './patchable';


export enum ItemType {
  item = 0,
  arm = 1,
  head = 1 << 1,
  eye = 1 << 2,
  body = 1 << 3,
  vfx = 1 << 4,
  currency = 1 << 5,
  ownable = 1 << 6,
  locked = 1 << 7,
  ore = 1 << 8,
  ownableArm = arm | ownable,
  lockOwnableArm = arm | ownable | locked,
  skin = head | eye | body | vfx,
  dropable = item | arm | ore,
}

const itemTypeMap = new Map<string, ItemType>([
  ['item', ItemType.item],
  ['arm', ItemType.arm],
  ['head', ItemType.head],
  ['eye', ItemType.eye],
  ['body', ItemType.body],
  ['vfx', ItemType.vfx],
  ['currency', ItemType.currency],
  ['skin', ItemType.skin],
  ['ownable', ItemType.ownable],
  ['lock', ItemType.locked],
  ['ore', ItemType.ore],
  ['ownableArm', ItemType.ownableArm],
  ['lockOwnableArm', ItemType.lockOwnableArm],
]);
export function keyToItemType(key: string): ItemType {
  return itemTypeMap.get(key) || ItemType.item;
}

@Entity()
export class ChatwoItem extends Patchable {
  @Column({ unique: true })
  nakamaId: string = v4(); // Default to a UUID

  @IgnoreInhJsonPath()
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @IgnoreInhJsonPath()
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column()
  key: string; // Item key/identifier

  @TransformToPathJson((user: ChatwoUser) => (user ? { nakamaId: user.nakamaId } : undefined))
  @ManyToOne(() => ChatwoUser, (user) => user.items, { nullable: true })
  owner?: ChatwoUser | null;

  @ManyToOne(() => ChatwoContainer, (container) => container.items, { nullable: true })
  container?: ChatwoContainer | null;

  @Column({ type: 'jsonb', nullable: true })
  meta?: any;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date;
}
