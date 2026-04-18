import type { NavigatorScreenParams } from '@react-navigation/native';

export type CommunityPostParam = {
  id: string;
  title: string | null;
  body: string;
  authorDisplayName: string;
  createdAt: string;
};

export type RootStackParamList = {
  Login: undefined;
  DevToken: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  NoticeDetail: { id: string };
  CommunityPost: { post: CommunityPostParam };
};

export type MainTabParamList = {
  HomeTab: undefined;
  TodosTab:
    | {
        /** 할 일 탭 초기 범위(일·주·월). 구형 `initialSegment`도 일부 매핑됨 */
        initialScope?: 'day' | 'week' | 'month';
        initialSegment?: 'today' | 'week';
      }
    | undefined;
  FoodTab: undefined;
  MoreTab: undefined;
};

export type MoreStackParamList = {
  MoreMenu: undefined;
  Diary: undefined;
  Notices: undefined;
  Community: undefined;
  Stats: undefined;
  Settings: undefined;
  WeekPlan: undefined;
};
