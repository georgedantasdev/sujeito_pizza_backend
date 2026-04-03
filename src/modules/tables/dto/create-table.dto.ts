import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateTableDto {
  @ApiProperty({ example: 1, description: 'Número da mesa (único por pizzaria)' })
  @IsInt()
  @Min(1)
  number: number;
}
