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

export enum ItemTypeV1 {
  item = 4096,
  arm = 8192,
  skin = 16384,
  currency = 32768,
  type = 61440,
  blade = 8193,
  head = 16385,
  eye = 16486,
  body = 16387,
  vfx = 16388,
}

export enum ItemType {
  item = 1,
  arm = 1 << 1,
  head = 1 << 2,
  eye = 1 << 3,
  body = 1 << 4,
  vfx = 1 << 5,
  currency = 1 << 6,
  ownable = 1 << 7,
  lock = 1 << 8,
  ownableArm = arm | ownable,
  lockOwnableArm = arm | ownable | lock,
  skin = head | eye | body | vfx,
  dropable = item | arm,
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
  ['lock', ItemType.lock],
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
