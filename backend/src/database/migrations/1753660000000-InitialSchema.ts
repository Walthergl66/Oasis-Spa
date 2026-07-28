import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Esquema inicial derivado de las entidades.
 *
 * Se escribe a mano en lugar de generarse para poder añadir dos garantías que
 * las entidades no expresan y que el dominio sí exige:
 *
 * 1. `appointments_no_overlap`: una especialista no puede tener dos citas
 *    activas que se solapen en el tiempo. Es una restricción EXCLUDE con
 *    btree_gist sobre el intervalo [inicio, inicio + duración). Aunque el
 *    servicio ya valide disponibilidad, dos reservas simultáneas podrían pasar
 *    la validación a la vez; esta restricción lo impide en la base.
 *
 * 2. `appointments_duration_positive` y el CHECK de `rating`: reglas simples
 *    que conviene tener junto a los datos y no sólo en el código.
 */
export class InitialSchema1753660000000 implements MigrationInterface {
  name = 'InitialSchema1753660000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // gen_random_uuid() para las claves primarias; btree_gist para el EXCLUDE.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "btree_gist"`);

    // ---------- Tipos enumerados ----------
    await queryRunner.query(
      `CREATE TYPE "users_role_enum" AS ENUM ('cliente', 'especialista', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TYPE "users_level_enum" AS ENUM ('Bronce', 'Ámbar', 'Oro')`,
    );
    await queryRunner.query(
      `CREATE TYPE "specialists_status_enum" AS ENUM ('Disponible', 'En cita', 'Descanso')`,
    );
    await queryRunner.query(
      `CREATE TYPE "appointments_status_enum" AS ENUM ('pendiente', 'confirmada', 'completada', 'cancelada')`,
    );
    await queryRunner.query(
      `CREATE TYPE "promotions_color_enum" AS ENUM ('terracota', 'rosa', 'verde', 'dorado')`,
    );
    await queryRunner.query(
      `CREATE TYPE "notifications_type_enum" AS ENUM ('recordatorio', 'reserva', 'cancelacion', 'promocion', 'fidelidad', 'sistema')`,
    );

