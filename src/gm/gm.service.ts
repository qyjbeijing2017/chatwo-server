import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ChatwoItem, keyToItemType } from 'src/entities/item.entity';
import { ChatwoUser } from 'src/entities/user.entity';
import { NakamaService } from 'src/nakama/nakama.service';
import { DataSource, EntityManager, In } from 'typeorm';
import { AddSSDto } from './dto/addSS.dto';
import { autoPatch } from 'src/utils/autoPatch';
import { StatisticService } from 'src/statistic/statistic.service';
import { CodeDto } from './dto/code.dto';
import { ItemService } from 'src/item/item.service';
import { PurchaseService } from 'src/purchase/purchase.service';
import { RefundDto } from './dto/refund.dto';
import { StoreGainInfo } from 'src/configV2/tables/store';
import { parse as QSParse } from 'qs';
import { configManager } from 'src/configV2/config';
import { ChatwoTask } from 'src/entities/task.entity';
import { LoggerService } from 'src/logger/logger.service';

@Injectable()
export class GmService {
    private readonly logger: Logger = new Logger(GmService.name);
    constructor(
        private readonly dataSource: DataSource,
        private readonly nakamaService: NakamaService,
        private readonly statisticsService: StatisticService,
        private readonly itemService: ItemService,
        private readonly purchaseService: PurchaseService,
        private readonly loggerService: LoggerService,
    ) { }

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

    async dslQuery(query: string): Promise<{
        result: any;
    }> {
        try {
            return this.statisticsService.execDsl(query, null, {}, { openBug: true });
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

    keysFromItemType(type: string) {
        const itemType = keyToItemType(type);
        return Array.from(configManager.itemMap.values()).filter(item => (item.type & itemType) !== 0).map(item => item.key);
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
                        deleteItem: async (something: any) => {
                            return manager.delete(ChatwoItem, something);
                        },
                        jsonParse: (string: string) => this.jsonParse(string),
                        qsParse: (string: string) => QSParse(string, {
                            decoder: (str, defaultDecoder, charset, type) => {
                                const value = defaultDecoder(str, defaultDecoder, charset);

                                if (type === 'value') {
                                    // 数字判断
                                    if (/^-?\d+(\.\d+)?$/.test(value)) {
                                        return Number(value);
                                    }

                                    // 布尔判断
                                    if (value === 'true') return true;
                                    if (value === 'false') return false;
                                    if (value === 'null') return null;
                                }

                                return value;
                            },
                        }),
                        updateMeta: async (nakamaId: string, meta: Record<string, any>) => {
                            const item = await manager.findOne(ChatwoItem, {
                                where: { nakamaId },
                            });
                            if (!item) {
                                throw new NotFoundException(`Item with nakamaId ${nakamaId} not found`);
                            }
                            item.meta = {
                                ...item.meta,
                                ...meta,
                            };
                            await manager.save(item);
                        },
                        updateMetas: async (nakamaIds: string[], meta: Record<string, any>) => {
                            const items = await manager.find(ChatwoItem, {
                                where: {
                                    nakamaId: In(nakamaIds),
                                },
                            });
                            for (const item of items) {
                                item.meta = {
                                    ...item.meta,
                                    ...meta,
                                };
                            }
                            await manager.save(items);
                        },
                        deleteAllTask: async () => {
                            const tasks = await manager.find(ChatwoTask, {
                                where: {
                                    owner: {
                                        nakamaId: account.custom_id!,
                                    },
                                },
                            });
                            await manager.delete(ChatwoTask, tasks);
                        },
                        createTask: async (key: string) => {
                            const user = await manager.findOne(ChatwoUser, {
                                where: { nakamaId: account.custom_id! },
                            });
                            if (!user) {
                                throw new NotFoundException(`User with nakamaId ${account.custom_id!} not found`);
                            }
                            const config = configManager.archievementTaskMap.get(key);
                            if (!config) {
                                throw new NotFoundException(`Task config with key ${key} not found`);
                            }
                            const task = manager.create(ChatwoTask, {
                                key,
                                owner: user,
                            });
                            await manager.save(task);
                            return task;
                        },
                        getItemsByType: async (type: string) => {
                            const items = await manager.find(ChatwoItem, {
                                where: {
                                    owner: { nakamaId: account.custom_id! },
                                    key: In(this.keysFromItemType(type)),
                                },
                            });
                            return items;
                        },
                        fun: async (dsl: string) => {
                            return async (...args: any[]) => {
                                const result = await this.statisticsService.execDsl(dsl, account, {
                                    args,
                                }, { openBug: true });
                                return result;
                            }
                        },
                        arrayMap: async (array: any[], funcDsl: string) => {
                            let newArray: any[] = [];
                            for (let index = 0; index < array.length; index++) {
                                const item = array[index];
                                const result = await this.statisticsService.execDsl(funcDsl, account, {
                                    item,
                                    index,
                                });
                                newArray.push(result);
                            }
                            return newArray;
                        },
                        arrayFilter: async (array: any[], funcDsl: string) => {
                            let newArray: any[] = [];
                            for (let index = 0; index < array.length; index++) {
                                const item = array[index];
                                const result = await this.statisticsService.execDsl(funcDsl, account, {
                                    item,
                                    index,
                                });
                                if (result) {
                                    newArray.push(item);
                                }
                            }
                            return newArray;
                        },
                        log: async (message: string) => {
                            this.logger.log(`DSL Log: ${message}`);
                        },
                        searchLogs: async (filters: Record<string, any> = {}, options: { limit?: number, skip?: number } = {}) => {
                            return this.loggerService.search({
                                filters,
                                limit: options.limit,
                                skip: options.skip,
                            });
                        }
                    }, { openBug: true });
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
