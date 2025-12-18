import { Controller, Get, Post, Query } from '@nestjs/common';
import { GmService } from './gm.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Server } from 'src/auth/server.decorator';
import { LogDto } from 'src/statistic/dto/log.dto';

@Controller('gm')
export class GmController {
    constructor(private readonly gmService: GmService) { }

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
}
