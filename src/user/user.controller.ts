import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { OwnerOrAdminGuard } from 'src/auth/guards/owner-or-admin.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UpdateUserDto } from 'src/user/dto/update-user.dto';
import { UserRole } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  // 公開：註冊不需要登入
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  // 本人或 Admin
  @Patch(':id') // Patch 代表 partial update ， put 代表 replace
  @UseGuards(AuthGuard('jwt'), OwnerOrAdminGuard)
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  // 只有 admin
  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.userService.findAll();
  }

  // 本人或 Admin
  @Get(':id')
  @UseGuards(AuthGuard('jwt'), OwnerOrAdminGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  // 本人或 Admin
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), OwnerOrAdminGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
