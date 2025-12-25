import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatwoContainer, ContainerType } from 'src/entities/container.entity';
import { ChatwoItem } from 'src/entities/item.entity';
import { ChatwoLog } from 'src/entities/log.entity';
import { ChatwoUser } from 'src/entities/user.entity';
import { NakamaService } from 'src/nakama/nakama.service';
import { LogDto } from 'src/statistic/dto/log.dto';
import { Any, ArrayContainedBy, ArrayContains, Between, DataSource, EntityManager, ILike, In, IsNull, LessThan, LessThanOrEqual, Like, MoreThan, MoreThanOrEqual, Not, Raw, Repository } from 'typeorm';
import { AddSSDto } from './dto/addSS.dto';
import { autoPatch } from 'src/utils/autoPatch';

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
    ) { }

    async query(context, from, select, where, join, orderBy, limit, offset) {
        const take = Math.min(Number(limit) || 100, 100);
        const skip = Number(offset) || 0;
        switch (from) {
            case 'log':
                const [logResult, logCount] = await this.logRepository.findAndCount({
                    select: select,
                    where: where,
                    order: orderBy,
                    skip,
                    take,
                    relations: join,
                });
                return {
                    results: logResult,
                    total: logCount,
                }
            case 'user':
                const [userResult, userCount] = await this.userRepository.findAndCount({
                    select: select,
                    where: where,
                    order: orderBy,
                    skip,
                    take,
                    relations: join,
                });
                for (const user of userResult) {
                    (user as any).friends = await this.nakamaService.login(user.nakamaId).then(session => this.nakamaService.friendsList(session));
                }
                return {
                    results: userResult,
                    total: userCount,
                }
            case 'item':
                const [itemResult, itemCount] = await this.itemRepository.findAndCount({
                    select: select,
                    where: where,
                    order: orderBy,
                    skip,
                    take,
                    relations: join,
                });
                return {
                    results: itemResult,
                    total: itemCount,
                }
            case 'container':
                const [containerResult, containerCount] = await this.containerRepository.findAndCount({
                    select: select,
                    where: where,
                    order: orderBy,
                    skip,
                    take,
                    relations: join,
                });
                return {
                    results: containerResult,
                    total: containerCount,
                }
            default:
                throw new Error(`Unknown from type: ${from}`);
        }
    }

    queryWhere(context, operator, value) {
        switch (operator) {
            case "=":
                return value;
            case "!=":
                return Not(value);
            case ">":
                return MoreThan(value);
            case "<":
                return LessThan(value);
            case ">=":
                return MoreThanOrEqual(value);
            case "<=":
                return LessThanOrEqual(value);
            case "LIKE":
                return Like(value);
            case "ILIKE":
                return ILike(value);
            case "IN":
                return In(value);
            case "@>":
                return ArrayContains(value);
            case "<@":
                return ArrayContainedBy(value);
            case "ISNULL":
                return IsNull();
            case "BETWEEN":
                return Between(value[0], value[1]);
            case "ANY":
                return Any(value);
            case "RAW":
                return Raw((alias) => {
                    const positions = alias.split('.');
                    const aliasReplaced = positions.map((pos, index) => {
                        if (!pos.startsWith('"')) {
                            return `"${pos}"`;
                        } else {
                            return pos;
                        }
                    })
                    const aliasNew = aliasReplaced.join('.');
                    const val = value.replace('<alias>', aliasNew);
                    return val;
                });
            default:
                throw new Error(`Unknown operator: ${operator}`);
        }
    }

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
            const { exec, parserToCST, parseToAST } = await import(`../dsl`);
            const cst = parserToCST(query);
            const ast = parseToAST(cst);
            const result = await exec(ast, {
                query: this.query.bind(this),
                queryWhere: this.queryWhere.bind(this),
            });
            return {
                result,
            }
        } catch (error) {
            throw new BadRequestException(`DSL Query Error: ${error.message}`);
        }
    }
}
