import { Test, TestingModule } from '@nestjs/testing';
import { StudentProfileController } from './student-profile.controller';
import { StudentsService } from './students.service';
import { BadRequestException } from '@nestjs/common';

describe('StudentProfileController', () => {
  let controller: StudentProfileController;
  const mockService = { getMyProfile: jest.fn(), updatePhoto: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentProfileController],
      providers: [{ provide: StudentsService, useValue: mockService }],
    }).compile();
    controller = module.get(StudentProfileController);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(controller).toBeDefined());

  it('myProfile should delegate with userId', async () => {
    mockService.getMyProfile.mockResolvedValue({ id: 's1', fullName: 'Adi' });
    const result = await controller.myProfile({ user: { userId: 'u1' } });
    expect(mockService.getMyProfile).toHaveBeenCalledWith('u1');
    expect(result.fullName).toBe('Adi');
  });

  it('uploadPhoto reject invalid mimetype', async () => {
    await expect(controller.uploadPhoto({ user: { userId: 'u1' } }, { mimetype: 'text/plain', size: 10, originalname: 'a.txt', buffer: Buffer.from('x') } as any)).rejects.toThrow(BadRequestException);
  });

  it('uploadPhoto reject invalid image content', async () => {
    await expect(controller.uploadPhoto({ user: { userId: 'u1' } }, { mimetype: 'image/jpeg', size: 10, originalname: 'a.jpg', buffer: Buffer.from('not-an-image') } as any)).rejects.toThrow('Isi file foto tidak valid');
  });

  it('uploadPhoto accept valid jpeg', async () => {
    jest.spyOn(require('fs'), 'existsSync').mockReturnValue(true);
    jest.spyOn(require('fs'), 'unlinkSync').mockReturnValue(undefined);
    jest.spyOn(require('fs'), 'writeFileSync').mockReturnValue(undefined);
    mockService.updatePhoto.mockResolvedValue({});
    const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    const result = await controller.uploadPhoto({ user: { userId: 'u1' } }, { mimetype: 'image/jpeg', size: 4, originalname: 'a.jpg', buffer } as any);
    expect(result.photoUrl).toMatch(/^\/api\/uploads\/photos\//);
    expect(mockService.updatePhoto).toHaveBeenCalledWith('u1', expect.any(String));
  });
});
