import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { v4 } from 'uuid';
import { ChatwoBlade } from './blade.entity';
import { ChatwoUser } from './user.entity';

export enum HiltEquipState {
  EQUIPPED = 'equipped',
  IN_CHEST = 'in_chest',
  OUT_OF_CONTROL = 'out_of_control',
}

@Entity()
export class ChatwoHilt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nakamaId: string = v4(); // Default to a UUID

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column()
  key: string; // Hilt key

  @Column({
    type: 'enum',
    enum: HiltEquipState,
  })
  state: HiltEquipState = HiltEquipState.EQUIPPED;

  @ManyToOne(() => ChatwoUser, (user) => user.hilts, { nullable: false })
  owner: ChatwoUser;

  @JoinColumn()
  @OneToOne(() => ChatwoBlade, (blade) => blade.hilt)
  blade?: ChatwoBlade | null;
}
