import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 'uuid-da-mesa' })
  @IsUUID()
  tableId: string;

  @ApiPropertyOptional({ example: 'Cliente prefere entrega rápida' })
  @IsOptional()
  @IsString()
  note?: string;
}
