import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RefundDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  customId: string;


  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  sku: string;
}
