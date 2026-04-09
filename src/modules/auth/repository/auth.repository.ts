import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export type UserWithPizzeria = User & {
  pizzeria: { deletedAt: Date | null } | null;
};

@Injectable()
export class AuthRepository {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserWithPizzeria | null> {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { pizzeria: { select: { deletedAt: true } } },
    }) as Promise<UserWithPizzeria | null>;
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }
}
