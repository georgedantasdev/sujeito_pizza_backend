import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePizzeriaDto {
  @ApiPropertyOptional({ example: 'Pizzaria do João' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;
}