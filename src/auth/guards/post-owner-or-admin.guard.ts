import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PostService } from '../../post/post.service';
import { UserRole } from '../../user/user.entity';
import { Request } from 'express';
import { JwtUser } from '../auth.types';

@Injectable()
export class PostOwnerOrAdminGuard implements CanActivate {
  constructor(private postService: PostService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: JwtUser; params: { id: string } }>();
    const currentUser = request.user;
    const postId = parseInt(request.params.id);

    const post = await this.postService.findOne(postId);
    if (!post) throw new NotFoundException(`找不到 id 為 ${postId} 的 Post`);
    if (currentUser.role === UserRole.ADMIN) return true;
    if (post.author.id === currentUser.id) return true;

    throw new ForbiddenException('無法操作他人的文章');
  }
}
