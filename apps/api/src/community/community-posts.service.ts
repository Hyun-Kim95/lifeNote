import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommunityCommentDto } from './dto/create-community-comment.dto';
import { CreateCommunityPostDto } from './dto/create-community-post.dto';
import { ListCommunityPostsQueryDto } from './dto/list-community-posts.query';

@Injectable()
export class CommunityPostsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPosts(q: ListCommunityPostsQueryDto) {
    const page = q.page ?? 1;
    const pageSize = Math.min(50, Math.max(1, q.pageSize ?? 20));
    const where = {};

    const [totalCount, rows] = await Promise.all([
      this.prisma.communityPost.count({ where }),
      this.prisma.communityPost.findMany({
        where,
        include: {
          author: { select: { id: true, displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: rows.map((p) => ({
        id: p.id,
        title: p.title,
        body: p.body,
        author: {
          id: p.author.id,
          displayName: p.author.displayName,
        },
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      page,
      pageSize,
      totalCount,
    };
  }

  async createPost(authorId: string, dto: CreateCommunityPostDto) {
    const p = await this.prisma.communityPost.create({
      data: {
        authorId,
        title: dto.title ?? null,
        body: dto.body,
      },
      include: {
        author: { select: { id: true, displayName: true } },
      },
    });
    return {
      id: p.id,
      title: p.title,
      body: p.body,
      author: {
        id: p.author.id,
        displayName: p.author.displayName,
      },
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  async listComments(postId: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: '게시글을 찾을 수 없습니다.',
      });
    }

    const rows = await this.prisma.communityComment.findMany({
      where: { postId },
      include: {
        author: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      items: rows.map((c) => ({
        id: c.id,
        body: c.body,
        author: {
          id: c.author.id,
          displayName: c.author.displayName,
        },
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    };
  }

  async createComment(
    authorId: string,
    postId: string,
    dto: CreateCommunityCommentDto,
  ) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: '게시글을 찾을 수 없습니다.',
      });
    }

    const c = await this.prisma.communityComment.create({
      data: {
        postId,
        authorId,
        body: dto.body,
      },
      include: {
        author: { select: { id: true, displayName: true } },
      },
    });

    return {
      id: c.id,
      body: c.body,
      author: {
        id: c.author.id,
        displayName: c.author.displayName,
      },
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }
}
