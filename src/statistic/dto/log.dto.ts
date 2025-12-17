import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class LogDto {
    @ApiProperty({
        description: '日志标签列表',
        example: ['fly', 'pve'],
        type: [String],
    })
    @IsArray()
    @IsString({ each: true })
    tags: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    skip?: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    lessThan?: string;
}
