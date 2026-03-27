import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { PostOwnerOrAdminGuard } from '../auth/guards/post-owner-or-admin.guard';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Post])],
  controllers: [PostController],
  providers: [PostService, PostOwnerOrAdminGuard, OptionalJwtGuard],
  exports: [PostService],
})
export class PostModule {}
