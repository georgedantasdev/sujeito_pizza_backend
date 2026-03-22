import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export const AssignableRole = {
  ADMIN: Role.ADMIN,
  EMPLOYEE: Role.EMPLOYEE,
} as const;

export type AssignableRole = (typeof AssignableRole)[keyof typeof AssignableRole];

export class CreateUserDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: AssignableRole, example: AssignableRole.EMPLOYEE })
  @IsEnum(AssignableRole)
  role: AssignableRole;

  @ApiPropertyOptional({ example: 'uuid-da-pizzaria', description: 'Obrigatório quando SUPER_ADMIN cria um ADMIN' })
  @IsOptional()
  @IsUUID()
  pizzeriaId?: string;
}
