import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { Injectable } from '@nestjs/common';
import { configManager } from 'src/configV2/config';
import { ChatwoItem, ItemType } from 'src/entities/item.entity';
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
            throw new Error(`User with nakamaId ${account.custom_id} not found`);
        }
        for (const cost in costs) {
            if (user.wallet[cost] === undefined || user.wallet[cost] < costs[cost]) {
                throw new Error(`Not enough ${cost} to buy item`);
            }
            user.wallet[cost] -= costs[cost];
        }
        await manager.save(user);
    }

    async buyItem(account: ApiAccount, goodId: string) {
        return autoPatch(this.dataSource, async (manager) => {
            const tags = ['store', account.custom_id!, goodId];
            const storeConfig = configManager.storeMap.get(goodId);
            if (!storeConfig) {
                throw new Error(`Store good with id ${goodId} not found`);
            }
            // 扣除费用
            await this.cost(manager, account, storeConfig.cost);
            // 发放物品
            return {
                result: await this.itemService.gainItems(
                    manager,
                    account,
                    storeConfig.gain
                ),
                message: `Successfully bought item ${goodId}`,
                tags,
            };
        });
    }
}
