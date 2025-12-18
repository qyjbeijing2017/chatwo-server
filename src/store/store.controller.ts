import { Controller, Get, Param, Post } from '@nestjs/common';
import { StoreService } from './store.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Account } from 'src/auth/Account.decorator';
import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';

@Controller('store')
export class StoreController {
    constructor(private readonly storeService: StoreService) { }

    @ApiBearerAuth()
    @Post('buy/:goodId')
    async buyItem(
        @Account() account: ApiAccount,
        @Param('goodId') goodId: string,
    ) {
        return this.storeService.buyItem(account, goodId);
    }

    @ApiBearerAuth()
    @Get('redeem/:code')
    async redeemCode(
        @Account() account: ApiAccount,
        @Param('code') code: string,
    ) {
        return this.storeService.redeemCode(account, code);
    }
}
