import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatwoContainer, ContainerType } from 'src/entities/container.entity';
import { ChatwoItem } from 'src/entities/item.entity';
import { ChatwoLog } from 'src/entities/log.entity';
import { ChatwoUser } from 'src/entities/user.entity';
import { NakamaService } from 'src/nakama/nakama.service';
import { LogDto } from 'src/statistic/dto/log.dto';
import { ArrayContains, DataSource, EntityManager, MoreThanOrEqual, Repository } from 'typeorm';
import { AddSSDto } from './dto/addSS.dto';
import { autoPatch } from 'src/utils/autoPatch';
import { StatisticService } from 'src/statistic/statistic.service';
import { CodeDto } from './dto/code.dto';
import { ItemService } from 'src/item/item.service';
import { PurchaseService } from 'src/purchase/purchase.service';
import { RefundDto } from './dto/refund.dto';
import { StoreGainInfo } from 'src/configV2/tables/store';
import { parse as QSParse } from 'qs';

@Injectable()
export class GmService {
    constructor(
        @InjectRepository(ChatwoLog)
        private readonly logRepository: Repository<ChatwoLog>,
        @InjectRepository(ChatwoUser)
        private readonly userRepository: Repository<ChatwoUser>,
        @InjectRepository(ChatwoItem)
        private readonly itemRepository: Repository<ChatwoItem>,
        @InjectRepository(ChatwoContainer)
        private readonly containerRepository: Repository<ChatwoContainer>,
        private readonly dataSource: DataSource,
        private readonly nakamaService: NakamaService,
        private readonly statisticsService: StatisticService,
        private readonly itemService: ItemService,
        private readonly purchaseService: PurchaseService,
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
                });
                item.owner = user;
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

    async addSS(account: ApiAccount, dto: AddSSDto): Promise<Record<string, number>> {
        return autoPatch(this.dataSource, async (manager) => {
            const user = await manager.findOne(ChatwoUser, {
                where: { nakamaId: account.custom_id! },
            });
            if (!user) {
                throw new NotFoundException(`User with nakamaId ${account.custom_id} not found`);
            }
            user.wallet['ss'] = (user.wallet['ss'] || 0) + dto.amount;
            await manager.save(user);
            return {
                result: user.wallet,
                tags: ['gm', 'addSS', account.custom_id!, ...(dto.tags || [])],
                message: `Added ${dto.amount} SS to user ${account.custom_id!}, reason: ${dto.reason}`,
            }
        });
    }

    async deleteStatistics(id: number) {
        const log = await this.logRepository.findOneBy({ id });
        if (!log) {
            throw new NotFoundException(`Log with id ${id} not found`);
        }
        await this.logRepository.remove(log);
        return { message: `Log with id ${id} deleted.` };
    }

    async dslQuery(query: string): Promise<{
        result: any;
    }> {
        try {
            return this.statisticsService.execDsl(query);
        } catch (error) {
            throw new BadRequestException(`DSL Query Error: ${error.message}`);
        }
    }

    gain(key: string, amount: StoreGainInfo, account: ApiAccount, manager: EntityManager): Promise<ChatwoItem[]> {
        return this.itemService.gainItems(manager, account, { [key]: amount }, true);
    }

    jsonParse(string: string): any {
        return JSON.parse(string);
    }

    async code(dto: CodeDto): Promise<{
        results: string[];
    }> {
        return autoPatch(this.dataSource, async (manager) => {
            const tags: string[] = [];
            const session = await this.nakamaService.login(dto.customId);
            const account = await this.nakamaService.getAccount(session);
            if (!account.user) {
                throw new NotFoundException(`User with customId ${dto.customId} not found`);
            }
            const results: any[] = [];
            for (const line of dto.lines) {
                try {
                    const result = await this.statisticsService.execDsl(line, account, {
                        gain: async (key: string, amount: StoreGainInfo) => {
                            const items = await this.gain(key, amount, account, manager);
                            tags.push(...items.map(i => i.nakamaId));
                            return items;
                        },
                        deleteLog: async (something: any) => {
                            return this.logRepository.delete({
                                id: something.id,
                            });
                        },
                        deleteItem: async (something: any) => {
                            return manager.delete(ChatwoItem, something);
                        },
                        jsonParse: (string: string) => this.jsonParse(string),
                        qsParse: (string: string) => QSParse(string),
                    });
                    results.push(result);
                } catch (error) {
                    results.push(error);
                }
            }
            return {
                result: {
                    results,
                },
                message: `Executed DSL lines for user ${dto.customId}`,
                tags,
            }
        });
    }

    async refund(dto: RefundDto) {
        const session = await this.nakamaService.login(dto.customId);
        const account = await this.nakamaService.getAccount(session);
        return this.purchaseService.refund(account, dto.sku, dto.reason);
    }
}
