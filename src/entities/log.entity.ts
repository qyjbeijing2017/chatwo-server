import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  DeleteDateColumn,
} from 'typeorm';
import { ChatwoUser } from './user.entity';

@Entity()
export class ChatwoLog {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column()
  type: string; // Log type

  @Column()
  message: string; // Log message

  @ManyToOne(() => ChatwoUser, (user) => user.items, { nullable: false })
  owner: ChatwoUser;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  data: any;

  @Column({ type: 'jsonb' })
  about: string[];
}
