import { IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DropItemInDto {
    @ApiProperty()
    @IsString()
    key: string;

    @ApiPropertyOptional()
    meta: any;
}
