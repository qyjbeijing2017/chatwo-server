import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ChatwoHilt, HiltEquipState } from '../entities/hilt.entity';
import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { ChatwoUser } from 'src/entities/user.entity';
import { UpdateHiltDto } from './dto/update-hilt.dto';
import { ChatwoBlade } from 'src/entities/blade.entity';
import { CreateHiltDto } from './dto/create-hilt.dto';

@Injectable()
export class HiltService {
    constructor(
        @InjectRepository(ChatwoHilt)
        private readonly hiltRepository: Repository<ChatwoHilt>,
        @InjectRepository(ChatwoUser)
        private readonly userRepository: Repository<ChatwoUser>,
        private dataSource: DataSource,
    ) { }

    async findAll(account: ApiAccount): Promise<ChatwoHilt[]> {
        const user = await this.userRepository.findOne({
            where: { nakamaId: account.custom_id },
            relations: {
                hilts: {
                    blade: true
                }
            },
        });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        return user.hilts || [];
    }

    async findOne(account: ApiAccount, id: number): Promise<ChatwoHilt> {
        const hilt = await this.hiltRepository.findOne({
            where: {
                owner: {
                    nakamaId: account.custom_id,
                },
                id: id,
            },
            relations: {
                blade: true
            },
        });
        if (!hilt) {
            throw new NotFoundException('Hilt not found');
        }
        return hilt;
    }

    async create(hiltData: CreateHiltDto): Promise<ChatwoHilt> {
        const user = await this.userRepository.findOne({ where: { nakamaId: hiltData.ownerNakamaId } });
        if (!user) {
            throw new NotFoundException('Owner not found');
        }
        const hilt = this.hiltRepository.create({
            ...hiltData,
            owner: user,
        });
        return this.hiltRepository.save(hilt);
    }

    async update(id: number, hiltData: UpdateHiltDto): Promise<ChatwoHilt> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const hilt = await this.hiltRepository.findOne({ where: { id }, relations: { blade: true, owner: true } });
            if (!hilt) {
                throw new NotFoundException('Hilt not found');
            }

            if (hilt.owner.nakamaId !== hiltData.ownerNakamaId && hilt.state !== HiltEquipState.OUT_OF_CONTROL) {
                throw new UnauthorizedException('You do not own this hilt');
            }
            const owner = await this.userRepository.findOne({ where: { nakamaId: hiltData.ownerNakamaId } });
            if (!owner) {
                throw new NotFoundException('Owner not found');
            }
            hilt.owner = owner;
            if (hiltData.state) hilt.state = hiltData.state;
            if (hiltData.bladeKey !== undefined && hilt.blade?.bladeKey !== hiltData.bladeKey) {
                if (hilt.blade) {
                    await queryRunner.manager.delete(ChatwoBlade, { id: hilt.blade.id });
                    hilt.blade = null;
                }
                if (hiltData.bladeKey) {
                    hilt.blade = queryRunner.manager.create(ChatwoBlade, {
                        bladeKey: hiltData.bladeKey,
                        hilt: hilt,
                    });
                }
            }
            if(hiltData.exp && hilt.blade) {
                hilt.blade.exp = hiltData.exp;
            }
            await queryRunner.manager.save(hilt);
            await queryRunner.commitTransaction();
            await queryRunner.release();
            return hilt;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
            throw error;
        }
    }

    async remove(userId: string, id: number): Promise<void> {
        const hilt = await this.hiltRepository.findOne({
            where: {
                id: id,
                owner: {
                    nakamaId: userId,
                },
            },
        });
        if (!hilt) {
            throw new NotFoundException('Hilt not found');
        }
        await this.hiltRepository.remove(hilt);
    }

    async findAllAdmin(): Promise<ChatwoHilt[]> {
        return this.hiltRepository.find({ relations: { blade: true, owner: true } });
    }
}
