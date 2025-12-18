import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatwoContainer, ContainerType } from 'src/entities/container.entity';
import { ChatwoItem } from 'src/entities/item.entity';
import { ChatwoLog } from 'src/entities/log.entity';
import { ChatwoUser } from 'src/entities/user.entity';
import { NakamaService } from 'src/nakama/nakama.service';
import { LogDto } from 'src/statistic/dto/log.dto';
import { ArrayContains, DataSource, EntityManager, MoreThanOrEqual, Repository } from 'typeorm';

@Injectable()
export class GmService {
    constructor(
        @InjectRepository(ChatwoLog)
        private readonly logRepository: Repository<ChatwoLog>,
        @InjectRepository(ChatwoUser)
        private readonly userRepository: Repository<ChatwoUser>,
        private readonly dataSource: DataSource,
        private readonly nakamaService: NakamaService,
    ) { }

    async getAllStatistics(logDto: LogDto, account?: ApiAccount) {
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

    async syncFromNakama(user: ChatwoUser, manager: EntityManager): Promise<void> {

        const session = await this.nakamaService.login(user.nakamaId);
        const nakamaItems = await this.nakamaService.listItems(session);

        const itmesNeedToSave: ChatwoItem[] = [];
        const itmesNeedToDelete: ChatwoItem[] = [];

        let container = await manager.findOne(ChatwoContainer, {
            where: { owner: { nakamaId: user.nakamaId }, type: ContainerType.chest },
        });
        if (!container) {
            container = manager.create(ChatwoContainer, {
                owner: user,
                type: ContainerType.chest,
            });
            await manager.save(container);
        }


        user.name = (await this.nakamaService.getAccount(session)).user?.username || user.name;

        const log = manager.create(ChatwoLog, {
            message: `User synced from Nakama`,
            about: [
                user.nakamaId,
                'user/syncFromNakama',
            ],
            data: {}
        });

        const wallet = await this.nakamaService.getWallet(session);

        for (const [key, value] of Object.entries(wallet)) {
            if (user.wallet[key] !== value) {
                log.data.wallet = log.data.wallet || {};
                log.data.wallet[key] = value - (user.wallet[key] || 0);
                user.wallet[key] = value;
            }
        }

        for (const nakamaItem of nakamaItems) {
            let item = user.items.find((item) => item.nakamaId === nakamaItem.nakamaId);
            if (!item) {
                item = manager.create(ChatwoItem, {
                    ...nakamaItem,
                    owner: user,
                });
                log.data.item = log.data.item || {};
                log.data.item.added = log.data.item.added || [];
                log.data.item.added.push({ ...nakamaItem });
            } else {
                log.data.item = log.data.item || {};
                log.data.item.update = log.data.item.update || {};
                log.data.item.update[item.nakamaId] = {
                    metadata: {
                        before: item.meta,
                        after: nakamaItem.meta,
                    },
                };
                item.owner = user;
                item.meta = nakamaItem.meta;
            }
            item.container = container;
            itmesNeedToSave.push(item);
            log.tags.push(nakamaItem.nakamaId!);
        }

        for (const item of user.items) {
            const nakamaItem = nakamaItems.find((ni) => ni.nakamaId === item.nakamaId);
            if (!nakamaItem) {
                itmesNeedToDelete.push(item);
            }
        }

        await manager.save(itmesNeedToSave);
        await manager.update(
            ChatwoUser,
            { id: user.id },
            {
                name: user.name,
                wallet: user.wallet,
            },
        );
        await manager.save(log);
    }

    async syncOneFromNakama(nakamaId: string) {

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const user = await queryRunner.manager.findOne(ChatwoUser, {
                where: { nakamaId },
                relations: {
                    items: true,
                },
            });
            if (!user) {
                throw new NotFoundException(`User with nakamaId ${nakamaId} not found`);
            }

            await this.syncFromNakama(user, queryRunner.manager);
            await queryRunner.commitTransaction();
            await queryRunner.release();

            return {
                ...user,
                items: user.items.map(item => ({
                    id: item.id,
                    nakamaId: item.nakamaId,
                    meta: item.meta,
                    key: item.key,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                })),
            }
        } catch (error) {
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
            throw error;
        }
    }

    async syncAllFromNakama(): Promise<void> {
        const users = await this.userRepository.find();
        for (const user of users) {
            console.log(`Syncing user ${user.name} from Nakama`);
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            try {
                const userEntity = await queryRunner.manager.findOne(ChatwoUser, {
                    where: { id: user.id },
                    relations: {
                        items: true,
                    }
                });
                await this.syncFromNakama(userEntity!, queryRunner.manager);

                await queryRunner.commitTransaction();
                await queryRunner.release();
            } catch (error) {
                await queryRunner.rollbackTransaction();
                await queryRunner.release();
                throw error;
            }
            console.log(`Synced user ${user.name} from Nakama`);
        }
    }
}
