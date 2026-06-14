import { Module } from '@nestjs/common';
import { MajorsService } from './majors.service';
import { MajorsController } from './majors.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MajorsController],
  providers: [MajorsService],
  exports: [MajorsService],
})
export class MajorsModule {}
