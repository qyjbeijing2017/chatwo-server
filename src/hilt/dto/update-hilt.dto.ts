import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { HiltEquipState } from 'src/entities/hilt.entity';

export class UpdateHiltDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    owner: string;

    @ApiProperty()
    @IsEnum(HiltEquipState)
    @IsOptional()
    state: HiltEquipState;

    @ApiProperty()
    @IsOptional()
    @IsString()
    bladeKey?: string | null;

    @ApiProperty()
    @IsInt()
    @IsOptional()
    exp: number;

}
