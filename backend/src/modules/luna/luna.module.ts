import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { ServicesModule } from '../services/services.module';
import { SpecialistsModule } from '../specialists/specialists.module';
import { LUNA_NLU } from './luna.types';
import { LunaController } from './luna.controller';
import { LunaService } from './luna.service';
import { RuleBasedNlu } from './rule-based-nlu';

/**
 * Módulo del asistente Luna.
 *
 * Luna no posee datos: ejecuta los servicios reales de los otros módulos
 * (catálogo, citas, promociones, especialistas) y responde con su resultado.
 * La capa de comprensión se inyecta por token (`LUNA_NLU`) para que pueda
 * sustituirse por un modelo de lenguaje sin tocar la lógica de negocio.
 */
@Module({
  imports: [
    ServicesModule,
    AppointmentsModule,
    PromotionsModule,
    SpecialistsModule,
  ],
  controllers: [LunaController],
  providers: [LunaService, { provide: LUNA_NLU, useClass: RuleBasedNlu }],
})
export class LunaModule {}
