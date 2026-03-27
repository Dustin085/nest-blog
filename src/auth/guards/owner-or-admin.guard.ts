import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtUser } from 'src/auth/auth.types';
import { UserRole } from 'src/user/user.entity';

@Injectable()
export class OwnerOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: JwtUser; params: { id: string } }>();
    const currentUser = request.user;
    const targetId = parseInt(request.params.id);

    if (currentUser.role === UserRole.ADMIN) return true;
    if (currentUser.id === targetId) return true;

    throw new ForbiddenException('無法操作他人資料');
  }
}
