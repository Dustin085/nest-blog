import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: (req: Request) => {
        const cookies = req.cookies as Record<string, string | undefined>;
        const refreshToken = cookies.refreshToken;
        return typeof refreshToken === 'string' ? refreshToken : null;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('REFRESH_TOKEN_SECRET') as string,
      passReqToCallback: true, // 讓 validate 可以拿到原始 request
    });
  }

  validate(
    req: Request,
    payload: { sub: number; email: string; role: string },
  ) {
    const cookies = req.cookies as Record<string, string | undefined>;
    const refreshToken = cookies.refreshToken;
    if (!refreshToken) throw new UnauthorizedException('找不到 Refresh Token');

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      refreshToken,
    };
  }
}
