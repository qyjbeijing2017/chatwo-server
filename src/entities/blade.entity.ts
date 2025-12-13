import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
} from 'typeorm';
import { ChatwoHilt } from './hilt.entity';

@Entity()
export class ChatwoBlade {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  bladeKey: string;

  @Column()
  exp: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @OneToOne(() => ChatwoHilt, (hilt) => hilt.blade)
  hilt: ChatwoHilt;
}
