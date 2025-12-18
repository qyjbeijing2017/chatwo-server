import { IsInt, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddSSDto {
    @ApiProperty()
    @IsString()
    customId: string;

    @ApiProperty()
    @IsInt()
    amount: number;

    @ApiProperty()
    @IsInt()
    reason: number;

    @ApiPropertyOptional()
    @IsString({ each: true })
    tags?: string[];
}
