import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { CloseTableDto } from './dto/close-table.dto';
import { CreateTableDto } from './dto/create-table.dto';
import { TablesRepository } from './repository/tables.repository';

@Injectable()
export class TablesService {
  constructor(private repository: TablesRepository) {}

  async create(dto: CreateTableDto, currentUser: User) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }

    const existing = await this.repository.findByNumber(currentUser.pizzeriaId, dto.number);
    if (existing) {
      throw new ConflictException(`Mesa ${dto.number} já existe nesta pizzaria`);
    }

    const table = await this.repository.create(dto, currentUser.pizzeriaId);
    return { message: 'Mesa criada com sucesso', data: table };
  }

  async findAll(currentUser: User) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }

    const tables = await this.repository.findAllByPizzeria(currentUser.pizzeriaId);
    return { message: 'Mesas listadas com sucesso', data: tables };
  }

  // B1: endpoint dedicado para busca por ID
  async findOne(id: string, currentUser: User) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }

    const table = await this.repository.findById(id);
    if (!table) throw new NotFoundException('Mesa não encontrada');
    if (table.pizzeriaId !== currentUser.pizzeriaId) {
      throw new ForbiddenException('Mesa não pertence à sua pizzaria');
    }

    return { message: 'Mesa encontrada', data: table };
  }

  async remove(id: string, currentUser: User) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }

    const table = await this.repository.findById(id);
    if (!table) throw new NotFoundException('Mesa não encontrada');
    if (table.pizzeriaId !== currentUser.pizzeriaId) {
      throw new ForbiddenException('Mesa não pertence à sua pizzaria');
    }
    if (table.status === 'OCCUPIED') {
      throw new BadRequestException('Não é possível remover uma mesa ocupada');
    }

    await this.repository.delete(id);
    return { message: 'Mesa removida com sucesso' };
  }

  async openTable(id: string, currentUser: User) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }

    const table = await this.repository.findById(id);
    if (!table) throw new NotFoundException('Mesa não encontrada');
    if (table.pizzeriaId !== currentUser.pizzeriaId) {
      throw new ForbiddenException('Mesa não pertence à sua pizzaria');
    }
    if (table.status === 'OCCUPIED') {
      throw new ConflictException('Mesa já está ocupada');
    }

    const updated = await this.repository.openTable(id, currentUser.id);
    return { message: 'Mesa aberta com sucesso', data: updated };
  }

  async closeTable(id: string, dto: CloseTableDto, currentUser: User) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }

    const table = await this.repository.findById(id);
    if (!table) throw new NotFoundException('Mesa não encontrada');
    if (table.pizzeriaId !== currentUser.pizzeriaId) {
      throw new ForbiddenException('Mesa não pertence à sua pizzaria');
    }
    if (table.status === 'FREE') {
      throw new BadRequestException('Mesa já está livre');
    }

    const orders = await this.repository.findOrdersByTable(id);
    const activeOrders = orders.filter((o) => o.status !== 'CANCELLED');
    const pending = activeOrders.filter((o) => o.status !== 'DELIVERED');

    if (pending.length > 0) {
      throw new BadRequestException(
        'Existem pedidos em aberto. Finalize todos os pedidos antes de encerrar a mesa.',
      );
    }

    if (activeOrders.length > 0 && !dto.paymentMethod) {
      throw new BadRequestException('Forma de pagamento é obrigatória quando há pedidos na mesa.');
    }

    // B5/B6: discount já é number validado pelo DTO; valida limite máximo
    const discount = dto.discount ?? 0;
    const totalPrice = activeOrders.reduce((sum, o) => sum + Number(o.totalPrice), 0);
    if (discount > totalPrice && totalPrice > 0) {
      throw new BadRequestException(
        `Desconto (R$${discount.toFixed(2)}) não pode ser maior que o total da mesa (R$${totalPrice.toFixed(2)})`,
      );
    }

    const updated = await this.repository.closeTable(id, dto.paymentMethod ?? null, discount);
    return { message: 'Mesa encerrada com sucesso', data: updated };
  }

  async findOrders(id: string, currentUser: User) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }

    const table = await this.repository.findById(id);
    if (!table) throw new NotFoundException('Mesa não encontrada');
    if (table.pizzeriaId !== currentUser.pizzeriaId) {
      throw new ForbiddenException('Mesa não pertence à sua pizzaria');
    }

    const orders = await this.repository.findOrdersByTable(id);
    return { message: 'Pedidos da mesa listados com sucesso', data: orders };
  }
}
