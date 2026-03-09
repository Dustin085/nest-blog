import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PostStatus } from 'src/post/post.entity';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: '標題至少 2 個字元' })
  @MaxLength(100, { message: '標題最多 100 個字元' })
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10, { message: '內容至少 10 個字元' })
  content?: string;

  @IsOptional()
  @IsEnum(PostStatus, { message: '狀態只能是 draft 或 published' })
  status?: PostStatus;
}
