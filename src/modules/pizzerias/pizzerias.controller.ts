import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreatePizzeriaDto } from './dto/create-pizzeria.dto';
import { UpdatePizzeriaDto } from './dto/update-pizzeria.dto';
import { PizzeriasService } from './pizzerias.service';

@ApiTags('pizzerias')
@ApiBearerAuth('jwt')
@Roles(Role.SUPER_ADMIN)
@Controller('pizzerias')
export class PizzeriasController {
  constructor(private service: PizzeriasService) {}

  @Post()
  @ApiOperation({ summary: 'Criar pizzaria' })
  async create(@Body() dto: CreatePizzeriaDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar pizzarias' })
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar pizzaria por id' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar pizzaria' })
  async update(@Param('id') id: string, @Body() dto: UpdatePizzeriaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar pizzaria' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}