import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FoodScreen } from '../screens/FoodScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { PlanScreen } from '../screens/PlanScreen';
import { TodosScreen } from '../screens/TodosScreen';
import { useAppTheme } from '../theme/ThemeContext';
import { MoreStack } from './MoreStack';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: IconName, outline: IconName) {
  return function TabBarIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
    return <Ionicons name={focused ? name : outline} size={size} color={color} />;
  };
}

export function MainTabs() {
  const { colors, fonts, navigation } = useAppTheme();
  const insets = useSafeAreaInsets();
  const tabPaddingBottom = Math.max(insets.bottom, navigation.tabBarPaddingBottom);
  const tabBarHeight = navigation.tabBarHeight + tabPaddingBottom;
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.borderStrong,
          borderTopWidth: navigation.headerBorderWidth,
          height: tabBarHeight,
          paddingTop: navigation.tabBarPaddingTop,
          paddingBottom: tabPaddingBottom,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: navigation.tabBarLabelOffset,
        },
        tabBarIconStyle: {
          marginBottom: navigation.tabBarLabelOffset,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: {
          fontFamily: fonts.bodyMedium,
          fontSize: navigation.tabBarLabelSize,
          lineHeight: fonts.typography.badge.lineHeight,
          marginBottom: navigation.tabBarLabelOffset,
        },
        tabBarAllowFontScaling: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: '홈',
          tabBarIcon: tabIcon('home', 'home-outline'),
        }}
      />
      <Tab.Screen
        name="TodosTab"
        component={TodosScreen}
        options={{
          tabBarLabel: '할 일',
          tabBarIcon: tabIcon('checkbox', 'checkbox-outline'),
        }}
      />
      <Tab.Screen
        name="FoodTab"
        component={FoodScreen}
        options={{
          tabBarLabel: '식비',
          tabBarIcon: tabIcon('restaurant', 'restaurant-outline'),
        }}
      />
      <Tab.Screen
        name="PlanTab"
        component={PlanScreen}
        options={{
          tabBarLabel: '계획',
          tabBarIcon: tabIcon('calendar', 'calendar-outline'),
        }}
      />
      <Tab.Screen
        name="MoreTab"
        component={MoreStack}
        options={{
          tabBarLabel: '더보기',
          tabBarIcon: tabIcon('menu', 'menu-outline'),
        }}
      />
    </Tab.Navigator>
  );
}
