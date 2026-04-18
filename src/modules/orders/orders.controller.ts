import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OrderStatus, Role } from '@prisma/client';
import type { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AddOrderItemDto } from './dto/add-order-item.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth('jwt')
@Controller('orders')
export class OrdersController {
  constructor(private service: OrdersService) {}

  @Post()
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Criar pedido' })
  async create(@Body() dto: CreateOrderDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({
    summary:
      'Listar pedidos (ADMIN vê todos da pizzaria, EMPLOYEE vê apenas os seus)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: OrderStatus,
    description: 'Filtrar por status do pedido',
  })
  async findAll(
    @CurrentUser() user: User,
    @Query('status') status?: OrderStatus,
  ) {
    return this.service.findAll(user, status);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Buscar pedido por id' })
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.findOne(id, user);
  }

  @Post(':id/items')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Adicionar item ao pedido' })
  async addItem(
    @Param('id') id: string,
    @Body() dto: AddOrderItemDto,
    @CurrentUser() user: User,
  ) {
    return this.service.addItem(id, dto, user);
  }

  @Delete(':id/items/:itemId')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Remover item do pedido' })
  async removeItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.removeItem(id, itemId, user);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({
    summary:
      'Atualizar status do pedido (OPEN → IN_PROGRESS → READY → DELIVERED | CANCELLED)',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.service.updateStatus(id, dto, user);
  }

}
