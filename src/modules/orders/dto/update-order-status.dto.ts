import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.IN_PROGRESS,
    description: 'Novo status do pedido: OPEN | IN_PROGRESS | READY | DELIVERED | CANCELLED',
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
