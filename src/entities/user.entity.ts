import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { v4 } from 'uuid';
import { ChatwoItem } from './item.entity';
import { ChatwoContainer } from './container.entity';
import { IgnorePatchJson, Patchable } from './patchable';

@Entity()
export class ChatwoUser extends Patchable {
  @IgnorePatchJson()
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @IgnorePatchJson()
  @Column({ unique: true })
  nakamaId: string = v4(); // Default to a UUID

  @IgnorePatchJson()
  @Column({ unique: true, nullable: true })
  oculusId: string;

  @Column({ unique: true, nullable: true })
  name: string;

  @Column({ type: 'jsonb', default: '{}' })
  wallet: Record<string, number> = {};

  @IgnorePatchJson()
  @OneToMany(() => ChatwoItem, (item) => item.owner)
  items: ChatwoItem[];

  @IgnorePatchJson()
  @OneToMany(() => ChatwoContainer, (container) => container.owner)
  containers: ChatwoContainer[];

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ type: 'float8', default: 0 })
  flyMeters: number = 0;
}
