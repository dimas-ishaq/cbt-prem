import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
  const guard = new RolesGuard(reflector);

  const ctx = (role: string | undefined) =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
    }) as any;

  beforeEach(() => jest.clearAllMocks());

  it('allow when no required roles', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    expect(guard.canActivate(ctx('SISWA'))).toBe(true);
  });

  it('deny when role mismatch', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['GURU']);
    expect(guard.canActivate(ctx('SISWA'))).toBe(false);
  });

  it('allow when role match', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      'GURU',
      'SISWA',
    ]);
    expect(guard.canActivate(ctx('SISWA'))).toBe(true);
  });
});
