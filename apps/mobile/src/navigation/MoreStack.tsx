import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppTheme } from '../theme/ThemeContext';
import { CommunityScreen } from '../screens/CommunityScreen';
import { DiaryScreen } from '../screens/DiaryScreen';
import { MoreMenuScreen } from '../screens/MoreMenuScreen';
import { NoticesScreen } from '../screens/NoticesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { PlanScreen } from '../screens/PlanScreen';
import type { MoreStackParamList } from './types';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreStack() {
  const { colors, resolved, fonts } = useAppTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.text,
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerShadowVisible: true,
        contentStyle: { backgroundColor: colors.bg },
        headerTitleStyle: {
          color: colors.text,
          fontFamily: fonts.titleSemi,
          fontSize: fonts.typography.label.fontSize,
        },
        headerTitleAlign: 'center',
        statusBarStyle: resolved === 'dark' ? 'light' : 'dark',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MoreMenu" component={MoreMenuScreen} options={{ title: '더보기' }} />
      <Stack.Screen name="Diary" component={DiaryScreen} options={{ title: '일기' }} />
      <Stack.Screen name="Notices" component={NoticesScreen} options={{ title: '공지' }} />
      <Stack.Screen name="Community" component={CommunityScreen} options={{ title: '커뮤니티' }} />
      <Stack.Screen name="Stats" component={StatsScreen} options={{ title: '통계' }} />
      <Stack.Screen name="WeekPlan" component={PlanScreen} options={{ title: '주간 계획' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: '설정' }} />
    </Stack.Navigator>
  );
}
