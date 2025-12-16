import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { ItemType } from '../../entities/item.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  key: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  type: ItemType;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  userNakamaId: string;
}
