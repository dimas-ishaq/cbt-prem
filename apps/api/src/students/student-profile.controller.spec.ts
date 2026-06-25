import { Test, TestingModule } from '@nestjs/testing';
import { StudentProfileController } from './student-profile.controller';
import { StudentsService } from './students.service';

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
});
