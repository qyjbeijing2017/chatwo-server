import { Column, CreateDateColumn, Entity, ManyToOne } from "typeorm";
import { IgnoreInhJsonPath, Patchable } from "./patchable";
import { ChatwoUser } from "./user.entity";

@Entity()
export class ChatwoReedem extends Patchable {
    @Column()
    key: string;

    @IgnoreInhJsonPath()
    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @IgnoreInhJsonPath()
    @ManyToOne(() => ChatwoUser, (user) => user.reedems)
    owner: ChatwoUser;
}