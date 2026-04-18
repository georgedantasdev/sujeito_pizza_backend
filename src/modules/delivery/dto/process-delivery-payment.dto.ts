import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class ProcessDeliveryPaymentDto {
  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: 5.00, description: 'Desconto em reais (opcional, não pode ser negativo)' })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : undefined))
  @IsNumber({}, { message: 'Desconto deve ser um número válido' })
  @Min(0, { message: 'Desconto não pode ser negativo' })
  discount?: number;
}
