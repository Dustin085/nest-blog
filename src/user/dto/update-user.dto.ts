import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: '使用者名稱至少 2 個字元' })
  @MaxLength(20, { message: '使用者名稱最多 20 個字元' })
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: '密碼至少 8 個字元' })
  @MaxLength(32, { message: '密碼最多 32 個字元' })
  password?: string;
}
