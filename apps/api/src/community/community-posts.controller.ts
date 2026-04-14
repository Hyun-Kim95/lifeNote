import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { CommunityPostsService } from './community-posts.service';
import { CreateCommunityCommentDto } from './dto/create-community-comment.dto';
import { CreateCommunityPostDto } from './dto/create-community-post.dto';
import { ListCommunityPostsQueryDto } from './dto/list-community-posts.query';

@Controller('community/posts')
@UseGuards(JwtAuthGuard)
export class CommunityPostsController {
  constructor(private readonly posts: CommunityPostsService) {}

  @Get()
  list(@Query() query: ListCommunityPostsQueryDto) {
    return this.posts.listPosts(query);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateCommunityPostDto) {
    return this.posts.createPost(user.userId, dto);
  }

  @Get(':postId/comments')
  listComments(@Param('postId') postId: string) {
    return this.posts.listComments(postId);
  }

  @Post(':postId/comments')
  createComment(
    @CurrentUser() user: RequestUser,
    @Param('postId') postId: string,
    @Body() dto: CreateCommunityCommentDto,
  ) {
    return this.posts.createComment(user.userId, postId, dto);
  }
}
