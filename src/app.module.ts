import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { PostModule } from './post/post.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 所有模組都能讀取 .env
    }),
    // 建立 database connection（DataSource）
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'], // 有可能因為路徑問題找不到 entity
        // autoLoadEntities: true, // 可以考慮使用這行取代上一行，會在 TypeOrmModule.forFeature([User]) 時自動將 entity 加入 dataSource
        synchronize: true, // 開發用，上線前要關掉
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    PostModule,
  ],
  controllers: [AppController],
  providers: [AppService], // 在這個模組裡註冊可以被注入的東西
})
export class AppModule {}
