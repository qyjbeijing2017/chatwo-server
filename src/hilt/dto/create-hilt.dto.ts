import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { HiltEquipState } from 'src/entities/hilt.entity';

export class CreateHiltDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  key: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsEnum(HiltEquipState)
  @IsOptional()
  state: HiltEquipState;
}
