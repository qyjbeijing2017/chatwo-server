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

@Entity()
export class ChatwoUser {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({ unique: true })
  nakamaId: string = v4(); // Default to a UUID

  @Column({ unique: true, nullable: true })
  oculusId: string;

  @Column({ unique: true, nullable: true })
  name: string;

  @Column({ type: 'jsonb', default: '{}' })
  wallet: Record<string, number> = {};

  @OneToMany(() => ChatwoItem, (item) => item.owner)
  items: ChatwoItem[];

  @OneToMany(() => ChatwoContainer, (container) => container.owner)
  containers: ChatwoContainer[];

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}
