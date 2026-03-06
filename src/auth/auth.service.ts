import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from 'src/auth/dto/login.dto';
import { UserService } from 'src/user/user.service';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    // 1. 找使用者
    const user = await this.userService.findByEmailWithPassword(loginDto.email);
    if (!user) throw new UnauthorizedException('帳號或密碼錯誤');

    // 2. 比對密碼
    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('帳號或密碼錯誤');

    // 3. 簽發 JWT
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async getProfile(id: number) {
    return this.userService.findOne(id);
  }
}
