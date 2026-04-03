import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Role, User } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AddOrderItemDto } from './dto/add-order-item.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersRepository } from './repository/orders.repository';

@Injectable()
export class OrdersService {
  constructor(
    private repository: OrdersRepository,
    private prisma: PrismaService,
  ) {}

  async create(dto: CreateOrderDto, currentUser: User) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }

    const table = await this.prisma.table.findUnique({
      where: { id: dto.tableId },
      select: { id: true, pizzeriaId: true },
    });

    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }

    if (table.pizzeriaId !== currentUser.pizzeriaId) {
      throw new ForbiddenException('Mesa não pertence à sua pizzaria');
    }

    const order = await this.repository.create(dto, currentUser.id);

    return {
      message: 'Pedido criado com sucesso',
      data: order,
    };
  }

  async findAll(currentUser: User, status?: OrderStatus) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }

    const orders =
      currentUser.role === Role.ADMIN
        ? await this.repository.findAllByPizzeria(
            currentUser.pizzeriaId,
            status,
          )
        : await this.repository.findAllByUser(currentUser.id, status);

    return {
      message: 'Pedidos listados com sucesso',
      data: orders,
    };
  }

  async findOne(id: string, currentUser: User) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }

    const order = await this.repository.findById(id);

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    await this.assertOrderBelongsToPizzeria(order, currentUser);

    return {
      message: 'Pedido encontrado com sucesso',
      data: order,
    };
  }

  async addItem(
    orderId: string,
    dto: AddOrderItemDto,
    currentUser: User,
  ) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }

    const order = await this.repository.findById(orderId);

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    await this.assertOrderBelongsToPizzeria(order, currentUser);

    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(
        'Não é possível adicionar itens a um pedido entregue ou cancelado',
      );
    }

    const size = await this.prisma.productSize.findFirst({
      where: { id: dto.sizeId, productId: dto.productId },
      select: { id: true, price: true },
    });

    if (!size) {
      throw new NotFoundException(
        'Tamanho não encontrado ou não pertence ao produto informado',
      );
    }

    if (dto.flavorId) {
      const flavor = await this.prisma.productFlavor.findFirst({
        where: { id: dto.flavorId, productId: dto.productId },
      });
      if (!flavor) {
        throw new NotFoundException(
          'Sabor não encontrado ou não pertence ao produto informado',
        );
      }
    }

    const itemPrice = Number(size.price);
    const item = await this.repository.addItem(orderId, dto, itemPrice);

    return {
      message: 'Item adicionado ao pedido',
      data: item,
    };
  }

  async removeItem(
    orderId: string,
    itemId: string,
    currentUser: User,
  ) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }

    const order = await this.repository.findById(orderId);

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    await this.assertOrderBelongsToPizzeria(order, currentUser);

    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(
        'Não é possível remover itens de um pedido entregue ou cancelado',
      );
    }

    const item = await this.repository.findItemById(itemId);

    if (!item || item.orderId !== orderId) {
      throw new NotFoundException('Item não encontrado neste pedido');
    }

    const itemTotal = Number(item.price) * item.quantity;
    await this.repository.removeItem(itemId, orderId, itemTotal);

    return { message: 'Item removido do pedido' };
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    currentUser: User,
  ) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }

    const order = await this.repository.findById(id);

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    await this.assertOrderBelongsToPizzeria(order, currentUser);

    const updated = await this.repository.updateStatus(id, dto.status);

    return {
      message: 'Status do pedido atualizado',
      data: updated,
    };
  }

  async processPayment(
    id: string,
    dto: ProcessPaymentDto,
    currentUser: User,
  ) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }

    const order = await this.repository.findById(id);

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    await this.assertOrderBelongsToPizzeria(order, currentUser);

    if (order.paid) {
      throw new BadRequestException('Este pedido já foi pago');
    }

    const discount = dto.discount ? Number(dto.discount) : 0;
    const updated = await this.repository.processPayment(
      id,
      dto.paymentMethod,
      discount,
    );

    return {
      message: 'Pagamento registrado com sucesso',
      data: updated,
    };
  }

  private async assertOrderBelongsToPizzeria(
    order: { table: { id: string } },
    currentUser: User,
  ) {
    const table = await this.prisma.table.findUnique({
      where: { id: order.table.id },
      select: { pizzeriaId: true },
    });

    if (!table || table.pizzeriaId !== currentUser.pizzeriaId) {
      throw new ForbiddenException('Pedido não pertence à sua pizzaria');
    }
  }
}
