import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtUser } from 'src/auth/auth.types';
import { UserRole } from 'src/user/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    if (!roles) return true; // 沒設定 Roles => 不限制

    const request = context
      .switchToHttp()
      .getRequest<Request & { user: JwtUser }>();
    const user = request.user;
    return roles.includes(user.role);
  }
}
