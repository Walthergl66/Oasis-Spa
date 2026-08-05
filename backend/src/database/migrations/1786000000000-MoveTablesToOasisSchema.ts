import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Traslada las tablas del esquema `public` al esquema `oasis`.
 *
 * En bases creadas con la primera versión de `InitialSchema` las tablas quedaron
 * en `public`. Esta migración las mueve a `oasis` sin tocar los datos, junto
 * con los tipos enumerados y la función del trigger de `ends_at`.
 *
 * En una base recién inicializada con la versión actual de `InitialSchema` (que
 * ya crea todo en `oasis`) todas las sentencias son no-op: se usan variantes
 * `IF EXISTS` y se crea el esquema con `IF NOT EXISTS`.
 */
export class MoveTablesToOasisSchema1786000000000 implements MigrationInterface {
  name = 'MoveTablesToOasisSchema1786000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "oasis"`);

    const tablas = [
      'categories',
      'users',
      'services',
      'specialists',
      'specialist_categories',
      'user_favorite_services',
      'appointments',
      'reviews',
      'promotions',
      'promotion_services',
      'notifications',
    ];
    for (const tabla of tablas) {
      await queryRunner.query(
        `ALTER TABLE IF EXISTS "public"."${tabla}" SET SCHEMA "oasis"`,
      );
    }

    const tipos = [
      'users_role_enum',
      'users_level_enum',
      'specialists_status_enum',
      'appointments_status_enum',
      'promotions_color_enum',
      'notifications_type_enum',
    ];
    for (const tipo of tipos) {
      await queryRunner.query(
        `ALTER TYPE IF EXISTS "public"."${tipo}" SET SCHEMA "oasis"`,
      );
    }

    await queryRunner.query(
      `ALTER FUNCTION IF EXISTS "public"."appointments_set_ends_at"() SET SCHEMA "oasis"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER FUNCTION IF EXISTS "oasis"."appointments_set_ends_at"() SET SCHEMA "public"`,
    );

    const tipos = [
      'users_role_enum',
      'users_level_enum',
      'specialists_status_enum',
      'appointments_status_enum',
      'promotions_color_enum',
      'notifications_type_enum',
    ];
    for (const tipo of tipos) {
      await queryRunner.query(
        `ALTER TYPE IF EXISTS "oasis"."${tipo}" SET SCHEMA "public"`,
      );
    }

    const tablas = [
      'categories',
      'users',
      'services',
      'specialists',
      'specialist_categories',
      'user_favorite_services',
      'appointments',
      'reviews',
      'promotions',
      'promotion_services',
      'notifications',
    ];
    for (const tabla of tablas) {
      await queryRunner.query(
        `ALTER TABLE IF EXISTS "oasis"."${tabla}" SET SCHEMA "public"`,
      );
    }
  }
}
