import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { CreatePizzeriaDto } from './dto/create-pizzeria.dto';
import { UpdatePizzeriaDto } from './dto/update-pizzeria.dto';
import { PizzeriasRepository } from './repository/pizzerias.repository';

@Injectable()
export class PizzeriasService {
  constructor(
    private readonly repository: PizzeriasRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreatePizzeriaDto) {
    const documentExists = await this.repository.findByDocument(dto.document);
    if (documentExists) throw new ConflictException('CNPJ já cadastrado');

    const emailExists = await this.prisma.user.findFirst({
      where: { email: dto.admin.email },
    });
    if (emailExists)
      throw new ConflictException('E-mail do admin já cadastrado');

    const hashedPassword = await bcrypt.hash(dto.admin.password, 10);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const pizzeria = await tx.pizzeria.create({
        data: { name: dto.name, document: dto.document },
      });

      await tx.user.create({
        data: {
          name: dto.admin.name,
          email: dto.admin.email,
          password: hashedPassword,
          role: Role.ADMIN,
          pizzeriaId: pizzeria.id,
        },
      });
    });

    return { message: 'Pizzaria criada com sucesso' };
  }
  async findAll() {
    const pizzerias = await this.repository.findAll();

    return {
      message: 'Pizzarias listadas com sucesso',
      data: pizzerias.map(({ id, name, createdAt, updatedAt, deletedAt }) => ({
        id,
        name,
        isActive: deletedAt === null,
        createdAt,
        updatedAt,
      })),
    };
  }

  async findOne(id: string) {
    const pizzeria = await this.repository.findById(id);

    if (!pizzeria) {
      throw new NotFoundException('Pizzaria não encontrada');
    }

    return {
      message: 'Pizzaria encontrada com sucesso',
      data: {
        id: pizzeria.id,
        name: pizzeria.name,
        createdAt: pizzeria.createdAt,
        updatedAt: pizzeria.updatedAt,
      },
    };
  }

  async update(id: string, dto: UpdatePizzeriaDto) {
    const pizzeria = await this.repository.findById(id);

    if (!pizzeria) {
      throw new NotFoundException('Pizzaria não encontrada');
    }

    const updated = await this.repository.update(id, dto);

    return {
      message: 'Pizzaria atualizada com sucesso',
      data: {
        id: updated.id,
        name: updated.name,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    };
  }

  async remove(id: string) {
    const pizzeria = await this.repository.findById(id);

    if (!pizzeria) {
      throw new NotFoundException('Pizzaria não encontrada');
    }

    await this.prisma.$transaction([
      this.prisma.pizzeria.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
      this.prisma.user.updateMany({
        where: { pizzeriaId: id },
        data: { deletedAt: new Date() },
      }),
    ]);

    return { message: 'Pizzaria desativada com sucesso' };
  }

  async activate(id: string) {
    const pizzeria = await this.repository.findByIdAny(id);

    if (!pizzeria) {
      throw new NotFoundException('Pizzaria não encontrada');
    }

    await this.prisma.$transaction([
      this.prisma.pizzeria.update({
        where: { id },
        data: { deletedAt: null },
      }),
      this.prisma.user.updateMany({
        where: { pizzeriaId: id },
        data: { deletedAt: null },
      }),
    ]);

    return { message: 'Pizzaria ativada com sucesso' };
  }
}
