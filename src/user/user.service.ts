import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import { SafeUser } from './user.types';

/*
  目前是直接使用 typeorm 提供的 Repo ，大專案可以再自行多封裝一層 UserRepository
*/

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // -- create --
  async create(createUserDto: CreateUserDto): Promise<SafeUser> {
    // 檢查是否已註冊過
    const existing = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existing) throw new ConflictException('此 Email 已被註冊');

    // 存 hash 過的密碼進資料庫
    const hashed = await bcrypt.hash(createUserDto.password, 10); // 10 是 saltRounds，數字越高加密越安全但越慢，10 是業界標準值。

    // create — 只在記憶體建立物件，還沒進資料庫
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashed,
    });

    // save — 真正寫進資料庫
    const saved = await this.userRepository.save(user);

    // 重新從資料庫查，讓 select: false 生效
    return this.findOne(saved.id);
  }

  // -- read --
  async findAll(): Promise<SafeUser[]> {
    return this.userRepository.find();
  }

  async findOne(id: number): Promise<SafeUser> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`找不到 id 為 ${id} 的使用者`);
    return user;
  }

  async findByEmail(email: string): Promise<SafeUser | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  // 會明確取出使用者的 password，可用來做密碼驗證
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByIdWithRefreshToken(id: number): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.refreshToken')
      .where('user.id = :id', { id })
      .getOne();
  }

  // -- update --
  async update(id: number, updateUserDto: UpdateUserDto): Promise<SafeUser> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // 以 dto 的 value 覆蓋 user (mutate)
    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    return this.findOne(id); // 重新查詢，select: false 生效
  }

  async updateRefreshToken(
    id: number,
    refreshToken: string | null,
  ): Promise<void> {
    const hashed = refreshToken ? await bcrypt.hash(refreshToken, 10) : null;
    await this.userRepository.update(id, { refreshToken: hashed });
  }

  // -- delete --
  async remove(id: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`找不到 id 為 ${id} 的使用者`);
    await this.userRepository.delete(id);
  }
}
