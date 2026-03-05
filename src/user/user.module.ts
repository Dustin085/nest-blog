import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // 註冊 Entity
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
