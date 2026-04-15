import { NavigationContainer, DefaultTheme, DarkTheme, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { useAppTheme } from '../theme/ThemeContext';
import { CommunityPostScreen } from '../screens/CommunityPostScreen';
import { DevTokenScreen } from '../screens/DevTokenScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { NoticeDetailScreen } from '../screens/NoticeDetailScreen';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { ready, session } = useAuth();
  const { colors, resolved, fonts } = useAppTheme();
  const sharedHeaderOptions = {
    headerTintColor: colors.text,
    headerStyle: {
      backgroundColor: colors.card,
    },
    headerShadowVisible: true,
    headerTitleStyle: {
      color: colors.text,
      fontFamily: fonts.titleSemi,
      fontSize: fonts.typography.label.fontSize,
    },
    headerTitleAlign: 'center' as const,
  };

  const navTheme: Theme = useMemo(() => {
    const base = resolved === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.bg,
        card: colors.card,
        text: colors.text,
        border: colors.borderStrong,
        notification: colors.error,
      },
    };
  }, [colors, resolved]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {!session ? (
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            statusBarStyle: resolved === 'dark' ? 'light' : 'dark',
            animation: 'fade',
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          {__DEV__ ? (
            <Stack.Screen
              name="DevToken"
              component={DevTokenScreen}
              options={{
                ...sharedHeaderOptions,
                headerShown: true,
                title: '개발자',
              }}
            />
          ) : null}
        </Stack.Navigator>
      ) : (
        <Stack.Navigator
          screenOptions={{
            ...sharedHeaderOptions,
            contentStyle: { backgroundColor: colors.bg },
            statusBarStyle: resolved === 'dark' ? 'light' : 'dark',
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="NoticeDetail" component={NoticeDetailScreen} options={{ title: '공지사항' }} />
          <Stack.Screen name="CommunityPost" component={CommunityPostScreen} options={{ title: '게시글' }} />
          {__DEV__ ? (
            <Stack.Screen name="DevToken" component={DevTokenScreen} options={{ title: '개발자 토큰' }} />
          ) : null}
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
