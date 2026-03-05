import {
    Entity,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { IgnoreInhJsonPath, Patchable } from './patchable';
import { ChatwoUser } from './user.entity';

export enum TaskStatus {
    IN_PROGRESS = 'IN_PROGRESS',
    DONE = 'DONE',
    DELETED = 'DELETED',
}

@Entity()
export class ChatwoTask extends Patchable {
    @Column()
    key: string;

    @IgnoreInhJsonPath()
    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @IgnoreInhJsonPath()
    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @IgnoreInhJsonPath()
    @ManyToOne(() => ChatwoUser, (user) => user.missions)
    owner: ChatwoUser;

    @Column("float", { array: true })
    progress: number[] = [];

    @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.IN_PROGRESS })
    status: TaskStatus;

    @Column({ type: 'jsonb', default: {} })
    extra: { [key: string]: any };
}
