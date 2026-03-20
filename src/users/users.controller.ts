import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { User } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@ApiBearerAuth('jwt')
@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Criar usuário' })
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Listar usuários da pizzaria' })
  async findAll(@CurrentUser() user: User) {
    return this.service.findAllByPizzeria(user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar usuário' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: User,
  ) {
    return this.service.update(id, dto, user);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar usuário' })
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.remove(id, user);
  }
}
