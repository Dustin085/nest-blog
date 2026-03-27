import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from 'src/auth/auth.service';
import type { JwtUser, JwtUserWithRefreshToken } from 'src/auth/auth.types';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { LoginDto } from 'src/auth/dto/login.dto';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, // JS 無法存取
      secure: this.configService.get('NODE_ENV') === 'production', // production 才強制 HTTPS
      sameSite: 'strict', // 防止 CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7天，單位毫秒
      path: '/auth', // 只有 /auth 路由才會帶上這個 cookie
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    //         ↑ passthrough: true 讓 NestJS 繼續處理回傳值，不用手動 res.json()
  ) {
    const { accessToken, refreshToken } =
      await this.authService.login(loginDto);
    this.setRefreshTokenCookie(res, refreshToken);
    return { accessToken }; // 只把 accessToken 回傳給前端
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt-refresh'))
  async refresh(
    @CurrentUser() user: JwtUserWithRefreshToken,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.refresh(
      user.id,
      user.refreshToken,
    );
    this.setRefreshTokenCookie(res, refreshToken);
    return { accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  async logout(
    @CurrentUser() user: JwtUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.id);
    res.clearCookie('refreshToken', { path: '/auth' });
    return { message: '登出成功' };
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@CurrentUser() user: JwtUser) {
    return this.authService.getProfile(user.id);
  }
}
