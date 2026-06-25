import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';

describe('ExamsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Build testing module with actual app
    const moduleFixture: TestingModule = await Test.createTestingModule({
      // Real AppModule would be imported here
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/POST exams (success)', () => {
    return request(app.getHttpServer())
      .post('/exams')
      .set('Authorization', 'Bearer teacher-jwt')
      .send({
        title: 'Ujian Baru',
        description: 'Deskripsi',
        subjectId: 'subject-1',
        duration: 60,
        startTime: '2026-06-26T08:00:00.000Z',
        endTime: '2026-06-26T09:00:00.000Z',
        questionIds: ['q1', 'q2'],
        rombelIds: ['r1'],
      })
      .expect(201);
  });

  it('/POST exams (reject no questions)', () => {
    return request(app.getHttpServer())
      .post('/exams')
      .set('Authorization', 'Bearer teacher-jwt')
      .send({
        title: 'Invalid',
        questionIds: [],
      })
      .expect(400);
  });

  it('/POST exams (reject no rombel)', () => {
    return request(app.getHttpServer())
      .post('/exams')
      .set('Authorization', 'Bearer teacher-jwt')
      .send({
        title: 'Invalid',
        questionIds: ['q1'],
        rombelIds: [],
      })
      .expect(400);
  });
});