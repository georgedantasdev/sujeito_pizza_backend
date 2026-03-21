import { IsString, MinLength, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePizzeriaDto {
  @ApiProperty({ example: 'Pizzaria do João' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ example: '12345678000195' })
  @IsString()
  @Length(14, 14)
  document: string;
}