import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtUser } from '../auth.types';

export const CurrentUser = createParamDecorator(
  // data    → 使用 decorator 時傳入的參數，例如 @CurrentUser('email') => data === 'email'
  // ctx     → 當前請求的執行環境，可以從這裡取出 request 物件
  (data: unknown, ctx: ExecutionContext): JwtUser => {
    // 從執行環境(Nest 支援多種 transport)切換到 HTTP 情境，取出 Express 的 request 物件
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: JwtUser }>();
    return request.user;
  },
);
