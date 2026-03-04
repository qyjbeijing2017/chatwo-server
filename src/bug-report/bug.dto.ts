import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BugDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsInt()
    code: number;

    @ApiProperty()
    @IsString()
    message: string;

    @ApiProperty()
    @IsString()
    reporter: string;

    @ApiProperty()
    @IsString()
    oculusUserId: string;

    @ApiProperty()
    @IsString()
    nakamaUserId: string;

    @ApiProperty()
    data: any;
}
