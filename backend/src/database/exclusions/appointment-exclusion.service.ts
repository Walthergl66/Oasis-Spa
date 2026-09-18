import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppointmentExclusionService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppointmentExclusionService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    await this.ensurePostgresGistExclusion();
  }

  async ensurePostgresGistExclusion(): Promise<void> {
    try {
      if (this.dataSource.options.type !== 'postgres') {
        return;
      }

      this.logger.log('Verificando extensión btree_gist y restricción GiST anti doble reserva...');

      // 1. Asegurar extensión btree_gist
      await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS "btree_gist";`);

      // 2. Crear restricción de exclusión en la tabla appointments
      const query = `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_appointments'
          ) THEN
            ALTER TABLE appointments
            ADD CONSTRAINT no_overlapping_appointments
            EXCLUDE USING gist (
              employee_id WITH =,
              tstzrange(start_time, end_time) WITH &&
            )
            WHERE (status NOT IN ('CANCELLED'));
          END IF;
        END $$;
      `;

      await this.dataSource.query(query);
      this.logger.log('✅ Restricción GiST (no_overlapping_appointments) activa en PostgreSQL.');
    } catch (error) {
      this.logger.warn(
        `Nota sobre restricción GiST en appointments (podría aplicarse una vez existan las tablas): ${error.message}`,
      );
    }
  }
}
