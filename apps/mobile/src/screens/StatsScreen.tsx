import { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useApi } from '../api/useApi';
import { Card, Chip, EmptyState, ErrorText, LoadingBlock, Muted, PrimaryButton, ScreenScroll, SectionLabel, Title } from '../components/Ui';
import { useAppTheme } from '../theme/ThemeContext';

type Range = 'week' | 'month' | 'year';

type Stats = {
  range: string;
  todo: { completionRate: number; completed: number; total: number };
  diary: { daysWritten: number };
  food: { totalSpent: number; budgetAmount: number };
};

const rangeLabel: Record<Range, string> = {
  week: '주간',
  month: '월간',
  year: '연간',
};

function isEmptySummary(d: Stats): boolean {
  return (
    d.todo.total === 0 &&
    d.diary.daysWritten === 0 &&
    d.food.budgetAmount === 0 &&
    d.food.totalSpent === 0
  );
}

export function StatsScreen() {
  const { colors, fonts, spacing } = useAppTheme();
  const { requestJson } = useApi();
  const [range, setRange] = useState<Range>('month');
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await requestJson<Stats>(`/v1/stats/summary?range=${range}`);
      setData(res);
    } catch {
      setData(null);
      setError('데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [requestJson, range]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const showEmpty = useMemo(() => data && !error && isEmptySummary(data), [data, error]);

  if (loading && !data && !error) {
    return (
      <ScreenScroll>
        <Title>통계</Title>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <Chip label={rangeLabel.week} selected={range === 'week'} onPress={() => setRange('week')} />
          <Chip label={rangeLabel.month} selected={range === 'month'} onPress={() => setRange('month')} />
          <Chip label={rangeLabel.year} selected={range === 'year'} onPress={() => setRange('year')} />
        </View>
        <LoadingBlock />
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll>
      <Title>통계</Title>
      <SectionLabel>기간 선택</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <Chip label={rangeLabel.week} selected={range === 'week'} onPress={() => setRange('week')} />
        <Chip label={rangeLabel.month} selected={range === 'month'} onPress={() => setRange('month')} />
        <Chip label={rangeLabel.year} selected={range === 'year'} onPress={() => setRange('year')} />
      </View>
      {error ? (
        <Card>
          <ErrorText>{error}</ErrorText>
          <PrimaryButton title="다시 시도" onPress={() => void load()} loading={loading} />
        </Card>
      ) : null}
      {showEmpty ? (
        <EmptyState text="아직 기록이 없어요. 할 일·일기·가계부를 채우면 이곳에 요약이 표시됩니다." />
      ) : null}
      {data && !error && !showEmpty ? (
        <>
          <Card>
            <Muted>할 일 완료율</Muted>
            <Text style={{ fontFamily: fonts.title, ...fonts.typography.title, color: colors.text }}>
              {Math.round(data.todo.completionRate * 100)}%
            </Text>
            <Muted>
              {data.todo.completed} / {data.todo.total}
            </Muted>
          </Card>
          <Card>
            <Muted>일기 작성일</Muted>
            <Text style={{ fontFamily: fonts.title, ...fonts.typography.title, color: colors.text }}>
              {data.diary.daysWritten}일
            </Text>
          </Card>
          <Card>
            <Muted>가계부 지출</Muted>
            <Text style={{ fontFamily: fonts.title, ...fonts.typography.title, color: colors.text }}>
              {data.food.totalSpent.toLocaleString()}원
            </Text>
            <Muted>예산 {data.food.budgetAmount.toLocaleString()}원</Muted>
          </Card>
        </>
      ) : null}
    </ScreenScroll>
  );
}
