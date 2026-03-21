import { Module } from '@nestjs/common';
import { PizzeriasController } from './pizzerias.controller';
import { PizzeriasService } from './pizzerias.service';
import { PizzeriasRepository } from './repository/pizzerias.repository';

@Module({
  controllers: [PizzeriasController],
  providers: [PizzeriasService, PizzeriasRepository],
})
export class PizzeriasModule {}