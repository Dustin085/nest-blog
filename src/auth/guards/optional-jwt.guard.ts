import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtUser } from '../auth.types';

@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  // 覆寫 handleRequest，token 無效或不存在時不拋錯，直接回傳 null，回傳值會被掛到 req.user
  handleRequest<TUser = JwtUser>(err: any, user: TUser) {
    return user || null;
  }
}
