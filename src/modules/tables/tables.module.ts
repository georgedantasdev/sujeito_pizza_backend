import { Module } from '@nestjs/common';
import { TablesController } from './tables.controller';
import { TablesRepository } from './repository/tables.repository';
import { TablesService } from './tables.service';

@Module({
  controllers: [TablesController],
  providers: [TablesService, TablesRepository],
})
export class TablesModule {}
