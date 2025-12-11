import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Hint,
  OneToMany,
} from 'typeorm';
import { v4 } from 'uuid';
import { ChatwoHilt } from './hilt.entity';

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

  @OneToMany(() => ChatwoHilt, (hilt) => hilt.owner)
  hilts: ChatwoHilt[];
}
