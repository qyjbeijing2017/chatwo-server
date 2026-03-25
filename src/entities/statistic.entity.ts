import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { IgnoreInhJsonPath, Patchable } from "./patchable";
import { ChatwoUser } from "./user.entity";

@Entity()
export class ChatwoStatistic {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    name: string;

    @Column("float")
    progress: number = 0;

    @IgnoreInhJsonPath()
    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @IgnoreInhJsonPath()
    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @IgnoreInhJsonPath()
    @ManyToOne(() => ChatwoUser, (user) => user.statistics)
    owner: ChatwoUser;

    @Column({ type: 'jsonb', default: {} })
    extra: { [key: string]: any };
}