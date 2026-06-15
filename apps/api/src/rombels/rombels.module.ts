import { Module } from '@nestjs/common';
import { RombelsService } from './rombels.service';
import { RombelsController } from './rombels.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RombelsController],
  providers: [RombelsService],
  exports: [RombelsService],
})
export class RombelsModule {}
