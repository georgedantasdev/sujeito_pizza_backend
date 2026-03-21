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
  import type { User } from '@prisma/client';
  import { CurrentUser } from '../../common/decorators/current-user.decorator';
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
    async create(
      @Body() dto: CreatePizzeriaDto,
      @CurrentUser() user: User,
    ) {
      return this.service.create(dto, user);
    }
  
    @Get()
    @ApiOperation({ summary: 'Listar pizzarias' })
    async findAll(@CurrentUser() user: User) {
      return this.service.findAll(user);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Buscar pizzaria por id' })
    async findOne(@Param('id') id: string, @CurrentUser() user: User) {
      return this.service.findOne(id, user);
    }
  
    @Put(':id')
    @ApiOperation({ summary: 'Atualizar pizzaria' })
    async update(
      @Param('id') id: string,
      @Body() dto: UpdatePizzeriaDto,
      @CurrentUser() user: User,
    ) {
      return this.service.update(id, dto, user);
    }
  
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Deletar pizzaria' })
    async remove(@Param('id') id: string, @CurrentUser() user: User) {
      return this.service.remove(id, user);
    }
  }