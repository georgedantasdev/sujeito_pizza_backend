import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ example: 'a3f7c2...', description: 'Refresh token recebido no login' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
