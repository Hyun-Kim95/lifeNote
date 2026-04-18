import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import { useApi } from '../api/useApi';
import {
  Body,
  Card,
  ErrorText,
  LoadingBlock,
  Muted,
  PrimaryButton,
  ScreenScroll,
  SectionLabel,
  Title,
} from '../components/Ui';
import { toYmd } from '../lib/week';
import { useAppTheme } from '../theme/ThemeContext';

type HomeSummary = {
  date: string;
  quoteBanner: { id: string; text: string; source: string } | null;
  todo: { completed: number; total: number; percent: number };
  foodBudget: {
    budgetAmount: number;
    spentAmount: number;
    remainingAmount: number;
    todaySpentAmount: number;
  };
};

type TodoRow = {
  id: string;
  done: boolean;
};

export function HomeScreen() {
  const { colors, fonts, spacing, radius, icon } = useAppTheme();
  const { requestJson } = useApi();
  const navigation = useNavigation();
  const [data, setData] = useState<HomeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const todayKey = toYmd(new Date());
      const [h, t] = await Promise.all([
        requestJson<HomeSummary>('/v1/home/summary'),
        requestJson<{ items: TodoRow[]; stats?: { completed: number; total: number } }>(
          `/v1/todos?date=${todayKey}&limit=50&status=all`,
        ),
      ]);
      const items = t.items ?? [];
      const total = t.stats?.total ?? items.length;
      const completed = t.stats?.completed ?? items.filter((item) => item.done).length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      setData({
        ...h,
        todo: {
          total,
          completed,
          percent,
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [requestJson]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  const openTab = (tab: 'TodosTab' | 'FoodTab') => {
    const nav = navigation as { navigate?: (name: string, params?: object) => void };
    nav.navigate?.(tab);
  };

  const openMore = (screen: 'Diary' | 'Notices' | 'Stats') => {
    const nav = navigation as {
      navigate?: (name: string, params?: { screen?: string }) => void;
    };
    nav.navigate?.('MoreTab', { screen });
  };

  const todoPercent = data?.todo.percent ?? 0;
  const todoTotal = data?.todo.total ?? 0;
  const todoCompleted = data?.todo.completed ?? 0;
  const todoRemaining = Math.max(todoTotal - todoCompleted, 0);
  const todoStatusMessage =
    todoRemaining === 0
      ? '오늘 할 일을 모두 마쳤어요.'
      : `남은 할 일 ${todoRemaining}개를 확인하세요.`;
  const progressRatio = todoTotal > 0 ? Math.min(todoCompleted / todoTotal, 1) : 0;
  const progressSize = 108;
  const progressStroke = 8;
  const progressRadius = (progressSize - progressStroke) / 2;
  const progressCircumference = 2 * Math.PI * progressRadius;
  const progressOffset = progressCircumference * (1 - progressRatio);

  if (loading && !data) {
    return (
      <ScreenScroll>
        <LoadingBlock />
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll
      contentContainerStyle={[styles.scroll, { backgroundColor: colors.bg }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Card
        style={{
          ...styles.quoteCard,
          backgroundColor: colors.primaryTint,
          marginTop: spacing.xl,
        }}
      >
        <Body style={styles.quoteText}>{`"${data?.quoteBanner?.text ?? '작은 성취가 모여 큰 변화를 만듭니다.'}"`}</Body>
        <Muted>{data?.quoteBanner?.source ? `- ${data.quoteBanner.source}` : '- lifeNote'}</Muted>
      </Card>
      <Card style={{ gap: spacing.sm }}>
        <View style={styles.summaryHeader}>
          <View
            style={[
              styles.todoCheckWrap,
              { borderColor: colors.primary, borderRadius: radius.round, backgroundColor: colors.card },
            ]}
          >
            <Ionicons name="checkmark" size={icon.sm} color={colors.primary} />
          </View>
          <SectionLabel>오늘의 할 일</SectionLabel>
        </View>
        <View style={styles.todoProgressCircleWrap}>
          <View style={styles.todoProgressCircleTrack}>
            <Svg width={progressSize} height={progressSize} style={styles.todoProgressSvg}>
              <Circle
                cx={progressSize / 2}
                cy={progressSize / 2}
                r={progressRadius}
                stroke={colors.border}
                strokeWidth={progressStroke}
                fill="none"
              />
              <Circle
                cx={progressSize / 2}
                cy={progressSize / 2}
                r={progressRadius}
                stroke={colors.primary}
                strokeWidth={progressStroke}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${progressCircumference} ${progressCircumference}`}
                strokeDashoffset={progressOffset}
                rotation={-90}
                origin={`${progressSize / 2}, ${progressSize / 2}`}
              />
            </Svg>
            <Text style={[styles.todoProgressValue, { color: colors.text, fontFamily: fonts.title }]}>{`${todoCompleted}/${todoTotal}`}</Text>
          </View>
        </View>
        <Muted>{todoStatusMessage}</Muted>
        <PrimaryButton title="전체보기" onPress={() => openTab('TodosTab')} />
      </Card>
      <Card style={{ gap: spacing.sm }}>
        <View style={styles.summaryHeader}>
          <View style={[styles.summaryIconWrap, { backgroundColor: colors.primaryTint, borderRadius: radius.round }]}>
            <Ionicons name="wallet" size={icon.md} color={colors.primary} />
          </View>
          <SectionLabel>{`${data?.date?.slice(5, 7) ?? '--'}월 가계부`}</SectionLabel>
        </View>
        <Body size="sm">{`예산 ${data ? data.foodBudget.budgetAmount.toLocaleString() : '-'}원 중`}</Body>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${Math.round(
                  ((data?.foodBudget.spentAmount ?? 0) / Math.max(data?.foodBudget.budgetAmount ?? 1, 1)) * 100,
                )}%`,
              },
            ]}
          />
        </View>
        <View style={styles.foodSummaryRow}>
          <View style={[styles.foodMetricBox, { backgroundColor: colors.cardMuted, borderRadius: radius.sm }]}>
            <SectionLabel>오늘 지출</SectionLabel>
            <Text style={[styles.foodMetricValue, { color: colors.text, fontFamily: fonts.titleSemi }]}>
              {data ? `${data.foodBudget.todaySpentAmount.toLocaleString()}원` : '-'}
            </Text>
          </View>
          <View style={[styles.foodMetricBox, { backgroundColor: colors.cardMuted, borderRadius: radius.sm }]}>
            <SectionLabel>잔여 예산</SectionLabel>
            <Text style={[styles.foodMetricValue, { color: colors.text, fontFamily: fonts.titleSemi }]}>
              {data ? `${data.foodBudget.remainingAmount.toLocaleString()}원` : '-'}
            </Text>
          </View>
        </View>
        <PrimaryButton title="가계부에 기록" onPress={() => openTab('FoodTab')} />
      </Card>
      <Card style={styles.quickGridCard}>
        <View style={styles.quickGridRow}>
          <Pressable
            onPress={() => {
              const nav = navigation as { navigate?: (name: string, params?: object) => void };
              nav.navigate?.('TodosTab', { initialScope: 'week' });
            }}
            style={[styles.quickGridItem, { borderColor: colors.border }]}
          >
            <Ionicons name="calendar-outline" size={icon.lg} color={colors.textSecondary} />
            <Body>이번 주</Body>
          </Pressable>
          <Pressable onPress={() => openMore('Diary')} style={[styles.quickGridItem, { borderColor: colors.border }]}>
            <Ionicons name="create-outline" size={icon.lg} color={colors.textSecondary} />
            <Body>일기</Body>
          </Pressable>
        </View>
        <View style={styles.quickGridRow}>
          <Pressable onPress={() => openMore('Notices')} style={[styles.quickGridItem, { borderColor: colors.border }]}>
            <Ionicons name="megaphone-outline" size={icon.lg} color={colors.textSecondary} />
            <Body>공지사항</Body>
          </Pressable>
          <Pressable onPress={() => openMore('Stats')} style={[styles.quickGridItem, { borderColor: colors.border }]}>
            <Ionicons name="bar-chart-outline" size={icon.lg} color={colors.textSecondary} />
            <Body>통계</Body>
          </Pressable>
        </View>
      </Card>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  quoteCard: { gap: 8 },
  quoteText: { fontSize: 19, lineHeight: 28 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  todoCheckWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  summaryIconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoProgressCircleWrap: { alignItems: 'center', justifyContent: 'center' },
  todoProgressCircleTrack: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoProgressSvg: { position: 'absolute' },
  todoProgressValue: { fontSize: 24, lineHeight: 32 },
  progressTrack: { width: '100%', height: 8, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 999 },
  foodSummaryRow: { flexDirection: 'row', gap: 8 },
  foodMetricBox: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 2 },
  foodMetricValue: { fontSize: 15, lineHeight: 22 },
  quickGridCard: { gap: 8 },
  quickGridRow: { flexDirection: 'row', gap: 8 },
  quickGridItem: {
    flex: 1,
    minHeight: 88,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
});
