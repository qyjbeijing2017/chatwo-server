import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { configManager } from 'src/configV2/config';
import { ChatwoReedem } from 'src/entities/reedem.entity';
import { ChatwoUser } from 'src/entities/user.entity';
import { ItemService } from 'src/item/item.service';
import { autoPatch } from 'src/utils/autoPatch';
import { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class StoreService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly itemService: ItemService,
    ) { }

    async cost(manager: EntityManager, account: ApiAccount, costs: { [key: string]: number }) {
        const user = await manager.findOne(ChatwoUser, {
            where: { nakamaId: account.custom_id },
        });
        if (!user) {
            throw new NotFoundException(`User with nakamaId ${account.custom_id} not found`);
        }
        for (const cost in costs) {
            if (costs[cost] <= 0) continue;
            if (user.wallet[cost] === undefined || user.wallet[cost] < costs[cost]) {
                throw new BadRequestException(`Not enough ${cost} to buy item`);
            }
            user.wallet[cost] -= costs[cost];
        }
        await manager.save(user);
    }

    async buyItem(account: ApiAccount, goodId: string) {
        return autoPatch(this.dataSource, async (manager) => {
            const tags = ['store', account.custom_id!, goodId, account.user?.username || ''];
            const storeConfig = configManager.storeMap.get(goodId);
            if (!storeConfig) {
                throw new NotFoundException(`Store good with id ${goodId} not found`);
            }
            // 扣除费用
            await this.cost(manager, account, storeConfig.cost);
            // 发放物品
            const items = await this.itemService.gainItems(
                manager,
                account,
                storeConfig.gain
            );
            tags.push(...items.map(i => i.nakamaId));
            return {
                result: items,
                message: `Successfully bought item ${goodId}`,
                tags,
            };
        });
    }

    async redeemCode(account: ApiAccount, code: string) {
        return autoPatch(this.dataSource, async (manager) => {
            const user = await manager.findOne(ChatwoUser, {
                where: { nakamaId: account.custom_id },
            });
            if (!user) {
                throw new NotFoundException(`User with nakamaId ${account.custom_id}, name: ${account.user?.username || ''} not found`);
            }

            code = code.trim().toUpperCase();

            const redeemConfig = configManager.redeemMap.get(code);
            if (!redeemConfig) {
                throw new NotFoundException(`Redeem code ${code} not found`);
            }

            const codeHistory = await manager.findOne(ChatwoReedem, {
                where: {
                    key: code,
                    owner: { nakamaId: account.custom_id },
                }
            });
            if (codeHistory) {
                throw new BadRequestException(`Redeem code ${code} has already been used by this account`);
            }

            const tags = ['redeem', account.user?.username || '', code];
            // 发放物品
            const items = await this.itemService.gainItems(
                manager,
                account,
                redeemConfig.gain
            );
            tags.push(...items.map(i => i.nakamaId));


            const redeemLog = manager.create(ChatwoReedem, {
                key: code,
                owner: user,
            });
            await manager.save(redeemLog);

            return {
                result: items,
                message: `Successfully redeemed code ${code}`,
                tags
            };
        });
    }
}
