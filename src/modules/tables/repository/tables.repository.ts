import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateTableDto } from '../dto/create-table.dto';

@Injectable()
export class TablesRepository {
  constructor(private prisma: PrismaService) {}

  private readonly tableSelect = {
    id: true,
    number: true,
    pizzeriaId: true,
    createdAt: true,
    updatedAt: true,
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
      data: {
        number: dto.number,
        pizzeriaId,
      },
      select: this.tableSelect,
    });
  }

  async delete(id: string) {
    return this.prisma.table.delete({
      where: { id },
    });
  }
}
