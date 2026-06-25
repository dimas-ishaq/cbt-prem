import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import * as request from 'supertest';
import { MajorsController } from '../src/majors/majors.controller';
import { MajorsService } from '../src/majors/majors.service';

@Injectable()
class AllowAllGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

describe('MajorsController (light e2e)', () => {
  let app: INestApplication;
  const majorsServiceMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MajorsController],
      providers: [{ provide: MajorsService, useValue: majorsServiceMock }],
    })
      .overrideGuard(AllowAllGuard)
      .useClass(AllowAllGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /majors returns data and total', async () => {
    majorsServiceMock.findAll.mockResolvedValue({
      data: [{ id: 'm1', name: 'IPA', code: 'IPA' }],
      total: 1,
    });

    const response = await request(app.getHttpServer()).get('/majors').expect(200);

    expect(response.body).toEqual({
      data: [{ id: 'm1', name: 'IPA', code: 'IPA' }],
      total: 1,
    });
  });

  it('POST /majors creates a major', async () => {
    majorsServiceMock.create.mockResolvedValue({
      id: 'm2',
      name: 'IPS',
      code: 'IPS',
      description: 'Ilmu Pengetahuan Sosial',
    });

    const response = await request(app.getHttpServer())
      .post('/majors')
      .send({ name: 'IPS', code: 'ips', description: 'Ilmu Pengetahuan Sosial' })
      .expect(201);

    expect(response.body).toEqual({
      id: 'm2',
      name: 'IPS',
      code: 'IPS',
      description: 'Ilmu Pengetahuan Sosial',
    });
  });

  it('GET /majors/:id returns major detail', async () => {
    majorsServiceMock.findOne.mockResolvedValue({ id: 'm1', name: 'IPA', students: [] });

    const response = await request(app.getHttpServer()).get('/majors/m1').expect(200);

    expect(response.body).toEqual({ id: 'm1', name: 'IPA', students: [] });
  });

  it('PUT /majors/:id updates major', async () => {
    majorsServiceMock.update.mockResolvedValue({ id: 'm1', name: 'IPA Updated', code: 'IPA' });

    const response = await request(app.getHttpServer())
      .put('/majors/m1')
      .send({ name: 'IPA Updated' })
      .expect(200);

    expect(response.body).toEqual({ id: 'm1', name: 'IPA Updated', code: 'IPA' });
  });

  it('DELETE /majors/:id deletes major', async () => {
    majorsServiceMock.remove.mockResolvedValue({ success: true, message: 'Jurusan berhasil dihapus' });

    const response = await request(app.getHttpServer()).delete('/majors/m1').expect(200);

    expect(response.body).toEqual({ success: true, message: 'Jurusan berhasil dihapus' });
  });
});
