import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtUser } from 'src/auth/auth.types';
import { UserRole } from 'src/user/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // context.getHandler() => 執行路徑上的 method，例如 @Get(':id') findOne()的 findOne
    // context.getClass() => controller 本身
    const roles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles) return true; // 沒設定 Roles => 不限制

    const request = context
      .switchToHttp()
      .getRequest<Request & { user: JwtUser }>();
    const user = request.user;
    return roles.includes(user.role);
  }
}
