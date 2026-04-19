import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeliveryStatus, Role, User } from '@prisma/client';
import { AddDeliveryItemDto } from './dto/add-delivery-item.dto';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { ProcessDeliveryPaymentDto } from './dto/process-delivery-payment.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { DeliveryRepository } from './repository/delivery.repository';

@Injectable()
export class DeliveryService {
  constructor(private repository: DeliveryRepository) {}

  async create(dto: CreateDeliveryDto, currentUser: User) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }
    const delivery = await this.repository.create(dto, currentUser.pizzeriaId, currentUser.id);
    return { message: 'Entrega criada com sucesso', data: delivery };
  }

  async findAll(currentUser: User, status?: DeliveryStatus) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }
    const deliveries =
      currentUser.role === Role.ADMIN
        ? await this.repository.findAllByPizzeria(currentUser.pizzeriaId, status)
        : await this.repository.findAllByUser(currentUser.id, status);
    return { message: 'Entregas listadas com sucesso', data: deliveries };
  }

  async findOne(id: string, currentUser: User) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }
    const delivery = await this.repository.findById(id);
    if (!delivery) throw new NotFoundException('Entrega não encontrada');
    this.assertBelongsToPizzeria(delivery, currentUser);
    return { message: 'Entrega encontrada', data: delivery };
  }

  async addItem(deliveryId: string, dto: AddDeliveryItemDto, currentUser: User) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }
    const delivery = await this.repository.findById(deliveryId);
    if (!delivery) throw new NotFoundException('Entrega não encontrada');
    this.assertBelongsToPizzeria(delivery, currentUser);

    if (delivery.status === DeliveryStatus.DELIVERED || delivery.status === DeliveryStatus.CANCELLED) {
      throw new BadRequestException('Não é possível adicionar itens a uma entrega finalizada');
    }

    const product = await this.repository.findProductForItem(dto.productId, currentUser.pizzeriaId, dto.sizeId);

    if (!product) throw new NotFoundException('Produto não encontrado');
    if (!product.available) throw new BadRequestException('Produto não está disponível no momento');

    const size = product.sizes[0];
    if (!size) throw new NotFoundException('Tamanho não encontrado para este produto');

    if (dto.flavorId) {
      const flavor = await this.repository.findFlavorForItem(dto.flavorId, dto.productId);
      if (!flavor) throw new NotFoundException('Sabor não encontrado para este produto');
    }

    const item = await this.repository.addItem(deliveryId, dto, size.price);
    return { message: 'Item adicionado', data: item };
  }

  async removeItem(deliveryId: string, itemId: string, currentUser: User) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }
    const delivery = await this.repository.findById(deliveryId);
    if (!delivery) throw new NotFoundException('Entrega não encontrada');
    this.assertBelongsToPizzeria(delivery, currentUser);

    if (delivery.status === DeliveryStatus.DELIVERED || delivery.status === DeliveryStatus.CANCELLED) {
      throw new BadRequestException('Não é possível remover itens de uma entrega finalizada');
    }

    const item = await this.repository.findItemById(itemId);
    if (!item || item.deliveryId !== deliveryId) {
      throw new NotFoundException('Item não encontrado nesta entrega');
    }

    const itemTotal = item.price.mul(item.quantity);
    await this.repository.removeItem(itemId, deliveryId, itemTotal);
    return { message: 'Item removido' };
  }

  async updateStatus(id: string, dto: UpdateDeliveryStatusDto, currentUser: User) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }
    const delivery = await this.repository.findById(id);
    if (!delivery) throw new NotFoundException('Entrega não encontrada');
    this.assertBelongsToPizzeria(delivery, currentUser);

    const validTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
      [DeliveryStatus.PREPARING]: [DeliveryStatus.READY, DeliveryStatus.CANCELLED],
      [DeliveryStatus.READY]: [DeliveryStatus.DELIVERED, DeliveryStatus.CANCELLED],
      [DeliveryStatus.DELIVERED]: [],
      [DeliveryStatus.CANCELLED]: [],
    };

    if (!validTransitions[delivery.status].includes(dto.status)) {
      throw new BadRequestException(
        `Transição de status inválida: ${delivery.status} → ${dto.status}`,
      );
    }

    const updated = await this.repository.updateStatus(id, dto.status);
    return { message: 'Status atualizado', data: updated };
  }

  async processPayment(id: string, dto: ProcessDeliveryPaymentDto, currentUser: User) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }
    const delivery = await this.repository.findById(id);
    if (!delivery) throw new NotFoundException('Entrega não encontrada');
    this.assertBelongsToPizzeria(delivery, currentUser);

    if (delivery.paidAt) throw new BadRequestException('Esta entrega já foi paga');

    // B5/B6: discount já é number validado pelo DTO; valida limite máximo
    const discount = dto.discount ?? 0;
    const totalPrice = Number(delivery.totalPrice);
    if (discount > totalPrice) {
      throw new BadRequestException(
        `Desconto (R$${discount.toFixed(2)}) não pode ser maior que o valor total da entrega (R$${totalPrice.toFixed(2)})`,
      );
    }

    const updated = await this.repository.processPayment(id, dto.paymentMethod, discount);
    return { message: 'Pagamento registrado com sucesso', data: updated };
  }

  private assertBelongsToPizzeria(delivery: { pizzeriaId: string }, currentUser: User) {
    if (delivery.pizzeriaId !== currentUser.pizzeriaId) {
      throw new ForbiddenException('Entrega não pertence à sua pizzaria');
    }
  }
}
