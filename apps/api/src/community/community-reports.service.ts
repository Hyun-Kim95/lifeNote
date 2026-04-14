import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommunityReportTarget } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommunityReportDto } from './dto/create-community-report.dto';

const targetMap: Record<string, CommunityReportTarget> = {
  post: 'POST',
  comment: 'COMMENT',
};

@Injectable()
export class CommunityReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReport(reporterId: string, dto: CreateCommunityReportDto) {
    const targetType = targetMap[dto.targetType];

    if (dto.targetType === 'post') {
      const post = await this.prisma.communityPost.findUnique({
        where: { id: dto.targetId },
      });
      if (!post) {
        throw new NotFoundException({
          code: 'NOT_FOUND',
          message: '신고 대상 게시글을 찾을 수 없습니다.',
        });
      }
    } else {
      const comment = await this.prisma.communityComment.findUnique({
        where: { id: dto.targetId },
      });
      if (!comment) {
        throw new NotFoundException({
          code: 'NOT_FOUND',
          message: '신고 대상 댓글을 찾을 수 없습니다.',
        });
      }
    }

    try {
      const row = await this.prisma.communityReport.create({
        data: {
          reporterId,
          targetType,
          targetId: dto.targetId,
          reason: dto.reason ?? null,
        },
      });
      return {
        id: row.id,
        createdAt: row.createdAt.toISOString(),
      };
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException({
          code: 'CONFLICT',
          message: '이미 신고한 대상입니다.',
        });
      }
      throw e;
    }
  }
}
