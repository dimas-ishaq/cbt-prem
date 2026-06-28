import { PermissionsGuard } from './permissions.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';

describe('PermissionsGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
  const prisma = {
    userRole: {
      findMany: jest.fn(),
    },
  } as any;
  const guard = new PermissionsGuard(reflector, prisma);

  const ctx = (user: any) => ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as any;

  beforeEach(() => jest.clearAllMocks());

  it('allow when no required permissions', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    await expect(guard.canActivate(ctx({ userId: 'u1', role: 'SISWA' }))).resolves.toBe(true);
  });

  it('allow super admin bypass', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['ANY']);
    await expect(guard.canActivate(ctx({ userId: 'u1', role: 'SUPER_ADMIN' }))).resolves.toBe(true);
  });

  it('deny without permission', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['EXAM_EDIT']);
    prisma.userRole.findMany.mockResolvedValue([]);
    await expect(guard.canActivate(ctx({ userId: 'u1', role: 'GURU' }))).rejects.toThrow(ForbiddenException);
  });

  it('allow with permission', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['EXAM_EDIT']);
    prisma.userRole.findMany.mockResolvedValue([
      {
        role: { isActive: true, slug: 'teacher', permissions: [{ permission: { name: 'EXAM_EDIT' } }] },
      },
    ]);
    await expect(guard.canActivate(ctx({ userId: 'u1', role: 'GURU' }))).resolves.toBe(true);
  });
});