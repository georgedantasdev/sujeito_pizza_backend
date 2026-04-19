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

  async create(dto: CreateUserDto, currentUser: User) {
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

    let pizzeriaId: string;

    if (currentUser.role === Role.SUPER_ADMIN) {
      if (!dto.pizzeriaId) {
        throw new ForbiddenException('SUPER_ADMIN deve informar a pizzeriaId ao criar um ADMIN');
      }
      pizzeriaId = dto.pizzeriaId;
    } else {
      if (!currentUser.pizzeriaId) {
        throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
      }
      pizzeriaId = currentUser.pizzeriaId;
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.repository.create(dto, hashedPassword, pizzeriaId);

    return {
      message: 'Usuário criado com sucesso',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  async findAllByPizzeria(currentUser: User) {
    if (!currentUser.pizzeriaId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma pizzaria');
    }

    const users = await this.repository.findAllByPizzeria(currentUser.pizzeriaId);

    return {
      message: 'Usuários listados com sucesso',
      data: users,
    };
  }

  async update(id: string, dto: UpdateUserDto, currentUser: User) {
    const user = await this.repository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (currentUser.role === Role.EMPLOYEE && currentUser.id !== id) {
      throw new ForbiddenException('Você só pode atualizar o próprio perfil');
    }

    if (currentUser.role === Role.ADMIN && user.pizzeriaId !== currentUser.pizzeriaId) {
      throw new ForbiddenException('Você só pode atualizar usuários da sua pizzaria');
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
      message: 'Usuário atualizado com sucesso',
      data: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
      },
    };
  }

  async remove(id: string, currentUser: User) {
    const user = await this.repository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (currentUser.id === id) {
      throw new ForbiddenException('Você não pode remover a si mesmo');
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

    return { message: 'Usuário removido com sucesso' };
  }
}
