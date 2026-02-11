import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { configManager } from 'src/configV2/config';
import { PruchaseType } from 'src/configV2/tables/purchase';
import { ChatwoItem } from 'src/entities/item.entity';
import { ChatwoLog } from 'src/entities/log.entity';
import { ChatwoUser } from 'src/entities/user.entity';
import { ItemService } from 'src/item/item.service';
import { autoPatch } from 'src/utils/autoPatch';
import { startTransaction } from 'src/utils/transaction';
import { And, ArrayContains, DataSource, Not } from 'typeorm';

@Injectable()
export class PurchaseService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly itemService: ItemService,
        private configService: ConfigService<NodeJS.ProcessEnv>
    ) { }

    async verify_entitlement(user_id: string, sku: string): Promise<boolean> {
        console.log(`Verifying entitlement for user ${user_id} and sku ${sku}`);
        console.log(`Using access token: OC|${this.configService.get('APP_ID')}|${this.configService.get('APP_SECRET')}`);

        const verifyResp = await fetch(`https://graph.oculus.com/${this.configService.get('APP_ID')}/verify_entitlement`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                access_token: `OC|${this.configService.get('APP_ID')}|${this.configService.get('APP_SECRET')}`,
                user_id,
                sku
            })
        });
        const verifyData = await verifyResp.json();
        console.log(`Verify entitlement response: ${JSON.stringify(verifyData)}`);
        return verifyData.success
    }

    async consume_entitlement(user_id: string, sku: string): Promise<void> {
        const consumeResp = await fetch(`https://graph.oculus.com/${this.configService.get('APP_ID')}/consume_entitlement`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                access_token: `OC|${this.configService.get('APP_ID')}|${this.configService.get('APP_SECRET')}`,
                user_id,
                sku
            })
        });
        const consumeData = await consumeResp.json();
        if (!consumeData.success) {
            throw new BadRequestException(`Failed to consume entitlement for user ${user_id} and sku ${sku}`);
        }
    }

    async refund_iap_entitlement(user_id: string, sku: string, reason: string): Promise<void> {
        const refundResp = await fetch(`https://graph.oculus.com/${this.configService.get('APP_ID')}/refund_entitlement`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                access_token: `OC|${this.configService.get('APP_ID')}|${this.configService.get('APP_SECRET')}`,
                user_id,
                sku
            })
        });
        const refundData = await refundResp.json();
        if (!refundData.success) {
            throw new BadRequestException(`Failed to refund entitlement for user ${user_id} and sku ${sku}`);
        }
    }

    async buy(account: ApiAccount, sku: string) {
        return autoPatch(this.dataSource, async (manager) => {
            const tags = ['purchase', account.custom_id!, sku, 'buy'];
            const purchaseConfig = configManager.purchaseMap.get(sku);
            if (!purchaseConfig) {
                throw new BadRequestException(`Purchase with sku ${sku} not found`);
            }
            const user = await manager.findOne(ChatwoUser, {
                where: {
                    nakamaId: account.custom_id,
                }
            });
            if (!user) {
                throw new UnauthorizedException(`User with nakamaId ${account.custom_id} not found`);
            }

            let items: ChatwoItem[] = [];

            if (purchaseConfig.type === PruchaseType.Durable) {
                const brought = await manager.findOne(ChatwoLog, {
                    where: {
                        tags: And(
                            ArrayContains([`purchase`, account.custom_id!, sku, 'buy']),
                            Not(
                                ArrayContains(['refund'])
                            )
                        )
                    }
                })
                if (brought) {
                    throw new BadRequestException(`Purchase with sku ${sku} already bought`);
                }
                if (!await this.verify_entitlement(user.oculusId, sku)) {
                    throw new BadRequestException(`Entitlement verification failed for sku ${sku}`);
                }
                const items = await this.itemService.gainItems(manager, account, purchaseConfig.gain);
                tags.push(...items.map(i => i.nakamaId));
            } else if (purchaseConfig.type === PruchaseType.Consumable) {
                if (!await this.verify_entitlement(user.oculusId, sku)) {
                    throw new BadRequestException(`Entitlement verification failed for sku ${sku}`);
                }
                const items = await this.itemService.gainItems(manager, account, purchaseConfig.gain);
                tags.push(...items.map(i => i.nakamaId));
                await this.consume_entitlement(user.oculusId, sku);
            } else {
                throw new BadRequestException(`Invalid purchase type ${purchaseConfig.type}`);
            }
            return {
                result: items,
                message: 'Purchase successful',
                tags
            };
        });
    }

    async refund(account: ApiAccount, sku: string, reason: string) {
        return await startTransaction<void>(this.dataSource, async (manager) => {
            const config = configManager.purchaseMap.get(sku);
            if (!config) {
                throw new NotFoundException(`Purchase config with sku ${sku} not found`);
            }

            const brought = await manager.findOne(ChatwoLog, {
                where: {
                    tags: And(
                        ArrayContains([`purchase`, account.custom_id!, sku, 'buy']),
                        Not(
                            ArrayContains(['refund'])
                        )
                    )
                }
            })
            if (!brought) {
                throw new NotFoundException(`Purchase with sku ${sku} not found for user ${account.custom_id}`);
            }
            await this.itemService.costItems(manager, account, config.gain);
            brought.tags.push('refund');
            await manager.save(brought);
            await this.refund_iap_entitlement(account.custom_id!, sku, reason);
        });
    }
}
