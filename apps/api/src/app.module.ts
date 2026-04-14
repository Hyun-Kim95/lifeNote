import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BudgetsModule } from './budgets/budgets.module';
import { CommunityModule } from './community/community.module';
import { DiariesModule } from './diaries/diaries.module';
import { HomeModule } from './home/home.module';
import { NoticesModule } from './notices/notices.module';
import { PlansModule } from './plans/plans.module';
import { PrismaModule } from './prisma/prisma.module';
import { QuoteBannersModule } from './quote-banners/quote-banners.module';
import { StatsModule } from './stats/stats.module';
import { TodosModule } from './todos/todos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    PrismaModule,
    AdminModule,
    AuthModule,
    TodosModule,
    BudgetsModule,
    DiariesModule,
    CommunityModule,
    HomeModule,
    QuoteBannersModule,
    PlansModule,
    NoticesModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
