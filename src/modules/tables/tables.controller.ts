import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CloseTableDto } from './dto/close-table.dto';
import { CreateTableDto } from './dto/create-table.dto';
import { TablesService } from './tables.service';

@ApiTags('tables')
@ApiBearerAuth('jwt')
@Controller('tables')
export class TablesController {
  constructor(private service: TablesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Criar mesa' })
  async create(@Body() dto: CreateTableDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Listar mesas da pizzaria' })
  async findAll(@CurrentUser() user: User) {
    return this.service.findAll(user);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Buscar mesa por ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.findOne(id, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Remover mesa' })
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.remove(id, user);
  }

  @Post(':id/open')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Abrir mesa' })
  async open(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.openTable(id, user);
  }

  @Post(':id/close')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Encerrar mesa e registrar pagamento' })
  async close(
    @Param('id') id: string,
    @Body() dto: CloseTableDto,
    @CurrentUser() user: User,
  ) {
    return this.service.closeTable(id, dto, user);
  }

  @Get(':id/orders')
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Listar pedidos da mesa' })
  async findOrders(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.findOrders(id, user);
  }
}
