import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from './../src/app.controller.js';
import { AppService } from './../src/app.service.js';

/**
 * Smoke E2E sin base de datos: verifica que el servidor HTTP
 * arranca y responde. Corre en cualquier entorno (`npm run test:e2e`
 * lo incluye junto a los flujos con DB).
 */
describe('Health (e2e, sin DB)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET) responde Hello World!', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
  });

  it('rutas inexistentes responden 404 JSON', () => {
    return request(app.getHttpServer()).get('/no-existe').expect(404);
  });

  afterAll(async () => {
    await app.close();
  });
});