    // ---------- categories ----------
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(60) NOT NULL,
        "color" character varying(9) NOT NULL DEFAULT '#A98872',
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_categories_name" UNIQUE ("name")
      )
    `);

    // ---------- users ----------
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(120) NOT NULL,
        "email" character varying(160) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "phone" character varying(30) NOT NULL DEFAULT '',
        "city" character varying(120) NOT NULL DEFAULT 'Manta, Manabí',
        "role" "users_role_enum" NOT NULL DEFAULT 'cliente',
        "member_since" date NOT NULL DEFAULT CURRENT_DATE,
        "points" integer NOT NULL DEFAULT 0,
        "level" "users_level_enum" NOT NULL DEFAULT 'Bronce',
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "CHK_users_points_positive" CHECK ("points" >= 0)
      )
    `);

    // ---------- services ----------
    await queryRunner.query(`
      CREATE TABLE "services" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(120) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "category_id" uuid NOT NULL,
        "duration_min" integer NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "image_url" character varying(255) NOT NULL DEFAULT '',
        "popular" boolean NOT NULL DEFAULT false,
        "rating" numeric(2,1) NOT NULL DEFAULT 0,
        "reviews_count" integer NOT NULL DEFAULT 0,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_services" PRIMARY KEY ("id"),
        CONSTRAINT "FK_services_category" FOREIGN KEY ("category_id")
          REFERENCES "categories"("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_services_duration" CHECK ("duration_min" > 0),
        CONSTRAINT "CHK_services_price" CHECK ("price" >= 0)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_services_name" ON "services" ("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_services_active" ON "services" ("active")`,
    );

    // ---------- specialists ----------
    await queryRunner.query(`
      CREATE TABLE "specialists" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(120) NOT NULL,
        "role" character varying(120) NOT NULL DEFAULT '',
        "initials" character varying(4) NOT NULL DEFAULT '',
        "rating" numeric(2,1) NOT NULL DEFAULT 5,
        "status" "specialists_status_enum" NOT NULL DEFAULT 'Disponible',
        "active" boolean NOT NULL DEFAULT true,
        "user_id" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_specialists" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_specialists_user" UNIQUE ("user_id"),
        CONSTRAINT "FK_specialists_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_specialists_active" ON "specialists" ("active")`,
    );

    // ---------- specialist_categories (qué puede atender cada especialista) ----------
    await queryRunner.query(`
      CREATE TABLE "specialist_categories" (
        "specialist_id" uuid NOT NULL,
        "category_id" uuid NOT NULL,
        CONSTRAINT "PK_specialist_categories" PRIMARY KEY ("specialist_id", "category_id"),
        CONSTRAINT "FK_specialist_categories_specialist" FOREIGN KEY ("specialist_id")
          REFERENCES "specialists"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_specialist_categories_category" FOREIGN KEY ("category_id")
          REFERENCES "categories"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_specialist_categories_category" ON "specialist_categories" ("category_id")`,
    );

    // ---------- user_favorite_services ----------
    await queryRunner.query(`
      CREATE TABLE "user_favorite_services" (
        "user_id" uuid NOT NULL,
        "service_id" uuid NOT NULL,
        CONSTRAINT "PK_user_favorite_services" PRIMARY KEY ("user_id", "service_id"),
        CONSTRAINT "FK_user_favorite_services_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_favorite_services_service" FOREIGN KEY ("service_id")
          REFERENCES "services"("id") ON DELETE CASCADE
      )
    `);

    // ---------- appointments ----------
    await queryRunner.query(`
      CREATE TABLE "appointments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "client_id" uuid NOT NULL,
        "service_id" uuid NOT NULL,
        "specialist_id" uuid NOT NULL,
        "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "ends_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "duration_min" integer NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "status" "appointments_status_enum" NOT NULL DEFAULT 'pendiente',
        "notes" text NOT NULL DEFAULT '',
        "created_via" character varying(20) NOT NULL DEFAULT 'app',
        "cancelled_at" TIMESTAMP WITH TIME ZONE,
        "cancel_reason" character varying(255),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_appointments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_appointments_client" FOREIGN KEY ("client_id")
          REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_appointments_service" FOREIGN KEY ("service_id")
          REFERENCES "services"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_appointments_specialist" FOREIGN KEY ("specialist_id")
          REFERENCES "specialists"("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_appointments_duration" CHECK ("duration_min" > 0),
        CONSTRAINT "CHK_appointments_range" CHECK ("ends_at" > "starts_at")
      )
    `);

    // `ends_at` se calcula siempre en la base, nunca desde la aplicación: así
    // no puede quedar inconsistente con `starts_at` + `duration_min`, venga la
    // fila de la API, del seed o de una consulta manual.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION "appointments_set_ends_at"() RETURNS trigger AS $$
      BEGIN
        NEW."ends_at" := NEW."starts_at" + make_interval(mins => NEW."duration_min");
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      CREATE TRIGGER "trg_appointments_set_ends_at"
      BEFORE INSERT OR UPDATE OF "starts_at", "duration_min" ON "appointments"
      FOR EACH ROW EXECUTE FUNCTION "appointments_set_ends_at"()
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_starts_at" ON "appointments" ("starts_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_status" ON "appointments" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_specialist_starts" ON "appointments" ("specialist_id", "starts_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_client_starts" ON "appointments" ("client_id", "starts_at")`,
    );

    // Dos citas activas de la misma especialista no pueden solaparse.
    // Las canceladas y completadas quedan fuera: no ocupan agenda.
    //
    // El rango usa la columna `ends_at` y no `starts_at + interval` porque el
    // operador `timestamptz + interval` es STABLE (su resultado depende del
    // TimeZone de la sesión) y PostgreSQL sólo admite expresiones IMMUTABLE
    // dentro de un índice. `tstzrange(col, col)` sí lo es.
    await queryRunner.query(`
      ALTER TABLE "appointments"
      ADD CONSTRAINT "appointments_no_overlap"
      EXCLUDE USING gist (
        "specialist_id" WITH =,
        tstzrange("starts_at", "ends_at") WITH &&
      )
      WHERE ("status" IN ('pendiente', 'confirmada'))
    `);

    // ---------- reviews ----------
    await queryRunner.query(`
      CREATE TABLE "reviews" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "appointment_id" uuid NOT NULL,
        "client_id" uuid NOT NULL,
        "service_id" uuid NOT NULL,
        "rating" integer NOT NULL,
        "text" text NOT NULL DEFAULT '',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_reviews_appointment" UNIQUE ("appointment_id"),
        CONSTRAINT "FK_reviews_appointment" FOREIGN KEY ("appointment_id")
          REFERENCES "appointments"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reviews_client" FOREIGN KEY ("client_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reviews_service" FOREIGN KEY ("service_id")
          REFERENCES "services"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_reviews_rating" CHECK ("rating" >= 1 AND "rating" <= 5)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_reviews_service" ON "reviews" ("service_id")`,
    );

    // ---------- promotions ----------
    await queryRunner.query(`
      CREATE TABLE "promotions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" character varying(120) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "badge" character varying(12) NOT NULL DEFAULT '',
        "color" "promotions_color_enum" NOT NULL DEFAULT 'terracota',
        "valid_text" character varying(120) NOT NULL DEFAULT '',
        "price_before" numeric(10,2),
        "price_now" numeric(10,2),
        "image_url" character varying(255) NOT NULL DEFAULT '',
        "starts_at" TIMESTAMP WITH TIME ZONE,
        "ends_at" TIMESTAMP WITH TIME ZONE,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_promotions" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_promotions_dates" CHECK ("ends_at" IS NULL OR "starts_at" IS NULL OR "ends_at" >= "starts_at")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_promotions_active" ON "promotions" ("active")`,
    );

    await queryRunner.query(`
      CREATE TABLE "promotion_services" (
        "promotion_id" uuid NOT NULL,
        "service_id" uuid NOT NULL,
        CONSTRAINT "PK_promotion_services" PRIMARY KEY ("promotion_id", "service_id"),
        CONSTRAINT "FK_promotion_services_promotion" FOREIGN KEY ("promotion_id")
          REFERENCES "promotions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_promotion_services_service" FOREIGN KEY ("service_id")
          REFERENCES "services"("id") ON DELETE CASCADE
      )
    `);

    // ---------- notifications ----------
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "type" "notifications_type_enum" NOT NULL DEFAULT 'sistema',
        "icon" character varying(8) NOT NULL DEFAULT '',
        "title" character varying(120) NOT NULL,
        "text" text NOT NULL DEFAULT '',
        "read" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_read" ON "notifications" ("user_id", "read")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS "trg_appointments_set_ends_at" ON "appointments"`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS "appointments_set_ends_at"()`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "promotion_services"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "promotions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "appointments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_favorite_services"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "specialist_categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "specialists"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "services"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "notifications_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "promotions_color_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "appointments_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "specialists_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_level_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
  }
}
