import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health(): string {
    return 'ok';
  }

  @Get('server-time')
  serverTime() {
    return { serverTime: new Date().toISOString() };
  }
}
