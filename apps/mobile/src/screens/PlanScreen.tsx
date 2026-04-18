import { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useApi } from '../api/useApi';
import {
  Card,
  Chip,
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
import { getWeekMonday } from '../lib/week';
import { useAppTheme } from '../theme/ThemeContext';

type Slot = {
  id?: string;
  dayOfWeek: number;
  period: 'all_day' | 'am' | 'pm';
  label: string;
  sortOrder: number;
};

const PERIODS: Slot['period'][] = ['all_day', 'am', 'pm'];
const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const PERIOD_LABEL: Record<Slot['period'], string> = {
  all_day: '종일',
  am: '오전',
  pm: '오후',
};

export type PlanScreenProps = {
  onRequestCreateTodoFromSlot?: (p: {
    planSlotId: string;
    label: string;
    dayOfWeek: number;
    weekStart: string;
  }) => void;
};

export function PlanScreen({ onRequestCreateTodoFromSlot }: PlanScreenProps = {}) {
  const { colors, spacing } = useAppTheme();
  const { requestJson } = useApi();
  const [weekStart, setWeekStart] = useState(getWeekMonday());
  const [weekEnd, setWeekEnd] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newDow, setNewDow] = useState(1);
  const [newPeriod, setNewPeriod] = useState<Slot['period']>('all_day');

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await requestJson<{ weekStart: string; weekEnd: string; slots: Slot[] }>(
        `/v1/plans/weeks/${weekStart}`,
      );
      setWeekEnd(res.weekEnd);
      setSlots(res.slots ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류');
    } finally {
      setLoading(false);
    }
  }, [requestJson, weekStart]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const saveAll = async () => {
    setSaving(true);
    setError(null);
    const body = {
      slots: slots.map((s, i) => ({
        ...(s.id ? { id: s.id } : {}),
        dayOfWeek: s.dayOfWeek,
        period: s.period,
        label: s.label,
        sortOrder: s.sortOrder ?? i,
      })),
    };
    try {
      await requestJson(`/v1/plans/weeks/${weekStart}`, { method: 'PUT', body });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const removeSlot = (idx: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== idx));
  };

  const addSlot = () => {
    if (!newLabel.trim()) return;
    setSlots((prev) => [
      ...prev,
      {
        dayOfWeek: newDow,
        period: newPeriod,
        label: newLabel.trim(),
        sortOrder: prev.length,
      },
    ]);
    setNewLabel('');
  };

  const header = (
    <View style={{ padding: spacing.lg, gap: spacing.md }}>
      <Title>주간 계획</Title>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Card style={{ gap: spacing.sm }}>
        <SectionLabel>주 시작(월요일 YYYY-MM-DD)</SectionLabel>
        <Input value={weekStart} onChangeText={setWeekStart} autoCapitalize="none" />
        <Muted>~ {weekEnd || '—'}</Muted>
        <PrimaryButton title="불러오기" onPress={() => { setLoading(true); void load(); }} />
      </Card>
      <Card style={{ gap: spacing.sm }}>
        <SectionLabel>새 슬롯</SectionLabel>
        <SectionLabel>요일</SectionLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {DAYS.map((d, i) => (
            <Chip
              key={d}
              label={d}
              selected={newDow === i + 1}
              onPress={() => setNewDow(i + 1)}
            />
          ))}
        </View>
        <View style={{ marginTop: spacing.sm }}>
          <SectionLabel>시간대</SectionLabel>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {PERIODS.map((p) => (
            <Chip
              key={p}
              label={PERIOD_LABEL[p]}
              selected={newPeriod === p}
              onPress={() => setNewPeriod(p)}
            />
          ))}
        </View>
        <Input value={newLabel} onChangeText={setNewLabel} placeholder="라벨" style={{ marginTop: spacing.sm }} />
        <PrimaryButton title="목록에 추가" onPress={addSlot} />
      </Card>
      <PrimaryButton title="서버에 저장" onPress={() => void saveAll()} loading={saving} />
    </View>
  );

  if (loading && slots.length === 0 && !weekEnd) {
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
      data={slots}
      keyExtractor={(item, index) => item.id ?? `new-${index}`}
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingBottom: 32 }}
      ListEmptyComponent={
        <View style={{ paddingHorizontal: spacing.lg }}>
          <EmptyState text="슬롯이 없습니다. 위에서 추가하세요." />
        </View>
      }
      renderItem={({ item, index }) => (
        <View
          style={{
            paddingHorizontal: spacing.lg,
            marginTop: spacing.sm,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          <View style={{ flex: 1 }}>
            <ListItem
              title={item.label}
              subtitle={`${DAYS[item.dayOfWeek - 1] ?? item.dayOfWeek} · ${PERIOD_LABEL[item.period]}`}
            />
          </View>
          <View style={{ gap: spacing.xs, width: 96 }}>
            {onRequestCreateTodoFromSlot && item.id ? (
              <SecondaryButton
                title="할 일로"
                onPress={() =>
                  onRequestCreateTodoFromSlot({
                    planSlotId: item.id!,
                    label: item.label,
                    dayOfWeek: item.dayOfWeek,
                    weekStart,
                  })
                }
              />
            ) : null}
            <SecondaryButton title="삭제" onPress={() => removeSlot(index)} />
          </View>
        </View>
      )}
    />
  );
}
