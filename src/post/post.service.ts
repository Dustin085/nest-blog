import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post, PostStatus } from './post.entity';
import { JwtUser } from '../auth/auth.types';
import { UserRole } from '../user/user.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}
  private readonly logger = new Logger(PostService.name);

  // -- create --
  async create(createPostDto: CreatePostDto, authorId: number) {
    const post = this.postRepository.create({
      ...createPostDto,
      authorId,
    });

    const saved = await this.postRepository.save(post);

    return this.findOne(saved.id);
  }

  // -- read --
  // 內部使用，不做草稿檢查，給 Service 內部和 Guard 用
  async findOne(id: number): Promise<Post> {
    const post = await this.postRepository
      .createQueryBuilder('post')
      .leftJoin('post.author', 'author')
      // 不將 author 的全部資訊都選出來
      .addSelect(['author.id', 'author.username'])
      .where('post.id = :id', { id })
      .getOne();

    if (!post) throw new NotFoundException(`找不到 id 為 ${id} 的 Post`);
    return post;
    // const post = await this.postRepository.findOne({ where: { id } });
    // if (!post) throw new NotFoundException(`找不到 id 為 ${id} 的 Post`);
    // return post;
  }

  // 對外使用，做草稿檢查，給 Controller 的 GET :id 用
  async findOnePublic(id: number, currentUser: JwtUser | null): Promise<Post> {
    this.logger.log(
      `使用者 ${currentUser?.id ?? '未登入'} Role: ${currentUser?.role ?? '未登入'} 正在使用 ${this.findOnePublic.name} 存取 Post ${id}`,
    );
    const post = await this.findOne(id); // 找不到直接拋 404

    if (post.status === PostStatus.DRAFT) {
      if (
        // 使用者未登入
        !currentUser ||
        // 使用者非 post 作者且不是 admin
        (currentUser.id !== post.author.id &&
          currentUser.role !== UserRole.ADMIN)
      ) {
        this.logger.warn(
          `使用者 ${currentUser?.id ?? '未登入'} 嘗試存取 草稿 Post ${id}`,
        );
        throw new NotFoundException(`找不到 id 為 ${id} 的 Post`); // 故意回 404
      }
    }

    return post;
  }

  async findAll(
    query: QueryPostDto,
    currentUser: JwtUser | null,
  ): Promise<{ data: Post[]; total: number; page: number; limit: number }> {
    const { search, status, page = 1, limit = 10 } = query;

    const qb = this.postRepository
      .createQueryBuilder('post')
      .leftJoin('post.author', 'author')
      .addSelect(['author.id', 'author.username'])
      .orderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('(post.title ILIKE :search OR post.content ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    // 草稿過濾
    this.applyStatusFilter(qb, status, currentUser);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  // -- update --
  async update(id: number, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(id);
    Object.assign(post, updatePostDto);
    await this.postRepository.save(post);
    return this.findOne(id);
  }

  // -- delete --
  async remove(id: number): Promise<void> {
    const post = await this.findOne(id);
    await this.postRepository.delete(post);
  }

  private applyStatusFilter(
    qb: SelectQueryBuilder<Post>,
    status: PostStatus | undefined,
    currentUser: JwtUser | null,
  ): void {
    switch (currentUser?.role) {
      case UserRole.ADMIN:
        // admin 可以看任何 post
        if (status) qb.andWhere('post.status = :status', { status });
        break;

      case UserRole.AUTHOR:
        if (status === PostStatus.DRAFT) {
          // 找所有自己的 draft
          qb.andWhere('(post.status = :draft AND post.authorId = :authorId)', {
            draft: PostStatus.DRAFT,
            authorId: currentUser.id,
          });
        } else if (status === PostStatus.PUBLISHED) {
          // 找所有 published post
          qb.andWhere('post.status = :status', { status });
        } else {
          // 找自己 draft + 所有 published post
          qb.andWhere(
            '(post.status = :published OR (post.status = :draft AND post.authorId = :authorId))',
            {
              published: PostStatus.PUBLISHED,
              draft: PostStatus.DRAFT,
              authorId: currentUser.id,
            },
          );
        }
        break;

      // UserRole 不是 author 或 admin => 未登入或 reader
      default:
        qb.andWhere({ status: PostStatus.PUBLISHED });
        break;
    }
  }
}
