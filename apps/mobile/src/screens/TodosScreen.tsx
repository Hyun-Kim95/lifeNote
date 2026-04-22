import { useCallback, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useApi } from '../api/useApi';
import {
  TodoFormModal,
  type TodoPlanSlotDraft,
  type TodoScheduleRangePrefill,
} from '../components/TodoFormModal';
import {
  Badge,
  Body,
  Card,
  Chip,
  EmptyState,
  ErrorText,
  Fab,
  LinearProgressBar,
  LoadingBlock,
  Muted,
  SectionLabel,
  Title,
} from '../components/Ui';
import type { MainTabParamList } from '../navigation/types';
import {
  addDaysLocal,
  addMonthsLocalYearMonth,
  currentYearMonth,
  getWeekMonday,
  toYmd,
} from '../lib/week';
import {
  dayPeriodLabel,
  describeSchedule,
  formatDueAtTimeLocal,
  formatTimeLocalLabel,
  priorityLabel,
  scheduleTypeLabel,
  todoDisplayDayPeriod,
  type Todo,
  type TodoDayPeriodApi,
} from '../todos/todoModel';
import { useAppTheme } from '../theme/ThemeContext';

type TodoListResponse = {
  items: Todo[];
  stats?: { completed: number; total: number };
};

type TodosScope = 'day' | 'week' | 'month';

type TodoStatusFilter = 'all' | 'open' | 'done';

type TodoSection = { title: string; data: Todo[] };

function buildDayPeriodSections(items: Todo[]): TodoSection[] {
  const order: TodoDayPeriodApi[] = ['all_day', 'am', 'pm'];
  return order
    .map((key) => ({
      title: dayPeriodLabel[key],
      data: items.filter((t) => todoDisplayDayPeriod(t) === key),
    }))
    .filter((s) => s.data.length > 0);
}

