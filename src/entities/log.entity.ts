import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  DeleteDateColumn,
} from 'typeorm';
import { ChatwoUser } from './user.entity';
import { ChatwoItem } from './item.entity';

export type ChatwoWalletAddition = Record<string, number>;
export interface ChatwoItemUpdateLog {
  [key: string]: {
    owner?: {
      before: string;
      after: string;
    };
    metadata?: {
      before: any;
      after: any;
    };
  };
}
export interface ChatwoItemLogData {
  update?: ChatwoItemUpdateLog;
  added?: Partial<ChatwoItem>[];
  removed?: string[];
}

@Entity()
export class ChatwoLog {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column()
  message: string; // Log message

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Column({ type: 'jsonb', default: {} })
  data: {
    wallet?: ChatwoWalletAddition;
    item?: ChatwoItemLogData;
    fly?: number;
  };

  @Column({ type: 'jsonb' })
  about: string[];
}
