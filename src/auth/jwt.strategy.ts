import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private userService: UserService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined!');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  // validate() 會在 signature 驗證成功後被呼叫
  async validate(payload: { sub: number; email: string; role: string }) {
    // 從資料庫中再次取得使用者資料，可確認使用者權限在上次 JWT 簽發後是否有被更動
    const user = await this.userService.findOne(payload.sub);
    if (!user) throw new UnauthorizedException();
    return { id: user.id, email: user.email, role: user.role };
  }
}
