import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class LogDto {
    @ApiProperty({
        description: '日志标签列表',
        example: ['fly', 'pve'],
        type: [String],
    })
    @IsArray()
    @IsString({ each: true })
    @Transform(({ value }) => {
        console.log('Transforming tags:', value);
        // 如果前端传 ?tags=fly,pve
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {
                // 如果不是 JSON，就按逗号分隔
                return value.split(',');
            }
        }
        // 如果前端传 ?tags=fly&tags=pve，则 value 会是数组
        return value;
    })
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
