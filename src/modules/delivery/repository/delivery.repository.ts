import { Injectable } from '@nestjs/common';
import { DeliveryStatus, PaymentMethod, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { AddDeliveryItemDto } from '../dto/add-delivery-item.dto';
import { CreateDeliveryDto } from '../dto/create-delivery.dto';

@Injectable()
export class DeliveryRepository {
  constructor(private prisma: PrismaService) {}

  private readonly deliverySelect = {
    id: true,
    pizzeriaId: true,
    customerName: true,
    status: true,
    totalPrice: true,
    paymentMethod: true,
    discount: true,
    paidAt: true,
    note: true,
    createdAt: true,
    updatedAt: true,
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
    return this.prisma.delivery.findUnique({
      where: { id },
      select: this.deliverySelect,
    });
  }

  async findAllByPizzeria(pizzeriaId: string, status?: DeliveryStatus) {
    return this.prisma.delivery.findMany({
      where: {
        pizzeriaId,
        ...(status ? { status } : {}),
      },
      select: this.deliverySelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByUser(userId: string, status?: DeliveryStatus) {
    return this.prisma.delivery.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
      },
      select: this.deliverySelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateDeliveryDto, pizzeriaId: string, userId: string) {
    return this.prisma.delivery.create({
      data: {
        customerName: dto.customerName,
        note: dto.note,
        pizzeriaId,
        userId,
      },
      select: this.deliverySelect,
    });
  }

  async addItem(deliveryId: string, dto: AddDeliveryItemDto, itemPrice: Prisma.Decimal) {
    const [item] = await this.prisma.$transaction([
      this.prisma.deliveryItem.create({
        data: {
          deliveryId,
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
      this.prisma.delivery.update({
        where: { id: deliveryId },
        data: { totalPrice: { increment: itemPrice.mul(dto.quantity) } },
      }),
    ]);
    return item;
  }

  async removeItem(itemId: string, deliveryId: string, itemTotal: Prisma.Decimal) {
    await this.prisma.$transaction([
      this.prisma.deliveryItem.delete({ where: { id: itemId } }),
      this.prisma.delivery.update({
        where: { id: deliveryId },
        data: { totalPrice: { decrement: itemTotal } },
      }),
    ]);
  }

  async findItemById(itemId: string) {
    return this.prisma.deliveryItem.findUnique({
      where: { id: itemId },
      select: { id: true, deliveryId: true, quantity: true, price: true },
    });
  }

  async findProductForItem(productId: string, pizzeriaId: string, sizeId: string) {
    return this.prisma.product.findFirst({
      where: { id: productId, pizzeriaId },
      select: {
        available: true,
        sizes: { where: { id: sizeId }, select: { id: true, price: true } },
      },
    });
  }

  async findFlavorForItem(flavorId: string, productId: string) {
    return this.prisma.productFlavor.findFirst({
      where: { id: flavorId, productId },
    });
  }

  async updateStatus(id: string, status: DeliveryStatus) {
    return this.prisma.delivery.update({
      where: { id },
      data: { status },
      select: this.deliverySelect,
    });
  }

  async processPayment(id: string, paymentMethod: PaymentMethod, discount: number) {
    return this.prisma.delivery.update({
      where: { id },
      data: {
        paymentMethod,
        discount,
        paidAt: new Date(),
      },
      select: this.deliverySelect,
    });
  }
}
