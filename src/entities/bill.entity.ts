import { Column, CreateDateColumn, Entity, ManyToOne } from "typeorm";
import { IgnoreInhJsonPath, Patchable } from "./patchable";
import { ChatwoUser } from "./user.entity";

export enum BillStatus {
    PURCHASED = 'PURCHASED',
    REFUNDED = 'REFUNDED',
}

@Entity()
export class ChatwoBill extends Patchable {
    @Column({ unique: true })
    sku: string;

    @IgnoreInhJsonPath()
    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @IgnoreInhJsonPath()
    @ManyToOne(() => ChatwoUser, (user) => user.bills)
    owner: ChatwoUser;

    @Column({ type: 'enum', enum: BillStatus, default: BillStatus.PURCHASED })
    status: BillStatus;
}