import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { Controller, Param, Post } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Account } from 'src/auth/Account.decorator';
import { PurchaseService } from './purchase.service';

@Controller('purchase')
export class PurchaseController {
    constructor(private readonly purchaseService: PurchaseService) { }
    @ApiBearerAuth()
    @Post(':sku')
    async buy(
        @Account() account: ApiAccount,
        @Param('sku') sku: string,
    ) {
        return this.purchaseService.buy(account, sku);
    }
}
