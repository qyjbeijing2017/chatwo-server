import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  DeleteDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v4 } from 'uuid';
import { ChatwoUser } from './user.entity';

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
}

@Entity()
export class ChatwoItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nakamaId: string = v4(); // Default to a UUID

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column()
  key: string; // Item key/identifier

  @Column({ type: 'int' })
  type: ItemType; // Item type

  @ManyToOne(() => ChatwoUser, (user) => user.items, { nullable: false })
  owner: ChatwoUser;

  @Column({ type: 'jsonb', nullable: true })
  meta?: any;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date;
}
