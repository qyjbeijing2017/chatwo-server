import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

@Entity()
export class ChatwoBug {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @Column()
    code: number;

    @Column({ nullable: true })
    message: string;

    @Column({ nullable: true })
    reporter: string;

    @Column({ nullable: true })
    oculusUserId: string;

    @Column({ nullable: true })
    nakamaUserId: string;

    @Column({ type: 'jsonb', default: {} })
    data: any;
}
