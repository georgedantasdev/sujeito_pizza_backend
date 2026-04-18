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
      select: { id: true, pizzeriaId: true, status: true },
    });

    if (!table) throw new NotFoundException('Mesa não encontrada');
    if (table.pizzeriaId !== currentUser.pizzeriaId) {
      throw new ForbiddenException('Mesa não pertence à sua pizzaria');
    }
    if (table.status !== 'OCCUPIED') {
      throw new BadRequestException('A mesa precisa estar aberta para receber pedidos');
    }

    const order = await this.repository.create(dto, currentUser.id);
    return { message: 'Pedido criado com sucesso', data: order };
  }

  async findAll(currentUser: User, status?: OrderStatus) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }

    const orders =
      currentUser.role === Role.ADMIN
        ? await this.repository.findAllByPizzeria(currentUser.pizzeriaId, status)
        : await this.repository.findAllByUser(currentUser.id, status);

    return { message: 'Pedidos listados com sucesso', data: orders };
  }

  async findOne(id: string, currentUser: User) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }

    const order = await this.repository.findById(id);
    if (!order) throw new NotFoundException('Pedido não encontrado');

    this.assertOrderBelongsToPizzeria(order, currentUser);
    return { message: 'Pedido encontrado com sucesso', data: order };
  }

  async addItem(orderId: string, dto: AddOrderItemDto, currentUser: User) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }

    const order = await this.repository.findById(orderId);
    if (!order) throw new NotFoundException('Pedido não encontrado');

    this.assertOrderBelongsToPizzeria(order, currentUser);

    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Não é possível adicionar itens a um pedido entregue ou cancelado');
    }

    // B8: valida disponibilidade do produto antes de adicionar
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, pizzeriaId: currentUser.pizzeriaId },
      select: { available: true, sizes: { where: { id: dto.sizeId }, select: { id: true, price: true } } },
    });

    if (!product) throw new NotFoundException('Produto não encontrado');
    if (!product.available) throw new BadRequestException('Produto não está disponível no momento');

    const size = product.sizes[0];
    if (!size) throw new NotFoundException('Tamanho não encontrado ou não pertence ao produto informado');

    if (dto.flavorId) {
      const flavor = await this.prisma.productFlavor.findFirst({
        where: { id: dto.flavorId, productId: dto.productId },
      });
      if (!flavor) throw new NotFoundException('Sabor não encontrado ou não pertence ao produto informado');
    }

    const item = await this.repository.addItem(orderId, dto, Number(size.price));
    return { message: 'Item adicionado ao pedido', data: item };
  }

  async removeItem(orderId: string, itemId: string, currentUser: User) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }

    const order = await this.repository.findById(orderId);
    if (!order) throw new NotFoundException('Pedido não encontrado');

    this.assertOrderBelongsToPizzeria(order, currentUser);

    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Não é possível remover itens de um pedido entregue ou cancelado');
    }

    const item = await this.repository.findItemById(itemId);
    if (!item || item.orderId !== orderId) throw new NotFoundException('Item não encontrado neste pedido');

    const itemTotal = Math.round(Number(item.price) * item.quantity * 100) / 100;
    await this.repository.removeItem(itemId, orderId, itemTotal);
    return { message: 'Item removido do pedido' };
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, currentUser: User) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }

    const order = await this.repository.findById(id);
    if (!order) throw new NotFoundException('Pedido não encontrado');

    this.assertOrderBelongsToPizzeria(order, currentUser);

    const updated = await this.repository.updateStatus(id, dto.status);
    return { message: 'Status do pedido atualizado', data: updated };
  }

  private assertOrderBelongsToPizzeria(
    order: { table: { pizzeriaId: string } },
    currentUser: User,
  ) {
    if (order.table.pizzeriaId !== currentUser.pizzeriaId) {
      throw new ForbiddenException('Pedido não pertence à sua pizzaria');
    }
  }
}
