import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class SubmitItemDto {
    @ApiProperty()
    @IsString()
    key: string;

    @ApiProperty()
    @IsString()
    nakamaId: string;

    meta: any;
}
