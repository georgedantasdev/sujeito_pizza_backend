import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class AddOrderItemDto {
  @ApiProperty({ example: 'uuid-do-produto' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 'uuid-do-tamanho' })
  @IsUUID()
  sizeId: string;

  @ApiPropertyOptional({ example: 'uuid-do-sabor' })
  @IsOptional()
  @IsUUID()
  flavorId?: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 'Sem cebola' })
  @IsOptional()
  @IsString()
  note?: string;
}
