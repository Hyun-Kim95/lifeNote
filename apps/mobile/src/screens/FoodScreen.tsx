import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useApi } from '../api/useApi';
import {
  Card,
  EmptyState,
  ErrorText,
  Input,
  ListItem,
  LoadingBlock,
  Muted,
  PrimaryButton,
  SectionLabel,
  SecondaryButton,
  Title,
} from '../components/Ui';
import { currentYearMonth, toYmd } from '../lib/week';
import { useAppTheme } from '../theme/ThemeContext';

type MonthRes = {
  yearMonth: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
};

type DayRow = { date: string; amount: number; memo: string | null };

export function FoodScreen() {
  const { colors, fonts, spacing } = useAppTheme();
  const { requestJson } = useApi();
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [month, setMonth] = useState<MonthRes | null>(null);
  const [days, setDays] = useState<DayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [editDate, setEditDate] = useState<string | null>(null);
  const [dayAmount, setDayAmount] = useState('');
  const [dayMemo, setDayMemo] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      const [m, d] = await Promise.all([
        requestJson<MonthRes>(`/v1/budgets/food/months/${yearMonth}`),
        requestJson<{ items: DayRow[] }>(`/v1/budgets/food/months/${yearMonth}/days`),
      ]);
      setMonth(m);
      setDays(d.items ?? []);
      setBudgetInput(String(m.budgetAmount));
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류');
    } finally {
      setLoading(false);
    }
  }, [requestJson, yearMonth]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const saveBudget = async () => {
    const n = Number(budgetInput.replace(/,/g, ''));
    if (!Number.isFinite(n) || n < 0) {
      setError('예산 금액을 확인해 주세요.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await requestJson(`/v1/budgets/food/months/${yearMonth}`, {
        method: 'PUT',
        body: { budgetAmount: Math.round(n) },
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const openDay = (row: DayRow) => {
    setEditDate(row.date);
    setDayAmount(String(row.amount));
    setDayMemo(row.memo ?? '');
  };

  const saveDay = async () => {
    if (!editDate) return;
    const amt = Number(dayAmount.replace(/,/g, ''));
    if (!Number.isFinite(amt) || amt < 0) {
      setError('금액을 확인해 주세요.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await requestJson(`/v1/budgets/food/months/${yearMonth}/days/${editDate}`, {
        method: 'PUT',
        body: { amount: Math.round(amt), memo: dayMemo.trim() || undefined },
      });
      setEditDate(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <View style={{ padding: spacing.lg, gap: spacing.md }}>
      <Title>식비</Title>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Card style={{ gap: spacing.sm }}>
        <SectionLabel>기준월 (YYYY-MM)</SectionLabel>
        <Input value={yearMonth} onChangeText={setYearMonth} autoCapitalize="none" />
        <PrimaryButton title="월 불러오기" onPress={() => { setLoading(true); void load(); }} />
      </Card>
      {month ? (
        <Card style={{ gap: spacing.sm }}>
          <SectionLabel>월 요약</SectionLabel>
          <Text style={{ fontSize: 21, lineHeight: 28, color: colors.text, fontFamily: fonts.title }}>
            {month.remainingAmount.toLocaleString()}원
          </Text>
          <Muted>{`지출 합계 ${month.spentAmount.toLocaleString()}원`}</Muted>
          <SectionLabel>월 예산 (원)</SectionLabel>
          <Input value={budgetInput} onChangeText={setBudgetInput} keyboardType="number-pad" />
          <PrimaryButton title="예산 저장" onPress={() => void saveBudget()} loading={saving} />
        </Card>
      ) : null}
      {editDate ? (
        <Card>
          <SectionLabel>날짜 (YYYY-MM-DD)</SectionLabel>
          <Input value={editDate} onChangeText={setEditDate} autoCapitalize="none" />
          <SectionLabel>금액</SectionLabel>
          <Input value={dayAmount} onChangeText={setDayAmount} keyboardType="number-pad" />
          <SectionLabel>메모</SectionLabel>
          <Input value={dayMemo} onChangeText={setDayMemo} placeholder="선택" />
          <PrimaryButton title="일별 저장" onPress={() => void saveDay()} loading={saving} />
          <SecondaryButton title="취소" onPress={() => setEditDate(null)} />
        </Card>
      ) : (
        <SecondaryButton
          title="오늘 지출 입력"
          onPress={() => {
            setEditDate(toYmd(new Date()));
            setDayAmount('0');
            setDayMemo('');
          }}
        />
      )}
    </View>
  );

  if (loading && !month) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {header}
        <LoadingBlock />
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bg }}
      data={days}
      keyExtractor={(item) => item.date}
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingBottom: 32 }}
      ListEmptyComponent={
        <View style={{ paddingHorizontal: spacing.lg }}>
          <EmptyState text="이 달에 등록된 일별 지출이 없습니다. 오늘 지출 입력으로 추가할 수 있습니다." />
        </View>
      }
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.sm }}>
          <ListItem
            onPress={() => openDay(item)}
            title={
              <Text style={{ fontSize: 18, lineHeight: 24, color: colors.text, fontFamily: fonts.title }}>
                {item.amount.toLocaleString()}원
              </Text>
            }
            subtitle={
              <>
                <Text style={{ color: colors.textMuted, fontSize: 13, fontFamily: fonts.body }}>{item.date}</Text>
                {item.memo ? <Muted>{item.memo}</Muted> : null}
              </>
            }
          />
        </View>
      )}
    />
  );
}
