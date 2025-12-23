import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatwoLog } from 'src/entities/log.entity';
import { ArrayContains, DataSource, LessThan, MoreThanOrEqual, Raw, Repository } from 'typeorm';
import { FlyDto } from './dto/fly.dto';
import { KilledDto } from './dto/pve.dto';
import { configManager } from 'src/configV2/config';
import { ChatwoUser } from 'src/entities/user.entity';
import { LogDto } from './dto/log.dto';
import { autoPatch } from 'src/utils/autoPatch';

@Injectable()
export class StatisticService {
    constructor(
        @InjectRepository(ChatwoLog)
        private readonly logRepository: Repository<ChatwoLog>,
        @InjectRepository(ChatwoUser)
        private readonly userRepository: Repository<ChatwoUser>,
        private readonly dataSource: DataSource,
    ) { }

    async getAllStatistics(logDto: LogDto, account?: ApiAccount) {
        console.log('Fetching statistics with tags:', logDto);
        const [result, total] = await this.logRepository.findAndCount({
            skip: logDto.skip || 0,
            take: 100,
            order: { createdAt: 'DESC' },
            where: {
                tags: account ? ArrayContains([...(logDto.tags || []), account.custom_id || '']) : ArrayContains(logDto.tags || []),
                createdAt: MoreThanOrEqual(new Date(logDto.afterThan || 0)),
            }
        });
        return {
            result,
            total,
        }
    }

    async dsl() {
        this.logRepository.findOne({
            select: {
                id: true,
            },
            where: {
                
            }
        });
        return {};
    }

    async flyIn(account: ApiAccount) {

    }

    async fly(account: ApiAccount, dto: FlyDto) {
        return autoPatch(this.dataSource, async (manager) => {
            const user = await manager.findOne(ChatwoUser, {
                where: {
                    nakamaId: account.custom_id,
                }
            });
            if (!user) {
                throw new NotFoundException(`User with nakamaId ${account.custom_id} not found`);
            }
            user.flyMeters += dto.meters;
            await manager.save(user);
            return {
                result: user,
                message: `User ${account.user?.username} flew ${dto.meters} meters.`,
                tags: [account.custom_id!, 'fly'],
            }
        });
    }

    async pve(account: ApiAccount, dto: KilledDto) {
        const monster = configManager.monsterMap.get(dto.whoWasKilled);
        if (!monster) {
            throw new NotFoundException(`Monster with id ${dto.whoWasKilled} not found`);
        }
        const log = this.logRepository.create({
            message: `User ${account.user?.username} killed ${dto.whoWasKilled}.`,
            tags: [account.custom_id || '', 'pve', dto.whoWasKilled, monster.Type],
        });
        await this.logRepository.save(log);
        return log;
    }

    async pvp(account: ApiAccount, dto: KilledDto) {
        const user = this.userRepository.findOneBy({ name: dto.whoWasKilled });
        if (!user) {
            throw new NotFoundException(`User with name ${dto.whoWasKilled} not found`);
        }
        const log = this.logRepository.create({
            message: `User ${account.user?.username} killed player ${dto.whoWasKilled}.`,
            tags: [account.custom_id || '', 'pvp', dto.whoWasKilled],
        });
        await this.logRepository.save(log);
        return log;
    }
}
