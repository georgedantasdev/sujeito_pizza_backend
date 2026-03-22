import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PizzeriasRepository } from './repository/pizzerias.repository';
import { CreatePizzeriaDto } from './dto/create-pizzeria.dto';
import { UpdatePizzeriaDto } from './dto/update-pizzeria.dto';
import { Pizzeria } from '@prisma/client';

@Injectable()
export class PizzeriasService {
  constructor(private repository: PizzeriasRepository) {}

  async create(dto: CreatePizzeriaDto): Promise<Pizzeria> {
    const documentExists = await this.repository.findByDocument(dto.document);

    if (documentExists) {
      throw new ConflictException('CNPJ já cadastrado');
    }

    return this.repository.create(dto);
  }

  async findAll(): Promise<Pizzeria[]> {
    return this.repository.findAll();
  }

  async findOne(id: string): Promise<Pizzeria> {
    const pizzeria = await this.repository.findById(id);

    if (!pizzeria) {
      throw new NotFoundException('Pizzaria não encontrada');
    }

    return pizzeria;
  }

  async update(id: string, dto: UpdatePizzeriaDto): Promise<Pizzeria> {
    const pizzeria = await this.repository.findById(id);

    if (!pizzeria) {
      throw new NotFoundException('Pizzaria não encontrada');
    }

    return this.repository.update(id, dto);
  }

  async remove(id: string): Promise<void> {
    const pizzeria = await this.repository.findById(id);

    if (!pizzeria) {
      throw new NotFoundException('Pizzaria não encontrada');
    }

    await this.repository.softDelete(id);
  }
}