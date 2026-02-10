import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { GmService } from './gm.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Server } from 'src/auth/server.decorator';
import { LogDto } from 'src/statistic/dto/log.dto';
import { AddSSDto } from './dto/addSS.dto';
import { Account } from 'src/auth/Account.decorator';
import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { Public } from 'src/auth/public.decorator';
import { getServerTime } from 'src/utils/serverTime';
import { CodeDto } from './dto/code.dto';
import { RefundDto } from './dto/refund.dto';

@Controller('gm')
export class GmController {
    constructor(private readonly gmService: GmService) { }

    @Get('serverTime')
    @Public()
    async getServerTimeGM() {
        return {
            serverTime: getServerTime().toISOString(),
        }
    }

    @ApiBearerAuth()
    @Get('statistics')
    @Server()
    async getStatisticsGM(
        @Query() logDto: LogDto,
    ) {
        return this.gmService.getAllStatistics(logDto);
    }

    @ApiBearerAuth()
    @Post('syncFromNakama')
    @Server()
    async syncFromNakamaGM() {
        return this.gmService.syncAllFromNakama();
    }


    @ApiBearerAuth()
    @Post('syncOneFromNakama/:customId')
    @Server()
    async syncOneFromNakamaGM(
        @Query('customId') customId: string,
    ) {
        return this.gmService.syncOneFromNakama(customId);
    }

    @ApiBearerAuth()
    @Post('addSS')
    async addSSGM(
        @Account() account: ApiAccount,
        @Body() dto: AddSSDto,
    ) {
        return this.gmService.addSS(account, dto);
    }

    @ApiBearerAuth()
    @Server()
    @Delete('statistics/:id')
    async deleteStatistics(@Param('id', ParseIntPipe) id: number) {
        return this.gmService.deleteStatistics(id);
    }

    @ApiBearerAuth()
    @Server()
    @Get('dsl/:query')
    async dslQuery(@Param('query') query: string) {
        return this.gmService.dslQuery(query);
    }

    @ApiBearerAuth()
    @Server()
    @Post('code')
    async code(@Body() dto: CodeDto) {
        return this.gmService.code(dto);
    }

    @ApiBearerAuth()
    @Server()
    @Post('refund')
    async refundGM(
        @Body() dto: RefundDto,
    ) {
        return this.gmService.refund(dto);
    }

}
