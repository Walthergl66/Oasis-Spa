import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './modules/auth/decorators/public.decorator';

@ApiTags('estado')
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
