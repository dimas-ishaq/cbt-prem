import { Module, Global } from '@nestjs/common';
import { WinstonLogger } from './logger.service';

@Global()
@Module({
  providers: [WinstonLogger],
  exports: [WinstonLogger],
})
export class LoggerModule {}
