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
import { DeliveryStatus, Role } from '@prisma/client';
import type { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AddDeliveryItemDto } from './dto/add-delivery-item.dto';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { ProcessDeliveryPaymentDto } from './dto/process-delivery-payment.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { DeliveryService } from './delivery.service';

@ApiTags('delivery')
@ApiBearerAuth('jwt')
@Controller('delivery')
export class DeliveryController {
  constructor(private service: DeliveryService) {}

  @Post()
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Criar entrega' })
  async create(@Body() dto: CreateDeliveryDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Listar entregas' })
  @ApiQuery({ name: 'status', required: false, enum: DeliveryStatus })
  async findAll(
    @CurrentUser() user: User,
    @Query('status') status?: DeliveryStatus,
  ) {
    return this.service.findAll(user, status);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Buscar entrega por id' })
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.findOne(id, user);
  }

  @Post(':id/items')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Adicionar item à entrega' })
  async addItem(
    @Param('id') id: string,
    @Body() dto: AddDeliveryItemDto,
    @CurrentUser() user: User,
  ) {
    return this.service.addItem(id, dto, user);
  }

  @Delete(':id/items/:itemId')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Remover item da entrega' })
  async removeItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.removeItem(id, itemId, user);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Atualizar status da entrega (PREPARING → READY → DELIVERED | CANCELLED)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.service.updateStatus(id, dto, user);
  }

  @Patch(':id/payment')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Registrar pagamento da entrega' })
  async processPayment(
    @Param('id') id: string,
    @Body() dto: ProcessDeliveryPaymentDto,
    @CurrentUser() user: User,
  ) {
    return this.service.processPayment(id, dto, user);
  }
}
