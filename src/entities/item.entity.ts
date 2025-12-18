import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  DeleteDateColumn,
  UpdateDateColumn,
  OneToMany,
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
  item = 0,
  arm = 1,
  head = 1 << 1,
  eye = 1 << 2,
  body = 1 << 3,
  vfx = 1 << 4,
  currency = 1 << 5,
  skin = head | eye | body | vfx,
  dropable = item | arm,
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
