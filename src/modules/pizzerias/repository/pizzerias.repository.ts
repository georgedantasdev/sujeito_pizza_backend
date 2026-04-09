import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Pizzeria } from '@prisma/client';
import { CreatePizzeriaDto } from '../dto/create-pizzeria.dto';
import { UpdatePizzeriaDto } from '../dto/update-pizzeria.dto';

@Injectable()
export class PizzeriasRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Pizzeria | null> {
    return this.prisma.pizzeria.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByIdAny(id: string): Promise<Pizzeria | null> {
    return this.prisma.pizzeria.findFirst({ where: { id } });
  }

  async findByDocument(document: string): Promise<Pizzeria | null> {
    return this.prisma.pizzeria.findFirst({
      where: { document, deletedAt: null },
    });
  }

  async findAll(): Promise<Pizzeria[]> {
    return this.prisma.pizzeria.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreatePizzeriaDto): Promise<Pizzeria> {
    return this.prisma.pizzeria.create({
      data: {
        name: data.name,
        document: data.document,
      },
    });
  }

  async update(id: string, data: UpdatePizzeriaDto): Promise<Pizzeria> {
    return this.prisma.pizzeria.update({
      where: { id },
      data: {
        name: data.name,
      },
    });
  }

  async softDelete(id: string): Promise<Pizzeria> {
    return this.prisma.pizzeria.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async activate(id: string): Promise<Pizzeria> {
    return this.prisma.pizzeria.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}