import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    ParseIntPipe,
} from '@nestjs/common';
import { HiltService } from './hilt.service';
import { ChatwoHilt } from '../entities/hilt.entity';
import { Account } from 'src/auth/Account.decorator';
import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { Server } from 'src/auth/server.decorator';
import { CreateHiltDto } from './dto/create-hilt.dto';
import { UpdateHiltDto } from './dto/update-hilt.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('hilt')
export class HiltController {
    constructor(private readonly hiltService: HiltService) { }

    @ApiBearerAuth()
    @Get(':nakamaId')
    async findOne(@Account() account: ApiAccount, @Param('nakamaId') nakamaId: string): Promise<ChatwoHilt> {
        return this.hiltService.findOne(account, nakamaId);
    }

    @ApiBearerAuth()
    @Get()
    async findAll(@Account() account: ApiAccount): Promise<ChatwoHilt[]> {
        return this.hiltService.findAll(account);
    }

    @ApiBearerAuth()
    @Server()
    @Put()
    async create(@Body() hilt: CreateHiltDto): Promise<ChatwoHilt> {
        return this.hiltService.create(hilt);
    }

    @ApiBearerAuth()
    @Server()
    @Post(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() hilt: UpdateHiltDto,
    ): Promise<ChatwoHilt> {
        return this.hiltService.update(id, hilt);
    }

    @ApiBearerAuth()
    @Server()
    @Delete(':userId/:nakamaId')
    async remove(@Param('userId') userId: string, @Param('nakamaId') nakamaId: string): Promise<void> {
        return this.hiltService.remove(userId, nakamaId);
    }

    @ApiBearerAuth()
    @Server()
    @Get('admin/all')
    async findAllAdmin(): Promise<ChatwoHilt[]> {
        return this.hiltService.findAllAdmin();
    }
}
