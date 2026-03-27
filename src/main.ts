import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.useGlobalPipes(
    // 使用者送來的欄位如果沒有被限制，可能會修改本來不該被修改的資料。
    // 例如直接修改 User 裡面的 role
    new ValidationPipe({
      whitelist: true, // 自動移除 FRO 沒定義的多餘欄位
      forbidNonWhitelisted: true, // 有多餘欄位直接報錯
      transform: true, // 自動轉換型別
    }),
  );

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
