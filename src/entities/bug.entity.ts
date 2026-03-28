import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
} from 'typeorm';
import { ChatwoUser } from './user.entity';
import { ChatwoItem } from './item.entity';
import { IgnoreInhJsonPath, Patchable, TransformToPathJson } from './patchable';


export enum ContainerType {
    chest = 0,
    equipPoint1 = 1,
    equipPoint2 = 2,
    equipPoint3 = 3,
    equipPoint4 = 4,
    equipPoint5 = 5,
    equipped_start = 1,
    equipped_end = 5,
}

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
