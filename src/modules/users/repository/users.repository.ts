import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });
  }

  async findAllByPizzeria(pizzeriaId: string) {
    return this.prisma.user.findMany({
      where: { pizzeriaId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async create(
    data: CreateUserDto,
    hashedPassword: string,
    pizzeriaId: string,
  ): Promise<User> {
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        pizzeriaId,
      },
    });
  }

  async update(
    id: string,
    data: UpdateUserDto,
    hashedPassword?: string,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(hashedPassword !== undefined && { password: hashedPassword }),
      },
    });
  }

  async softDelete(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
