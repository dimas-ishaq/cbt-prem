import { RealtimeGateway } from './realtime.gateway';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleRef } from '@nestjs/core';

describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway;
  const jwtService = { verify: jest.fn() } as unknown as JwtService;
  const prisma = {
    student: { findUnique: jest.fn() },
    examSession: { findUnique: jest.fn(), update: jest.fn() },
    violation: { create: jest.fn() },
  } as unknown as PrismaService;
  const moduleRef = { get: jest.fn() } as unknown as ModuleRef;

  const client: any = {
    id: 'socket-1',
    handshake: { auth: { token: 'token' } },
    data: {},
    join: jest.fn(),
    disconnect: jest.fn(),
  };

  beforeEach(() => {
    gateway = new RealtimeGateway(jwtService, prisma, moduleRef);
    gateway.server = { to: jest.fn().mockReturnValue({ emit: jest.fn() }), emit: jest.fn() } as any;
    jest.clearAllMocks();
  });

  it('rejects invalid token on connection', async () => {
    (jwtService.verify as jest.Mock).mockImplementation(() => { throw new Error('bad'); });

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalled();
  });

  it('accepts valid token and joins user room', async () => {
    (jwtService.verify as jest.Mock).mockReturnValue({ userId: 'u1', username: 'Budi', role: 'SISWA' });

    await gateway.handleConnection(client);

    expect(client.join).toHaveBeenCalledWith('user_u1');
    expect(client.data.user.username).toBe('Budi');
  });

  it('joins exam room', async () => {
    client.data.user = { username: 'Budi', sub: 'u1' };

    await gateway.handleJoinExam(client, { examId: 'e1' });

    expect(client.join).toHaveBeenCalledWith('exam_e1');
  });

  it('blocks non-proctor from join_proctor', async () => {
    client.data.user = { role: 'SISWA', username: 'Budi' };

    await gateway.handleJoinProctor(client, { examId: 'e1' });

    expect(client.join).not.toHaveBeenCalled();
  });
});
