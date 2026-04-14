import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureHttpApp } from './../src/app-bootstrap';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.JWT_SECRET =
      process.env.JWT_SECRET ??
      'e2e-test-jwt-secret-must-be-at-least-32-characters';
    process.env.GOOGLE_CLIENT_ID =
      process.env.GOOGLE_CLIENT_ID ?? 'e2e-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET =
      process.env.GOOGLE_CLIENT_SECRET ?? 'e2e-google-client-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        onModuleInit: async () => {},
        onModuleDestroy: async () => {},
        $connect: async () => {},
        $disconnect: async () => {},
        quoteBanner: {
          findMany: async () => [],
        },
        notice: {
          findMany: async () => [],
          count: async () => 0,
          findFirst: async () => null,
        },
        diaryTemplate: {
          findMany: async () => [],
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    configureHttpApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/v1 (GET)', () => {
    return request(app.getHttpServer())
      .get('/v1')
      .expect(200)
      .expect('Hello World!');
  });

  it('/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/v1/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('/v1/me (GET) without token → 401', () => {
    return request(app.getHttpServer())
      .get('/v1/me')
      .expect(401)
      .expect((res) => {
        expect(res.body?.error?.code).toBe('UNAUTHENTICATED');
      });
  });

  it('/v1/quote-banners/active (GET) — 비로그인', () => {
    return request(app.getHttpServer())
      .get('/v1/quote-banners/active')
      .expect(200)
      .expect({ items: [] });
  });

  it('/v1/notices (GET) — 비로그인', () => {
    return request(app.getHttpServer())
      .get('/v1/notices')
      .expect(200)
      .expect((res) => {
        expect(res.body.items).toEqual([]);
        expect(res.body.page).toBe(1);
        expect(res.body.totalCount).toBe(0);
      });
  });

  it('/v1/diary-templates (GET) — 비로그인', () => {
    return request(app.getHttpServer())
      .get('/v1/diary-templates')
      .expect(200)
      .expect({ items: [] });
  });

  it('/v1/community/posts (GET) without token → 401', () => {
    return request(app.getHttpServer())
      .get('/v1/community/posts')
      .expect(401)
      .expect((res) => {
        expect(res.body?.error?.code).toBe('UNAUTHENTICATED');
      });
  });
});
