import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { User, UserRole } from 'src/user/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcrypt';

// 模擬 Repository，不真正連資料庫
const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
};

const mockUser: User = {
  id: 1,
  email: 'alice@gmail.com',
  password: 'hashed_password',
  username: 'Alice',
  role: UserRole.READER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUserWithoutPassword: Omit<User, 'password'> = {
  id: 1,
  email: 'alice@gmail.com',
  username: 'Alice',
  role: UserRole.READER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  // -- create --
  describe('create', () => {
    it('應該成功建立使用者', async () => {
      mockUserRepository.create.mockReturnValue(mockUser); // 在記憶體中建立 entity
      mockUserRepository.save.mockResolvedValue({ id: 1 }); // 因為接下來只會用到 id 所以只回傳 id
      mockUserRepository.findOne
        .mockResolvedValueOnce(null) // 第一次：檢查 email
        .mockResolvedValueOnce(mockUserWithoutPassword); // 第二次：create 後查詢 ， findOne 因為 @Column({ select: false }) 所以不會帶出 password

      const result = await service.create({
        email: 'alice@gmail.com',
        password: '12345678',
        username: 'Alice',
      });

      expect(result.email).toBe('alice@gmail.com');
      expect(result.password).toBeUndefined(); // password 不應該回傳
    });

    it('重複 email 應該拋出 ConflictException', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUserWithoutPassword); // 假設 email 已存在

      await expect(
        service.create({
          email: 'alice@gmail.com',
          password: '12345678',
          username: 'Alice',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('密碼應該被 hash 過才存入', async () => {
      const hashSpy = jest.spyOn(bcrypt, 'hash');
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue({ id: 1 });
      mockUserRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUserWithoutPassword);

      await service.create({
        email: 'alice@gmail.com',
        password: '12345678',
        username: 'Alice',
      });

      expect(hashSpy).toHaveBeenCalledWith('12345678', 10);
    });
  });

  // -- findOne --
  describe('findOne', () => {
    it('應該回傳找到的使用者', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUserWithoutPassword);

      const testId = 1;
      const result = await service.findOne(testId);
      expect(result).toEqual(mockUserWithoutPassword);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: testId },
      });
    });

    it('找不到時應該拋出 NotFoundException', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const testId = 999;
      await expect(service.findOne(testId)).rejects.toThrow(NotFoundException);
    });
  });

  // -- update --
  describe('update', () => {
    it('應該成功更新使用者名稱', async () => {
      const updated: Omit<User, 'password'> = {
        ...mockUserWithoutPassword,
        username: 'NewAlice',
      };
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUserWithoutPassword)
        .mockResolvedValueOnce(updated);
      mockUserRepository.save.mockResolvedValue(undefined);

      const mockUserId = 1;
      const result = await service.update(mockUserId, { username: 'NewAlice' });
      expect(result.username).toBe('NewAlice');
      expect(result.password).toBeUndefined();
    });

    it('更新密碼時應該重新 hash', async () => {
      const hashSpy = jest.spyOn(bcrypt, 'hash');
      mockUserRepository.findOne.mockResolvedValue(mockUserWithoutPassword);
      mockUserRepository.save.mockResolvedValue(mockUserWithoutPassword);

      const mockUserId = 1;
      await service.update(mockUserId, { password: 'new-password' });
      expect(hashSpy).toHaveBeenCalledWith('new-password', 10);
    });
  });

  // -- remove --
  describe('remove', () => {
    it('應該成功刪除使用者', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUserWithoutPassword);
      mockUserRepository.remove.mockResolvedValue(undefined);

      const mockUserId = 1;
      await expect(service.remove(mockUserId)).resolves.not.toThrow();
      expect(mockUserRepository.remove).toHaveBeenCalledWith(
        mockUserWithoutPassword,
      );
    });

    it('找不到使用者時應該拋出 NotFoundException', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
