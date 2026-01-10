import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CodeDto {
    @ApiProperty()
    @IsString()
    customId: string;

    @ApiProperty()
    @IsArray()
    @IsString({ each: true })
    lines: string;
}
