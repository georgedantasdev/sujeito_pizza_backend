import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { AddOrderItemDto } from '../dto/add-order-item.dto';
import { CreateOrderDto } from '../dto/create-order.dto';

@Injectable()
export class OrdersRepository {
  constructor(private prisma: PrismaService) {}

  private readonly orderSelect = {
    id: true,
    status: true,
    totalPrice: true,
    note: true,
    createdAt: true,
    updatedAt: true,
    table: {
      select: {
        id: true,
        number: true,
        pizzeriaId: true,
      },
    },
    user: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    items: {
      select: {
        id: true,
        quantity: true,
        price: true,
        note: true,
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        size: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        flavor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
  } as const;

  async findById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      select: this.orderSelect,
    });
  }

  async findAllByPizzeria(pizzeriaId: string, status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: {
        table: { pizzeriaId },
        ...(status ? { status } : {}),
      },
      select: this.orderSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByUser(userId: string, status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
      },
      select: this.orderSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateOrderDto, userId: string) {
    return this.prisma.order.create({
      data: {
        tableId: dto.tableId,
        userId,
        note: dto.note,
      },
      select: this.orderSelect,
    });
  }

  async addItem(
    orderId: string,
    dto: AddOrderItemDto,
    itemPrice: number,
  ) {
    const [item] = await this.prisma.$transaction([
      this.prisma.orderItem.create({
        data: {
          orderId,
          productId: dto.productId,
          sizeId: dto.sizeId,
          flavorId: dto.flavorId,
          quantity: dto.quantity,
          price: itemPrice,
          note: dto.note,
        },
        select: {
          id: true,
          quantity: true,
          price: true,
          note: true,
          product: { select: { id: true, name: true } },
          size: { select: { id: true, name: true, price: true } },
          flavor: { select: { id: true, name: true } },
        },
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: { totalPrice: { increment: itemPrice * dto.quantity } },
      }),
    ]);

    return item;
  }

  async removeItem(itemId: string, orderId: string, itemTotal: number) {
    await this.prisma.$transaction([
      this.prisma.orderItem.delete({ where: { id: itemId } }),
      this.prisma.order.update({
        where: { id: orderId },
        data: { totalPrice: { decrement: itemTotal } },
      }),
    ]);
  }

  async updateStatus(id: string, status: OrderStatus) {
    return this.prisma.order.update({
      where: { id },
      data: { status },
      select: this.orderSelect,
    });
  }

  async findItemById(itemId: string) {
    return this.prisma.orderItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        orderId: true,
        quantity: true,
        price: true,
      },
    });
  }
}
