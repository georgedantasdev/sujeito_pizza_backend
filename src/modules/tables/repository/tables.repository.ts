import { Injectable } from '@nestjs/common';
import { PaymentMethod, TableStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CreateTableDto } from '../dto/create-table.dto';

@Injectable()
export class TablesRepository {
  constructor(private prisma: PrismaService) {}

  private readonly tableSelect = {
    id: true,
    number: true,
    pizzeriaId: true,
    status: true,
    openedAt: true,
    openedById: true,
    paymentMethod: true,
    discount: true,
    paidAt: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  private readonly orderSelect = {
    id: true,
    status: true,
    totalPrice: true,
    note: true,
    createdAt: true,
    updatedAt: true,
    table: { select: { id: true, number: true } },
    user: { select: { id: true, name: true, email: true } },
    items: {
      select: {
        id: true,
        quantity: true,
        price: true,
        note: true,
        product: { select: { id: true, name: true } },
        size: { select: { id: true, name: true, price: true } },
        flavor: { select: { id: true, name: true } },
      },
    },
  } as const;

  async findById(id: string) {
    return this.prisma.table.findUnique({
      where: { id },
      select: this.tableSelect,
    });
  }

  async findByNumber(pizzeriaId: string, number: number) {
    return this.prisma.table.findUnique({
      where: { pizzeriaId_number: { pizzeriaId, number } },
    });
  }

  async findAllByPizzeria(pizzeriaId: string) {
    return this.prisma.table.findMany({
      where: { pizzeriaId },
      select: this.tableSelect,
      orderBy: { number: 'asc' },
    });
  }

  async create(dto: CreateTableDto, pizzeriaId: string) {
    return this.prisma.table.create({
      data: { number: dto.number, pizzeriaId },
      select: this.tableSelect,
    });
  }

  async delete(id: string) {
    return this.prisma.table.delete({ where: { id } });
  }

  async openTable(id: string, userId: string) {
    return this.prisma.table.update({
      where: { id },
      data: {
        status: TableStatus.OCCUPIED,
        openedAt: new Date(),
        openedById: userId,
        paymentMethod: null,
        discount: 0,
        paidAt: null,
      },
      select: this.tableSelect,
    });
  }

  async closeTable(id: string, paymentMethod: PaymentMethod | null, discount: number) {
    return this.prisma.table.update({
      where: { id },
      data: {
        status: TableStatus.FREE,
        openedAt: null,
        openedById: null,
        paymentMethod,
        discount,
        paidAt: paymentMethod ? new Date() : null,
      },
      select: this.tableSelect,
    });
  }

  async findOrdersByTable(tableId: string) {
    const result = await this.prisma.table.findUnique({
      where: { id: tableId },
      select: {
        openedAt: true,
        orders: {
          select: this.orderSelect,
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!result) return [];
    const { openedAt, orders } = result;
    if (!openedAt) return orders;
    return orders.filter((o) => o.createdAt >= openedAt);
  }
}
