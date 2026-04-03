import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { CreateTableDto } from './dto/create-table.dto';
import { TablesRepository } from './repository/tables.repository';

@Injectable()
export class TablesService {
  constructor(private repository: TablesRepository) {}

  async create(dto: CreateTableDto, currentUser: User) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }

    const existing = await this.repository.findByNumber(
      currentUser.pizzeriaId,
      dto.number,
    );

    if (existing) {
      throw new ConflictException(
        `Mesa ${dto.number} já existe nesta pizzaria`,
      );
    }

    const table = await this.repository.create(dto, currentUser.pizzeriaId);

    return {
      message: 'Mesa criada com sucesso',
      data: table,
    };
  }

  async findAll(currentUser: User) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }

    const tables = await this.repository.findAllByPizzeria(
      currentUser.pizzeriaId,
    );

    return {
      message: 'Mesas listadas com sucesso',
      data: tables,
    };
  }

  async remove(id: string, currentUser: User) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }

    const table = await this.repository.findById(id);

    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }

    if (table.pizzeriaId !== currentUser.pizzeriaId) {
      throw new ForbiddenException('Mesa não pertence à sua pizzaria');
    }

    await this.repository.delete(id);

    return { message: 'Mesa removida com sucesso' };
  }
}
