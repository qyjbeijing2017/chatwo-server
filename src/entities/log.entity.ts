import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ChatwoItem } from './item.entity';

export type ChatwoWalletAddition = Record<string, number>;
export interface ChatwoItemUpdateLog {
  [key: string]: {
    owner?: {
      before?: string;
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

export interface ChatwoDropLogData {
  itemId: string;

}

@Entity()
export class ChatwoLog {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column()
  message: string; // Log message

  @Column({ type: 'jsonb', default: {} })
  data: {
    wallet?: ChatwoWalletAddition;
    fly?: number;
    item?: ChatwoItemLogData;
  };

  @Column({ type: 'text', array: true, default: [] })
  tags: string[] = [];
}
