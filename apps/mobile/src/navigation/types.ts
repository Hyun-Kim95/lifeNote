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
  TodosTab: undefined;
  FoodTab: undefined;
  PlanTab: undefined;
  MoreTab: undefined;
};

export type MoreStackParamList = {
  MoreMenu: undefined;
  Diary: undefined;
  Notices: undefined;
  Community: undefined;
  Stats: undefined;
  Settings: undefined;
};
