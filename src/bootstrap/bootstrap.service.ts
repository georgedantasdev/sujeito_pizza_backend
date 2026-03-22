import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.createSuperAdmin();
  }

  private async createSuperAdmin() {
    const exists = await this.prisma.user.findFirst({
      where: { role: Role.SUPER_ADMIN },
    });

    if (exists) {
      this.logger.log('Super admin já existe, bootstrap ignorado.');
      return;
    }

    const name = this.config.getOrThrow<string>('superAdmin.name');
    const email = this.config.getOrThrow<string>('superAdmin.email');
    const password = this.config.getOrThrow<string>('superAdmin.password');

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.SUPER_ADMIN,
      },
    });

    this.logger.log(`Super admin "${name}" criado com sucesso.`);
  }
}
