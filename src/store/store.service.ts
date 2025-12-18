import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { Injectable } from '@nestjs/common';
import { configManager } from 'src/configV2/config';
import { ChatwoItem, ItemType } from 'src/entities/item.entity';
import { ChatwoUser } from 'src/entities/user.entity';
import { ItemService } from 'src/item/item.service';
import { autoPatch } from 'src/utils/autoPatch';
import { DataSource } from 'typeorm';

@Injectable()
export class StoreService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly itemService: ItemService,
    ) { }

    async buyItem(account: ApiAccount, goodId: string) {
        return autoPatch(this.dataSource, async (manager) => {
            const tags = ['store', account.custom_id!, goodId];
            const storeConfig = configManager.storeMap.get(goodId);
            if (!storeConfig) {
                throw new Error(`Store good with id ${goodId} not found`);
            }
            const user = await manager.findOne(ChatwoUser, {
                where: { nakamaId: account.custom_id },
            });
            if (!user) {
                throw new Error(`User with nakamaId ${account.custom_id} not found`);
            }
            // Check Cost
            for (const cost in storeConfig.cost) {
                if (user.wallet[cost] === undefined || user.wallet[cost] < storeConfig.cost[cost]) {
                    throw new Error(`Not enough ${cost} to buy item ${goodId}`);
                }
                user.wallet[cost] -= storeConfig.cost[cost];
            }
            const items: ChatwoItem[] = [];
            // Add Items
            for (let i = 0; i < storeConfig.quantity; i++) {
                const itemConfig = configManager.itemMap.get(storeConfig.itemKey);
                if (!itemConfig) {
                    throw new Error(`Item config with key ${storeConfig.itemKey} not found`);
                }
                const item = manager.create(ChatwoItem, {
                    key: storeConfig.itemKey,
                });
                if (itemConfig.type === ItemType.skin) {
                    const skin = await manager.findOne(ChatwoItem, {
                        where: {
                            owner: { id: user.id },
                            key: storeConfig.itemKey,
                        },
                    });
                    if (skin) {
                        continue; // Skip adding duplicate skin
                    } else {
                        item.container = await this.itemService.getContainer(manager, account);
                        item.owner = user;
                        await manager.save(item);
                        items.push(item);
                        tags.push(item.nakamaId);
                        continue;
                    }
                }
                if (itemConfig.fromFile !== 'items.csv') {
                    item.owner = user;
                    await manager.save(item);
                    tags.push(item.nakamaId);
                }
            }
            await manager.save(user);
            return {
                result: items,
                message: `Successfully bought item ${goodId}`,
                tags,
            };
        });
    }
}
