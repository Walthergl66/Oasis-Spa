import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1761790000000 implements MigrationInterface {
  name = 'InitialSchema1761790000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(
      `CREATE TYPE "public"."user_role" AS ENUM('customer', 'employee', 'admin', 'super_admin')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."appointment_status" AS ENUM('pending', 'confirmed', 'completed', 'cancelled', 'no_show')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notification_channel" AS ENUM('email', 'push', 'system', 'whatsapp')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notification_type" AS ENUM('appointment', 'reminder', 'payment', 'system')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."chat_sender" AS ENUM('user', 'bot')`,
    );

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL,
        "full_name" character varying(150) NOT NULL,
        "phone" character varying(20),
        "avatar_url" text,
        "role" "public"."user_role" NOT NULL DEFAULT 'customer',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_auth_users" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "service_categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(100) NOT NULL,
        "description" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_service_categories_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "system_settings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "key" character varying(100) NOT NULL,
        "value" text,
        "description" text,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_system_settings_key" UNIQUE ("key"),
        CONSTRAINT "PK_system_settings_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "spas" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(150) NOT NULL,
        "description" text,
        "address" text,
        "phone" character varying(20),
        "email" character varying(150),
        "logo_url" text,
        "opening_time" time,
        "closing_time" time,
        "owner_id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_spas_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_spas_owner" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "spa_images" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "spa_id" uuid NOT NULL,
        "image_url" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_spa_images_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_spa_images_spa" FOREIGN KEY ("spa_id") REFERENCES "spas"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "services" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "spa_id" uuid NOT NULL,
        "category_id" uuid,
        "name" character varying(150) NOT NULL,
        "description" text,
        "price" numeric(10,2) NOT NULL,
        "duration_minutes" integer NOT NULL,
        "image_url" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_services_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_services_spa" FOREIGN KEY ("spa_id") REFERENCES "spas"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_services_category" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "employees" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "spa_id" uuid NOT NULL,
        "specialty" character varying(150),
        "biography" text,
        "photo_url" text,
        "commission_percentage" numeric(5,2) NOT NULL DEFAULT '0',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_employees_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_employees_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_employees_spa" FOREIGN KEY ("spa_id") REFERENCES "spas"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "employee_availability" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "employee_id" uuid NOT NULL,
        "day_of_week" integer NOT NULL,
        "start_time" time NOT NULL,
        "end_time" time NOT NULL,
        "is_available" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_employee_availability_day_of_week" CHECK ("day_of_week" BETWEEN 0 AND 6),
        CONSTRAINT "PK_employee_availability_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_employee_availability_employee" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "appointments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "customer_id" uuid NOT NULL,
        "spa_id" uuid NOT NULL,
        "service_id" uuid NOT NULL,
        "employee_id" uuid,
        "appointment_date" date NOT NULL,
        "start_time" time NOT NULL,
        "end_time" time NOT NULL,
        "status" "public"."appointment_status" NOT NULL DEFAULT 'pending',
        "notes" text,
        "final_price" numeric(10,2),
        "payment_status" "public"."payment_status" NOT NULL DEFAULT 'pending',
        "booked_by_ai" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_appointments_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_appointments_customer" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_appointments_spa" FOREIGN KEY ("spa_id") REFERENCES "spas"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_appointments_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_appointments_employee" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "appointment_id" uuid NOT NULL,
        "amount" numeric(10,2) NOT NULL,
        "currency" character varying(10) NOT NULL DEFAULT 'USD',
        "payment_method" character varying(50),
        "payment_provider" character varying(50),
        "status" "public"."payment_status" NOT NULL DEFAULT 'pending',
        "transaction_reference" text,
        "paid_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payments_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payments_appointment" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "reviews" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "appointment_id" uuid NOT NULL,
        "customer_id" uuid NOT NULL,
        "spa_id" uuid NOT NULL,
        "rating" integer NOT NULL,
        "comment" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_reviews_appointment_id" UNIQUE ("appointment_id"),
        CONSTRAINT "CHK_reviews_rating" CHECK ("rating" BETWEEN 1 AND 5),
        CONSTRAINT "PK_reviews_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reviews_appointment" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_reviews_customer" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_reviews_spa" FOREIGN KEY ("spa_id") REFERENCES "spas"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "appointment_id" uuid,
        "type" "public"."notification_type" NOT NULL,
        "channel" "public"."notification_channel" NOT NULL,
        "title" character varying(150) NOT NULL,
        "message" text NOT NULL,
        "is_sent" boolean NOT NULL DEFAULT false,
        "is_read" boolean NOT NULL DEFAULT false,
        "sent_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_notifications_appointment" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "chat_sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "session_token" character varying(255),
        "started_at" TIMESTAMP NOT NULL DEFAULT now(),
        "ended_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chat_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_chat_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "chat_messages" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "session_id" uuid NOT NULL,
        "sender" "public"."chat_sender" NOT NULL,
        "message" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chat_messages_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_chat_messages_session" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "favorites" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "spa_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_favorites_user_spa" UNIQUE ("user_id", "spa_id"),
        CONSTRAINT "PK_favorites_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_favorites_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_favorites_spa" FOREIGN KEY ("spa_id") REFERENCES "spas"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_appointments_customer" ON "appointments" ("customer_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_appointments_spa" ON "appointments" ("spa_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_appointments_employee" ON "appointments" ("employee_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notifications_user" ON "notifications" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_chat_sessions_user" ON "chat_sessions" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_chat_sessions_user"`);
    await queryRunner.query(`DROP INDEX "public"."idx_notifications_user"`);
    await queryRunner.query(`DROP INDEX "public"."idx_appointments_employee"`);
    await queryRunner.query(`DROP INDEX "public"."idx_appointments_spa"`);
    await queryRunner.query(`DROP INDEX "public"."idx_appointments_customer"`);

    await queryRunner.query(`DROP TABLE "favorites"`);
    await queryRunner.query(`DROP TABLE "chat_messages"`);
    await queryRunner.query(`DROP TABLE "chat_sessions"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "reviews"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TABLE "appointments"`);
    await queryRunner.query(`DROP TABLE "employee_availability"`);
    await queryRunner.query(`DROP TABLE "employees"`);
    await queryRunner.query(`DROP TABLE "services"`);
    await queryRunner.query(`DROP TABLE "spa_images"`);
    await queryRunner.query(`DROP TABLE "spas"`);
    await queryRunner.query(`DROP TABLE "system_settings"`);
    await queryRunner.query(`DROP TABLE "service_categories"`);
    await queryRunner.query(`DROP TABLE "users"`);

    await queryRunner.query(`DROP TYPE "public"."chat_sender"`);
    await queryRunner.query(`DROP TYPE "public"."notification_type"`);
    await queryRunner.query(`DROP TYPE "public"."notification_channel"`);
    await queryRunner.query(`DROP TYPE "public"."payment_status"`);
    await queryRunner.query(`DROP TYPE "public"."appointment_status"`);
    await queryRunner.query(`DROP TYPE "public"."user_role"`);
  }
}
