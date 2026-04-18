import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDeliveryDto {
  @ApiProperty({ example: 'João Silva', description: 'Nome do cliente / identificação da entrega' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  customerName: string;

  @ApiPropertyOptional({ example: 'Sem cebola', description: 'Observação geral' })
  @IsOptional()
  @IsString()
  note?: string;
}
