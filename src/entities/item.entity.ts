import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  DeleteDateColumn,
} from 'typeorm';
import { v4 } from 'uuid';
import { ChatwoUser } from './user.entity';

export enum ItemType {
  item = 4096,
  type = 61440,
  arm = 8192,
  blade = 8193,
  skin = 16384,
  head = 16385,
  eye = 16486,
  body = 16387,
  vfx = 16388,
  currency = 32768,
}

@Entity()
export class ChatwoItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nakamaId: string = v4(); // Default to a UUID

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column()
  key: string; // Item key/identifier

  @Column({ type: 'int' })
  type: number; // Item type

  @ManyToOne(() => ChatwoUser, (user) => user.items, { nullable: false })
  owner: ChatwoUser;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date;
}
