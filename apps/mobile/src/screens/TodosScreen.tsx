import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApi } from '../api/useApi';
import { TodoFormModal } from '../components/TodoFormModal';
import {
  Badge,
  EmptyState,
  ErrorText,
  Fab,
  LinearProgressBar,
  LoadingBlock,
  Muted,
  SectionLabel,
  Title,
} from '../components/Ui';
import {
  describeSchedule,
  formatDueAtTimeLocal,
  priorityLabel,
  scheduleTypeLabel,
  type Todo,
} from '../todos/todoModel';
import { toYmd } from '../lib/week';
import { useAppTheme } from '../theme/ThemeContext';

type TodoListResponse = {
  items: Todo[];
  stats?: { completed: number; total: number };
};

export function TodosScreen() {
  const { colors, fonts, spacing, radius, stroke, icon } = useAppTheme();
  const { requestJson } = useApi();
  const [today, setToday] = useState(() => toYmd(new Date()));
  const [items, setItems] = useState<Todo[]>([]);
  const [stats, setStats] = useState<{ completed: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formTodo, setFormTodo] = useState<Todo | null>(null);

  const load = useCallback(async () => {
    const todayKey = toYmd(new Date());
    setToday(todayKey);
    setError(null);
    try {
      const res = await requestJson<TodoListResponse>(
        `/v1/todos?date=${todayKey}&status=all&limit=100`,
      );
      const list = res.items ?? [];
      setItems(list);
      if (res.stats) {
        setStats(res.stats);
      } else {
        const completed = list.filter((i) => i.done).length;
        setStats({ completed, total: list.length });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [requestJson]);

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
    setFormMode('create');
    setFormTodo(null);
    setFormOpen(true);
  };

  const openEdit = (t: Todo) => {
    setError(null);
    setFormMode('edit');
    setFormTodo(t);
    setFormOpen(true);
  };

  const statusLine =
    total === 0
      ? '오늘 예정된 할 일이 없어요. 추가해 보세요.'
      : remaining > 0
        ? `남은 할 일 ${remaining}개`
        : '오늘 할 일을 모두 완료했어요.';

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
      <Muted>{`${today} 기준${total > 0 ? ` · 총 ${total}개` : ''}`}</Muted>
      <View
        style={{
          borderWidth: stroke.width,
          borderColor: colors.border,
          borderRadius: radius.md,
          padding: spacing.md,
          gap: spacing.sm,
          backgroundColor: colors.cardMuted,
        }}
      >
        <SectionLabel>오늘 진행률</SectionLabel>
        <Text style={{ color: colors.text, fontFamily: fonts.titleSemi, fontSize: 28, lineHeight: 36 }}>{`${percent}%`}</Text>
        <Muted>{`${completed} / ${total} 완료`}</Muted>
        <LinearProgressBar ratio={ratio} />
        <Muted>{statusLine}</Muted>
      </View>
      {error ? <ErrorText>{error}</ErrorText> : null}
    </View>
  );

  if (loading && items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {header}
        <View style={{ paddingHorizontal: spacing.lg }}>
          <LoadingBlock />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        style={{ flex: 1 }}
        data={items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: spacing.xxxl + 72 }}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: spacing.lg }}>
            <EmptyState text="할 일이 없습니다." />
          </View>
        }
        renderItem={({ item }) => {
          const timeHint = formatDueAtTimeLocal(item.dueAt);
          const meta = `${priorityLabel[item.priority] ?? item.priority} · ${describeSchedule(item)}${
            timeHint ? ` · ${timeHint}` : ''
          }`;
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
        }}
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
        onClose={() => {
          setFormOpen(false);
          setFormTodo(null);
        }}
        onSaved={() => load()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rowAction: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  actionText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