export function TodosScreen() {
  const { colors, fonts, spacing, radius, stroke, icon } = useAppTheme();
  const { requestJson } = useApi();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MainTabParamList, 'TodosTab'>>();

  const [scope, setScope] = useState<TodosScope>('day');
  const [statusFilter, setStatusFilter] = useState<TodoStatusFilter>('all');
  const [selectedDay, setSelectedDay] = useState(() => toYmd(new Date()));
  const [weekMonday, setWeekMonday] = useState(() => getWeekMonday());
  const [yearMonth, setYearMonth] = useState(() => currentYearMonth());

  const [today, setToday] = useState(() => toYmd(new Date()));
  const [items, setItems] = useState<Todo[]>([]);
  const [stats, setStats] = useState<{ completed: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formTodo, setFormTodo] = useState<Todo | null>(null);
  const [planTodoDraft, setPlanTodoDraft] = useState<TodoPlanSlotDraft | null>(null);
  const [formRangePrefill, setFormRangePrefill] = useState<TodoScheduleRangePrefill | null>(null);

  const load = useCallback(async () => {
    const todayKey = toYmd(new Date());
    setToday(todayKey);
    setError(null);
    try {
      const baseQs = (status: TodoStatusFilter) => {
        let qs = `status=${status}&limit=100`;
        if (scope === 'day') {
          qs += `&date=${selectedDay}`;
        } else if (scope === 'week') {
          qs += `&weekStart=${weekMonday}`;
        } else {
          qs += `&yearMonth=${yearMonth}`;
        }
        return qs;
      };

      const listPromise = requestJson<TodoListResponse>(`/v1/todos?${baseQs(statusFilter)}`);
      const statsPromise =
        statusFilter === 'all'
          ? null
          : requestJson<TodoListResponse>(`/v1/todos?${baseQs('all')}`).catch(() => null);

      const [listRes, allRes] = await Promise.all([listPromise, statsPromise]);
      const list = listRes.items ?? [];
      setItems(list);

      const statsSource = statusFilter === 'all' ? listRes : allRes ?? listRes;
      if (statsSource.stats) {
        setStats(statsSource.stats);
      } else {
        const srcItems = statusFilter === 'all' ? list : (allRes?.items ?? list);
        const completed = srcItems.filter((i) => i.done).length;
        setStats({ completed, total: srcItems.length });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [requestJson, scope, statusFilter, selectedDay, weekMonday, yearMonth]);

  useFocusEffect(
    useCallback(() => {
      const p = route.params;
      const fromScope = p?.initialScope;
      const legacy =
        p?.initialSegment === 'week' ? 'week' : p?.initialSegment === 'today' ? 'day' : undefined;
      const next = fromScope ?? legacy;
      if (next) {
        setScope(next);
        navigation.setParams({ initialScope: undefined, initialSegment: undefined } as never);
      }
    }, [route.params, navigation]),
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const total = stats?.total ?? items.length;
  const completed = stats?.completed ?? items.filter((i) => i.done).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const ratio = total > 0 ? completed / total : 0;
  const remaining = total - completed;
  const listCount = items.length;

  const toggle = async (t: Todo) => {
    setSaving(true);
    setError(null);
    try {
      await requestJson(`/v1/todos/${t.id}`, { method: 'PATCH', body: { done: !t.done } });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '수정 실패');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (t: Todo) => {
    Alert.alert('할 일 삭제', `"${t.title}"을(를) 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => void deleteTodo(t.id),
      },
    ]);
  };

  const openTodoRowMenu = (t: Todo) => {
    const edit = () => openEdit(t);
    const del = () => confirmDelete(t);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['취소', '수정', '삭제'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
          title: t.title,
        },
        (i) => {
          if (i === 1) edit();
          if (i === 2) del();
        },
      );
    } else {
      Alert.alert(t.title, undefined, [
        { text: '취소', style: 'cancel' },
        { text: '수정', onPress: edit },
        { text: '삭제', style: 'destructive', onPress: del },
      ]);
    }
  };

  const deleteTodo = async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      await requestJson(`/v1/todos/${id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제 실패');
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setError(null);
    setPlanTodoDraft(null);
    setFormMode('create');
    setFormTodo(null);
    if (scope === 'week') {
      setFormRangePrefill({ kind: 'week', weekStart: weekMonday });
    } else if (scope === 'month') {
      setFormRangePrefill({ kind: 'month', yearMonth });
    } else {
      setFormRangePrefill(null);
    }
    setFormOpen(true);
  };

  const openEdit = (t: Todo) => {
    setError(null);
    setPlanTodoDraft(null);
    setFormRangePrefill(null);
    setFormMode('edit');
    setFormTodo(t);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormTodo(null);
    setPlanTodoDraft(null);
    setFormRangePrefill(null);
  };

  const statusLine =
    total === 0
      ? scope === 'day' && selectedDay === today
        ? '오늘 예정된 할 일이 없어요. 추가해 보세요.'
        : '이 기간에 표시할 할 일이 없어요.'
      : remaining > 0
        ? `남은 할 일 ${remaining}개`
        : '할 일을 모두 완료했어요.';

  const scopeBar = (
    <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
      <Chip
        label="일별"
        selected={scope === 'day'}
        onPress={() => {
          setScope('day');
          setLoading(true);
        }}
      />
      <Chip
        label="주별"
        selected={scope === 'week'}
        onPress={() => {
          setScope('week');
          setLoading(true);
        }}
      />
      <Chip
        label="월별"
        selected={scope === 'month'}
        onPress={() => {
          setScope('month');
          setLoading(true);
        }}
      />
    </View>
  );

  const statusChipRow = (
    <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
      <Chip
        label="전체"
        selected={statusFilter === 'all'}
        onPress={() => {
          if (statusFilter === 'all') return;
          setStatusFilter('all');
          setLoading(true);
        }}
      />
      <Chip
        label="미완료"
        selected={statusFilter === 'open'}
        onPress={() => {
          if (statusFilter === 'open') return;
          setStatusFilter('open');
          setLoading(true);
        }}
      />
      <Chip
        label="완료"
        selected={statusFilter === 'done'}
        onPress={() => {
          if (statusFilter === 'done') return;
          setStatusFilter('done');
          setLoading(true);
        }}
      />
    </View>
  );

  const periodNav =
    scope === 'day' ? (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
        <Pressable
          onPress={() => {
            setSelectedDay((d) => addDaysLocal(d, -1));
            setLoading(true);
          }}
          style={styles.navHit}
        >
          <Ionicons name="chevron-back" size={icon.md} color={colors.primary} />
        </Pressable>
        <Muted>{selectedDay}</Muted>
        <Pressable
          onPress={() => {
            setSelectedDay((d) => addDaysLocal(d, 1));
            setLoading(true);
          }}
          style={styles.navHit}
        >
          <Ionicons name="chevron-forward" size={icon.md} color={colors.primary} />
        </Pressable>
        {selectedDay !== today ? (
          <Chip
            label="오늘"
            selected={false}
            onPress={() => {
              setSelectedDay(today);
              setLoading(true);
            }}
          />
        ) : null}
      </View>
    ) : scope === 'week' ? (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
        <Pressable
          onPress={() => {
            setWeekMonday((w) => addDaysLocal(w, -7));
            setLoading(true);
          }}
          style={styles.navHit}
        >
          <Ionicons name="chevron-back" size={icon.md} color={colors.primary} />
        </Pressable>
        <Muted>{`${weekMonday} ~ ${addDaysLocal(weekMonday, 6)}`}</Muted>
        <Pressable
          onPress={() => {
            setWeekMonday((w) => addDaysLocal(w, 7));
            setLoading(true);
          }}
          style={styles.navHit}
        >
          <Ionicons name="chevron-forward" size={icon.md} color={colors.primary} />
        </Pressable>
        {weekMonday !== getWeekMonday() ? (
          <Chip
            label="이번 주"
            selected={false}
            onPress={() => {
              setWeekMonday(getWeekMonday());
              setLoading(true);
            }}
          />
        ) : null}
      </View>
    ) : (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
        <Pressable
          onPress={() => {
            setYearMonth((ym) => addMonthsLocalYearMonth(ym, -1));
            setLoading(true);
          }}
          style={styles.navHit}
        >
          <Ionicons name="chevron-back" size={icon.md} color={colors.primary} />
        </Pressable>
        <Muted>{yearMonth}</Muted>
        <Pressable
          onPress={() => {
            setYearMonth((ym) => addMonthsLocalYearMonth(ym, 1));
            setLoading(true);
          }}
          style={styles.navHit}
        >
          <Ionicons name="chevron-forward" size={icon.md} color={colors.primary} />
        </Pressable>
        {yearMonth !== currentYearMonth() ? (
          <Chip
            label="이번 달"
            selected={false}
            onPress={() => {
              setYearMonth(currentYearMonth());
              setLoading(true);
            }}
          />
        ) : null}
      </View>
    );

  const progressCardTitle =
    scope === 'day'
      ? selectedDay === today
        ? '오늘 진행률'
        : '선택일 진행률'
      : scope === 'week'
        ? weekMonday === getWeekMonday()
          ? '이번 주 진행률'
          : '선택 주 진행률'
        : yearMonth === currentYearMonth()
          ? '이번 달 진행률'
          : '선택 월 진행률';

  const scopeSummaryMuted =
    scope === 'day'
      ? `${selectedDay} 기준${statusFilter !== 'all' ? ` · 목록 ${listCount}건` : total > 0 ? ` · 총 ${total}개` : ''}`
      : scope === 'week'
        ? `${weekMonday} ~ ${addDaysLocal(weekMonday, 6)} 기준${statusFilter !== 'all' ? ` · 목록 ${listCount}건` : total > 0 ? ` · 총 ${total}개` : ''}`
        : `${yearMonth} 기준${statusFilter !== 'all' ? ` · 목록 ${listCount}건` : total > 0 ? ` · 총 ${total}개` : ''}`;

  const header = (
    <View
      style={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg + spacing.xl,
        paddingBottom: spacing.xs,
        gap: spacing.md,
      }}
    >
      <Title>오늘의 할 일</Title>
      {scopeBar}
      {periodNav}
      {statusChipRow}
      <Muted>{scopeSummaryMuted}</Muted>
      <Card style={{ gap: spacing.sm }}>
        <View style={styles.cardHeaderRow}>
          <View
            style={[
              styles.todoLeadIcon,
              {
                borderColor: colors.primary,
                borderRadius: radius.round,
                backgroundColor: colors.card,
              },
            ]}
          >
            <Ionicons name="checkmark" size={icon.sm} color={colors.primary} />
          </View>
          <SectionLabel>{progressCardTitle}</SectionLabel>
        </View>
        <Text
          style={{
            color: colors.text,
            fontFamily: fonts.titleSemi,
            fontSize: 32,
            lineHeight: 40,
          }}
        >{`${percent}%`}</Text>
        <Muted>{`${completed} / ${total} 완료`}</Muted>
        <LinearProgressBar ratio={ratio} />
        <Muted>{statusLine}</Muted>
      </Card>
      {scope === 'week' ? (
        <Muted>선택한 주에 걸리는 할 일입니다. 주간 슬롯은 더보기 → 주간 계획에서 편집할 수 있어요.</Muted>
      ) : scope === 'month' ? (
        <Muted>선택한 달에 한 번이라도 노출되는 할 일입니다.</Muted>
      ) : null}
      {error ? <ErrorText>{error}</ErrorText> : null}
    </View>
  );

  const sections = buildDayPeriodSections(items);

  const renderTodo = ({ item }: { item: Todo }) => {
    const timeHint = formatDueAtTimeLocal(item.dueAt);
    const localTl = formatTimeLocalLabel(item.timeLocal);
    const meta = `${priorityLabel[item.priority] ?? item.priority} · ${describeSchedule(item)}${
      localTl ? ` · ${localTl}` : ''
    }${timeHint ? ` · ${timeHint}` : ''}`;
    return (
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.sm }}>
        <View
          style={{
            borderWidth: stroke.width,
            borderColor: colors.border,
            borderRadius: radius.sm,
            padding: spacing.md,
            backgroundColor: colors.card,
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: spacing.sm,
          }}
        >
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.done }}
            accessibilityLabel={item.done ? '완료됨, 탭하면 미완료로' : '미완료, 탭하면 완료'}
            onPress={() => void toggle(item)}
            disabled={saving}
            style={{ paddingVertical: 4, paddingRight: 4 }}
            hitSlop={8}
          >
            <Ionicons
              name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
              size={icon.xl}
              color={item.done ? colors.primary : colors.textMuted}
            />
          </Pressable>
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Text
              style={{
                fontSize: 15,
                lineHeight: 22,
                fontFamily: fonts.bodyMedium,
                color: colors.text,
                textDecorationLine: item.done ? 'line-through' : 'none',
              }}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            <Muted>{meta}</Muted>
            {item.endDate ? <Muted>{`반복 종료 ${item.endDate}`}</Muted> : null}
          </View>
          <View style={{ alignItems: 'flex-end', gap: spacing.xs, flexShrink: 0 }}>
            <Badge label={scheduleTypeLabel[item.scheduleType] ?? '반복'} />
            <Pressable onPress={() => openEdit(item)} style={styles.rowAction} disabled={saving}>
              <Text style={[styles.actionText, { color: colors.primary, fontFamily: fonts.bodyMedium }]}>수정</Text>
            </Pressable>
            <Pressable onPress={() => confirmDelete(item)} style={styles.rowAction} disabled={saving}>
              <Text style={[styles.actionText, { color: colors.error, fontFamily: fonts.bodyMedium }]}>삭제</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  if (loading && items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {header}
        <View style={{ paddingHorizontal: spacing.lg }}>
          <LoadingBlock />
        </View>
        <TodoFormModal
          visible={formOpen}
          mode={formMode}
          todo={formTodo}
          todayYmd={today}
          initialPlanSlotDraft={planTodoDraft}
          scheduleRangePrefill={formRangePrefill}
          onClose={closeForm}
          onSaved={() => load()}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SectionList
        style={{ flex: 1 }}
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={header}
        contentContainerStyle={
          items.length === 0 ? { flexGrow: 1, paddingBottom: spacing.xxxl + 72 } : { paddingBottom: spacing.xxxl + 72 }
        }
        ListEmptyComponent={
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
            <EmptyState text="할 일이 없습니다." />
          </View>
        }
        renderSectionHeader={({ section: { title } }) => (
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
            <SectionLabel>{title}</SectionLabel>
          </View>
        )}
        renderItem={renderTodo}
      />
      <Fab
        accessibilityLabel="할 일 추가"
        onPress={openCreate}
        icon={<Ionicons name="add" size={icon.xl} color={colors.onPrimary} />}
      />
      <TodoFormModal
        visible={formOpen}
        mode={formMode}
        todo={formTodo}
        todayYmd={today}
        initialPlanSlotDraft={planTodoDraft}
        scheduleRangePrefill={formRangePrefill}
        onClose={closeForm}
        onSaved={() => load()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todoLeadIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  rowAction: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  actionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  navHit: {
    padding: 6,
  },
});
