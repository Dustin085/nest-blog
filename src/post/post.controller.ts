import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { PostService } from './post.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/auth.types';
import { UpdatePostDto } from './dto/update-post.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';
import { PostOwnerOrAdminGuard } from '../auth/guards/post-owner-or-admin.guard';
import { QueryPostDto } from './dto/query-post.dto';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';

@Controller('post')
export class PostController {
  constructor(private postService: PostService) {}

  // -- Post --
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  create(@Body() createPostDto: CreatePostDto, @CurrentUser() user: JwtUser) {
    return this.postService.create(createPostDto, user.id);
  }

  // -- Get --
  @Get()
  @UseGuards(OptionalJwtGuard)
  findAll(
    @Query() query: QueryPostDto,
    @CurrentUser() currentUser: JwtUser | null,
  ) {
    return this.postService.findAll(query, currentUser);
  }

  @Get(':id')
  @UseGuards(OptionalJwtGuard) // 有 token 就驗證，沒有也沒關係
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtUser | null,
  ) {
    return this.postService.findOnePublic(id, currentUser);
  }

  // -- Patch --
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), PostOwnerOrAdminGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postService.update(id, updatePostDto);
  }

  // -- Delete --
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), PostOwnerOrAdminGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postService.remove(id);
  }
}
