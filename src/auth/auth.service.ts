import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from 'src/auth/dto/login.dto';
import { UserService } from 'src/user/user.service';
import bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private async generateTokens(userId: number, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET') as string,
        expiresIn: this.configService.get<string>(
          'ACCESS_TOKEN_EXPIRES_IN',
        ) as StringValue,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>(
          'REFRESH_TOKEN_SECRET',
        ) as string,
        expiresIn: this.configService.get<string>(
          'REFRESH_TOKEN_EXPIRES_IN',
        ) as StringValue,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async login(loginDto: LoginDto) {
    // 1. 找使用者
    const user = await this.userService.findByEmailWithPassword(loginDto.email);
    if (!user) throw new UnauthorizedException('帳號或密碼錯誤');

    // 2. 比對密碼
    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('帳號或密碼錯誤');

    // 3. 產生 token
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // 4. 更新 資料庫的 refreshToken
    await this.userService.updateRefreshToken(user.id, tokens.refreshToken);

    // 5. 簽發 JWT
    return tokens;
  }

  async refresh(userId: number, refreshToken: string) {
    // 找出有 refreshToken 的 user
    const user = await this.userService.findByIdWithRefreshToken(userId);
    if (!user || !user.refreshToken)
      throw new UnauthorizedException('無效的 Refresh Token');

    // 比對 refreshToken
    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isMatch) throw new UnauthorizedException('無效的 Refresh Token');

    // 簽發新的 tokens（Refresh Token Rotation）
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.userService.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: number): Promise<void> {
    // 把資料庫的 refreshToken 清掉
    await this.userService.updateRefreshToken(userId, null);
  }

  async getProfile(id: number) {
    return this.userService.findOne(id);
  }
}
