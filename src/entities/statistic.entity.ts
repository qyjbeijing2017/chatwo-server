import { Column, CreateDateColumn, Entity, ManyToOne, UpdateDateColumn } from "typeorm";
import { IgnoreInhJsonPath, Patchable } from "./patchable";
import { ChatwoUser } from "./user.entity";

@Entity()
export class ChatwoStatistic {
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
}