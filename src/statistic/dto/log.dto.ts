import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsInt, IsISO8601, IsOptional, IsString } from 'class-validator';

export class LogDto {
    @ApiPropertyOptional()
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    @Transform(({ value }) => {
        // 如果前端传 ?tags=fly,pve
        if (typeof value === 'string') {
            return JSON.parse(value);
        }
        // 如果前端传 ?tags=fly&tags=pve，则 value 会是数组
        return value;
    })
    tags?: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    skip?: number;

    @ApiPropertyOptional()
    @IsISO8601()
    @IsOptional()
    afterThan?: string;
}
