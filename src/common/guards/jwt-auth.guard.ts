import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UsersRepository } from '../../users/repository/users.repository';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private usersRepository: UsersRepository,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();

    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token não encontrado');
    }

    try {
      const payload = await this.jwt.verifyAsync(token);

      const user = await this.usersRepository.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      request['user'] = user;

      return true;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Token expirado');
      }

      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Token inválido');
      }

      throw error;
    }
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');

    return type === 'Bearer' ? token : null;
  }
}
