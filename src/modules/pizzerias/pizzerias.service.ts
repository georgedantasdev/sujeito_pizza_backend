import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { PizzeriasRepository } from './repository/pizzerias.repository';
  import { CreatePizzeriaDto } from './dto/create-pizzeria.dto';
  import { UpdatePizzeriaDto } from './dto/update-pizzeria.dto';
  import { Pizzeria, Role, User } from '@prisma/client';
  
  @Injectable()
  export class PizzeriasService {
    constructor(private repository: PizzeriasRepository) {}
  
    async create(dto: CreatePizzeriaDto, currentUser: User): Promise<Pizzeria> {
      if (currentUser.role !== Role.SUPER_ADMIN) {
        throw new ForbiddenException('Apenas SUPER_ADMIN pode cadastrar pizzarias');
      }
  
      const documentExists = await this.repository.findByDocument(dto.document);
  
      if (documentExists) {
        throw new ConflictException('CNPJ já cadastrado');
      }
  
      return this.repository.create(dto);
    }
  
    async findAll(currentUser: User): Promise<Pizzeria[]> {
      if (currentUser.role !== Role.SUPER_ADMIN) {
        throw new ForbiddenException('Apenas SUPER_ADMIN pode listar pizzarias');
      }
  
      return this.repository.findAll();
    }
  
    async findOne(id: string, currentUser: User): Promise<Pizzeria> {
      if (currentUser.role !== Role.SUPER_ADMIN) {
        throw new ForbiddenException('Apenas SUPER_ADMIN pode visualizar pizzarias');
      }
  
      const pizzeria = await this.repository.findById(id);
  
      if (!pizzeria) {
        throw new NotFoundException('Pizzaria não encontrada');
      }
  
      return pizzeria;
    }
  
    async update(
      id: string,
      dto: UpdatePizzeriaDto,
      currentUser: User,
    ): Promise<Pizzeria> {
      if (currentUser.role !== Role.SUPER_ADMIN) {
        throw new ForbiddenException('Apenas SUPER_ADMIN pode atualizar pizzarias');
      }
  
      const pizzeria = await this.repository.findById(id);
  
      if (!pizzeria) {
        throw new NotFoundException('Pizzaria não encontrada');
      }
  
      return this.repository.update(id, dto);
    }
  
    async remove(id: string, currentUser: User): Promise<void> {
      if (currentUser.role !== Role.SUPER_ADMIN) {
        throw new ForbiddenException('Apenas SUPER_ADMIN pode deletar pizzarias');
      }
  
      const pizzeria = await this.repository.findById(id);
  
      if (!pizzeria) {
        throw new NotFoundException('Pizzaria não encontrada');
      }
  
      await this.repository.remove(id);
    }
  }