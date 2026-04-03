import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { IsDecimal, IsEnum, IsOptional } from 'class-validator';

export class ProcessPaymentDto {
  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.PIX,
    description: 'Forma de pagamento: CASH | CREDIT_CARD | DEBIT_CARD | PIX',
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    example: '10.00',
    description: 'Valor do desconto a aplicar no total do pedido',
  })
  @IsOptional()
  @IsDecimal()
  discount?: string;
}
