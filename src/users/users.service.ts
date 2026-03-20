import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './repository/users.repository';

@Injectable()
export class UsersService {
  constructor(private repository: UsersRepository) {}

  async create(dto: CreateUserDto, currentUser: User): Promise<Partial<User>> {
    if (currentUser.role === Role.SUPER_ADMIN && dto.role !== Role.ADMIN) {
      throw new ForbiddenException('SUPER_ADMIN só pode criar usuários ADMIN');
    }

    if (currentUser.role === Role.ADMIN && dto.role !== Role.EMPLOYEE) {
      throw new ForbiddenException('ADMIN só pode criar usuários EMPLOYEE');
    }

    const userExists = await this.repository.findByEmail(dto.email);

    if (userExists) {
      throw new ConflictException('Email já cadastrado');
    }

    const pizzeriaId = currentUser.pizzeriaId;

    if (!pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.repository.create(dto, hashedPassword, pizzeriaId);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      pizzeriaId: user.pizzeriaId,
    };
  }

  async findAllByPizzeria(
    currentUser: User,
  ): Promise<Omit<User, 'password'>[]> {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }

    return this.repository.findAllByPizzeria(currentUser.pizzeriaId);
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    currentUser: User,
  ): Promise<Partial<User>> {
    const user = await this.repository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (currentUser.role === Role.EMPLOYEE && currentUser.id !== id) {
      throw new ForbiddenException('Você só pode atualizar o próprio perfil');
    }

    if (dto.email && dto.email !== user.email) {
      const emailExists = await this.repository.findByEmail(dto.email);
      if (emailExists) {
        throw new ConflictException('Email já cadastrado');
      }
    }

    let hashedPassword: string | undefined;

    if (dto.password) {
      hashedPassword = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.repository.update(id, dto, hashedPassword);

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
    };
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const user = await this.repository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (
      currentUser.role === Role.ADMIN &&
      user.pizzeriaId !== currentUser.pizzeriaId
    ) {
      throw new ForbiddenException(
        'Você só pode deletar usuários da sua pizzaria',
      );
    }

    await this.repository.softDelete(id);
  }
}
