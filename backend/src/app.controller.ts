import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './modules/auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** Comprobación de vida de la API. Abierta: no expone dato alguno. */
  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
