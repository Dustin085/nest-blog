import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin', // 管理所有文章、刪除任何留言、管理使用者
  AUTHOR = 'author', // 瀏覽文章、發留言，CRUD自己的文章
  READER = 'reader', // 可瀏覽文章、發留言
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ select: false }) // 查詢時預設不帶出 password ，需要時才明確指定要
  password: string;

  @Column()
  username: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.READER })
  role: UserRole;

  @Column({ type: 'text', nullable: true, select: false })
  refreshToken: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
