import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApi } from '../api/useApi';
import {
  Body,
  Card,
  Chip,
  EmptyState,
  ErrorText,
  FieldLabel,
  Input,
  ListItem,
  LoadingBlock,
  Muted,
  Overlay,
  PrimaryButton,
  SecondaryButton,
  Title,
} from '../components/Ui';
import {
  EXPENSE_CATEGORY_IDS,
  EXPENSE_CATEGORIES,
  type ExpenseCategoryId,
  iconForExpenseCategory,
} from '../ledger/expenseCategories';
import { currentYearMonth, toYmd } from '../lib/week';
import { useAppTheme } from '../theme/ThemeContext';

type MonthRes = {
  yearMonth: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  categoryBudgets?: Array<{
    category: ExpenseCategoryId;
    budgetAmount: number | null;
    spentAmount: number;
    remainingAmount: number | null;
  }>;
  categoryBudgetStatus?: {
    totalCategoryBudgeted: number;
    deltaFromMonthBudget: number;
    overBudgetAmount: number;
    unsetCategoryCount: number;
  };
};

type DayRow = {
  id: string;
  date: string;
  amount: number;
  memo: string | null;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
};

type DaysListRes = { items: DayRow[]; nextCursor: string | null };

const YMD_IN_MONTH = /^\d{4}-\d{2}-\d{2}$/;
const DAYS_PAGE_SIZE = 20;

type ListCategoryFilter = 'all' | ExpenseCategoryId;
type CategoryBudgetInputs = Partial<Record<ExpenseCategoryId, string>>;

function parseYearMonth(ym: string): { y: number; m: number } {
  const [ys, ms] = ym.split('-');
  const y = Number(ys);
  const m = Number(ms);
  return { y: Number.isFinite(y) ? y : 1970, m: Number.isFinite(m) ? m : 1 };
}

function formatYearMonthLabel(ym: string): string {
  const { y, m } = parseYearMonth(ym);
  return `${y}년 ${m}월`;
}

function shiftYearMonth(ym: string, delta: number): string {
  const { y, m } = parseYearMonth(ym);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatDayInMonthLabel(dateIso: string): string {
  const parts = dateIso.split('-');
  const mo = Number(parts[1]);
  const da = Number(parts[2]);
  if (!Number.isFinite(mo) || !Number.isFinite(da)) return dateIso;
  return `${mo}월 ${da}일`;
}

function coerceExpenseCategory(id: string | null | undefined): ExpenseCategoryId {
  if (id && (EXPENSE_CATEGORY_IDS as readonly string[]).includes(id)) {
    return id as ExpenseCategoryId;
  }
  return 'other';
}

function formatKrw(n: number): string {
  return `₩ ${n.toLocaleString('ko-KR')}`;
}

function parseBudgetInputToInt(raw: string): number | null {
  const v = raw.trim();
  if (!v) return null;
  const n = Number(v.replace(/,/g, ''));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

/** `ymd`가 `yearMonth`(YYYY-MM) 달에 속하는지 — `startsWith`는 2026-10 vs 2026-1 등에서 오탐 가능해 금지 */
function dateInYearMonth(ymd: string, yearMonth: string): boolean {
  return ymd.length >= 10 && ymd.slice(0, 7) === yearMonth;
}

function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

function parseYmdLocal(ymd: string): Date {
  const [y, mo, d] = ymd.split('-').map(Number);
  return new Date(y, mo - 1, d, 12, 0, 0, 0);
}

function firstDateOfYearMonth(yearMonth: string): Date {
  const { y, m } = parseYearMonth(yearMonth);
  return new Date(y, m - 1, 1, 12, 0, 0, 0);
}

function lastDateOfYearMonth(yearMonth: string): Date {
  const { y, m } = parseYearMonth(yearMonth);
  return new Date(y, m, 0, 12, 0, 0, 0);
}

function clampDate(d: Date, min: Date, max: Date): Date {
  if (d.getTime() < min.getTime()) return min;
  if (d.getTime() > max.getTime()) return max;
  return d;
}

export function FoodScreen() {
  const { colors, fonts, spacing } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { requestJson } = useApi();
  const listCategoryEffectSkipInitial = useRef(true);
  const loadingMore = useRef(false);
  const fetchDaysFirstRef = useRef<() => Promise<void>>(async () => {});

  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [month, setMonth] = useState<MonthRes | null>(null);
  const [days, setDays] = useState<DayRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [listCategory, setListCategory] = useState<ListCategoryFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [categoryBudgetInputs, setCategoryBudgetInputs] = useState<CategoryBudgetInputs>({});
  const [categoryBudgetExpanded, setCategoryBudgetExpanded] = useState(false);

  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [expenseMode, setExpenseMode] = useState<'add' | 'edit'>('add');
  const [expenseDateStr, setExpenseDateStr] = useState('');
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [formAmount, setFormAmount] = useState('');
  const [formMemo, setFormMemo] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<ExpenseCategoryId>('other');
  const [expenseDatePickerVisible, setExpenseDatePickerVisible] = useState(false);
  const [tempExpensePickerDate, setTempExpensePickerDate] = useState(() => new Date());

  const canEditBudget = yearMonth >= currentYearMonth();
  const priorityCategoryIds: ExpenseCategoryId[] = ['meal', 'grocery', 'cafe'];

  const categoryQuery = listCategory === 'all' ? 'all' : listCategory;

  const fetchDaysFirst = useCallback(async () => {
    const q = new URLSearchParams({
      limit: String(DAYS_PAGE_SIZE),
      category: categoryQuery,
    });
    const d = await requestJson<DaysListRes>(
      `/v1/budgets/food/months/${yearMonth}/days?${q.toString()}`,
    );
    setDays(d.items ?? []);
    setNextCursor(d.nextCursor ?? null);
  }, [requestJson, yearMonth, categoryQuery]);

  fetchDaysFirstRef.current = fetchDaysFirst;

  const load = useCallback(async () => {
    setError(null);
    try {
      const m = await requestJson<MonthRes>(`/v1/budgets/food/months/${yearMonth}`);
      setMonth(m);
      setBudgetInput(String(m.budgetAmount));
      const nextCategoryInputs: CategoryBudgetInputs = {};
      for (const item of m.categoryBudgets ?? []) {
        nextCategoryInputs[item.category] =
          item.budgetAmount == null ? '' : String(item.budgetAmount);
      }
      setCategoryBudgetInputs(nextCategoryInputs);
      await fetchDaysFirst();
    } catch (e) {
      setMonth(null);
      setDays([]);
      setNextCursor(null);
      setError(e instanceof Error ? e.message : '오류');
    } finally {
      setLoading(false);
    }
  }, [requestJson, yearMonth, fetchDaysFirst]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore.current) return;
    loadingMore.current = true;
    try {
      const q = new URLSearchParams({
        limit: String(DAYS_PAGE_SIZE),
        category: categoryQuery,
        cursor: nextCursor,
      });
      const d = await requestJson<DaysListRes>(
        `/v1/budgets/food/months/${yearMonth}/days?${q.toString()}`,
      );
      setDays((prev) => [...prev, ...(d.items ?? [])]);
      setNextCursor(d.nextCursor ?? null);
    } catch {
      /* 무시: 목록 추가 실패 시 사용자는 아래로 다시 스크롤 가능 */
    } finally {
      loadingMore.current = false;
    }
  }, [nextCursor, requestJson, yearMonth, categoryQuery]);

  const loadRef = useRef(load);
  loadRef.current = load;

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadRef.current();
    }, [yearMonth]),
  );

  useEffect(() => {
    if (listCategoryEffectSkipInitial.current) {
      listCategoryEffectSkipInitial.current = false;
      return;
    }
    void (async () => {
      try {
        await fetchDaysFirstRef.current();
        setError(null);
      } catch (e) {
        setDays([]);
        setNextCursor(null);
        setError(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.');
      }
    })();
  }, [listCategory]);

  const openBudgetModal = () => {
    if (!month || !canEditBudget) return;
    setError(null);
    setBudgetInput(String(month.budgetAmount));
    const nextCategoryInputs: CategoryBudgetInputs = {};
    for (const item of month.categoryBudgets ?? []) {
      nextCategoryInputs[item.category] =
        item.budgetAmount == null ? '' : String(item.budgetAmount);
    }
    setCategoryBudgetInputs(nextCategoryInputs);
    setCategoryBudgetExpanded(false);
    setBudgetModalVisible(true);
  };

  const openExpenseAdd = () => {
    if (!month) return;
    setError(null);
    const today = toYmd(new Date());
    const todayYm = today.slice(0, 7);
    if (todayYm !== yearMonth) {
      setYearMonth(todayYm);
    }
    setExpenseMode('add');
    setEditingDayId(null);
    setExpenseDateStr(today);
    setFormAmount('');
    setFormMemo('');
    setFormCategoryId('other');
    setExpenseModalVisible(true);
  };

  const openExpenseEdit = (row: DayRow) => {
    if (!month) return;
    setError(null);
    setExpenseMode('edit');
    setEditingDayId(row.id);
    setExpenseDateStr(row.date);
    setFormAmount(String(row.amount));
    setFormMemo(row.memo ?? '');
    setFormCategoryId(coerceExpenseCategory(row.category));
    setExpenseModalVisible(true);
  };

  const closeExpenseModal = () => {
    setExpenseDatePickerVisible(false);
    setExpenseModalVisible(false);
  };

  const openExpenseDatePicker = useCallback(() => {
    if (expenseMode !== 'add') return;
    const min = firstDateOfYearMonth(yearMonth);
    const max = lastDateOfYearMonth(yearMonth);
    const raw =
      YMD_IN_MONTH.test(expenseDateStr) && dateInYearMonth(expenseDateStr, yearMonth)
        ? parseYmdLocal(expenseDateStr)
        : min;
    const value = clampDate(raw, min, max);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        minimumDate: min,
        maximumDate: max,
        onChange: (event, date) => {
          if (event.type !== 'set' || !date) return;
          setExpenseDateStr(ymdLocal(date));
        },
      });
      return;
    }
    setTempExpensePickerDate(value);
    setExpenseDatePickerVisible(true);
  }, [expenseMode, yearMonth, expenseDateStr]);

  const closeExpenseDatePickerDeferred = useCallback(() => {
    setTimeout(() => setExpenseDatePickerVisible(false), 220);
  }, []);

  const confirmExpenseDatePicker = useCallback(() => {
    const min = firstDateOfYearMonth(yearMonth);
    const max = lastDateOfYearMonth(yearMonth);
    setExpenseDateStr(ymdLocal(clampDate(tempExpensePickerDate, min, max)));
    closeExpenseDatePickerDeferred();
  }, [yearMonth, tempExpensePickerDate, closeExpenseDatePickerDeferred]);

  const saveBudget = async () => {
    const n = Number(budgetInput.replace(/,/g, ''));
    if (!Number.isFinite(n) || n < 0) {
      setError('예산 금액을 확인해 주세요.');
      return;
    }
    const categoryBudgetsPayload = EXPENSE_CATEGORIES.map((c) => ({
      category: c.id,
      budgetAmount: parseBudgetInputToInt(categoryBudgetInputs[c.id] ?? ''),
    }));
    setSaving(true);
    setError(null);
    try {
      await requestJson(`/v1/budgets/food/months/${yearMonth}`, {
        method: 'PUT',
        body: {
          budgetAmount: Math.round(n),
          categoryBudgets: categoryBudgetsPayload,
        },
      });
      await load();
      setBudgetModalVisible(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const saveExpense = async () => {
    const date = expenseDateStr.trim();
    if (!YMD_IN_MONTH.test(date) || !dateInYearMonth(date, yearMonth)) {
      setError('날짜는 보고 있는 달 안에서 선택해 주세요.');
      return;
    }
    const amt = Number(formAmount.replace(/,/g, ''));
    if (!Number.isFinite(amt) || amt < 0) {
      setError('금액을 확인해 주세요.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (expenseMode === 'edit' && editingDayId) {
        await requestJson(`/v1/budgets/food/months/${yearMonth}/days/items/${editingDayId}`, {
          method: 'PUT',
          body: {
            amount: Math.round(amt),
            memo: formMemo.trim() || undefined,
            category: formCategoryId,
          },
        });
      } else {
        await requestJson(`/v1/budgets/food/months/${yearMonth}/days/${date}`, {
          method: 'POST',
          body: {
            amount: Math.round(amt),
            memo: formMemo.trim() || undefined,
            category: formCategoryId,
          },
        });
      }
      await load();
      setExpenseModalVisible(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteExpense = () => {
    if (expenseMode !== 'edit' || !editingDayId) return;
    Alert.alert('기록 삭제', '이 지출을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setSaving(true);
            setError(null);
            try {
              await requestJson(`/v1/budgets/food/months/${yearMonth}/days/items/${editingDayId}`, {
                method: 'DELETE',
              });
              await load();
              setExpenseModalVisible(false);
            } catch (e) {
              setError(e instanceof Error ? e.message : '삭제 실패');
            } finally {
              setSaving(false);
            }
          })();
        },
      },
    ]);
  };

  const statRow = (label: string, value: string, valueColor?: string) => (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.sm,
      }}
    >
      <Muted>{label}</Muted>
      <Text
        style={{
          fontSize: 16,
          lineHeight: 22,
          color: valueColor ?? colors.text,
          fontFamily: fonts.title,
        }}
      >
        {value}
      </Text>
    </View>
  );

  const categorySummaries = (month?.categoryBudgets ?? [])
    .map((item) => {
      const info = EXPENSE_CATEGORIES.find((c) => c.id === item.category);
      return {
        ...item,
        label: info?.label ?? item.category,
      };
    })
    .sort((a, b) => (b.spentAmount || 0) - (a.spentAmount || 0));
  const topCategorySummaries = categorySummaries.slice(0, 3);
  const totalCategoryBudgeted = (month?.categoryBudgetStatus?.totalCategoryBudgeted ??
    categorySummaries.reduce((sum, item) => sum + (item.budgetAmount ?? 0), 0));
  const deltaFromMonthBudget =
    month?.categoryBudgetStatus?.deltaFromMonthBudget ??
    totalCategoryBudgeted - (month?.budgetAmount ?? 0);
  const overBudgetAmount = Math.max(0, deltaFromMonthBudget);
  const unsetCategoryCount =
    month?.categoryBudgetStatus?.unsetCategoryCount ??
    categorySummaries.filter((item) => item.budgetAmount == null).length;
  const budgetStatusTone =
    overBudgetAmount > 0
      ? colors.error
      : unsetCategoryCount > 0
        ? colors.textMuted
        : colors.primary;
  const budgetStatusText =
    overBudgetAmount > 0
      ? `주의 · 카테고리 합계가 월 예산보다 ${formatKrw(overBudgetAmount)} 많아요`
      : unsetCategoryCount > 0
        ? `미설정 · ${unsetCategoryCount}개 카테고리 예산을 아직 정하지 않았어요`
        : '정상 · 카테고리 예산 합계가 월 예산 범위 안에 있어요';
  const draftMonthBudget = Number(budgetInput.replace(/,/g, ''));
  const safeDraftMonthBudget =
    Number.isFinite(draftMonthBudget) && draftMonthBudget >= 0 ? Math.round(draftMonthBudget) : 0;
  const draftTotalCategoryBudgeted = EXPENSE_CATEGORIES.reduce(
    (sum, c) => sum + (parseBudgetInputToInt(categoryBudgetInputs[c.id] ?? '') ?? 0),
    0,
  );
  const draftUnsetCategoryCount = EXPENSE_CATEGORIES.filter(
    (c) => parseBudgetInputToInt(categoryBudgetInputs[c.id] ?? '') == null,
  ).length;
  const draftOverBudgetAmount = Math.max(0, draftTotalCategoryBudgeted - safeDraftMonthBudget);
  const draftBudgetStatusTone =
    draftOverBudgetAmount > 0
      ? colors.error
      : draftUnsetCategoryCount > 0
        ? colors.textMuted
        : colors.primary;
  const draftBudgetStatusText =
    draftOverBudgetAmount > 0
      ? `주의 · 카테고리 합계가 월 예산보다 ${formatKrw(draftOverBudgetAmount)} 많아요`
      : draftUnsetCategoryCount > 0
        ? `미설정 · ${draftUnsetCategoryCount}개 카테고리 예산을 아직 정하지 않았어요`
        : '정상 · 카테고리 예산 합계가 월 예산 범위 안에 있어요';

  const header = (
    <View
      style={{
        paddingTop: insets.top + spacing.xl,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
        gap: spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <Pressable
            onPress={() => setYearMonth((ym) => shiftYearMonth(ym, -1))}
            accessibilityRole="button"
            accessibilityLabel="이전 달"
            hitSlop={12}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: spacing.xs })}
          >
            <MaterialIcons name="chevron-left" size={28} color={colors.text} />
          </Pressable>
        </View>
        <View style={{ flex: 2, alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 18,
              lineHeight: 24,
              color: colors.text,
              fontFamily: fonts.title,
            }}
          >
            {formatYearMonthLabel(yearMonth)}
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Pressable
            onPress={() => setYearMonth((ym) => shiftYearMonth(ym, 1))}
            accessibilityRole="button"
            accessibilityLabel="다음 달"
            hitSlop={12}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: spacing.xs })}
          >
            <MaterialIcons name="chevron-right" size={28} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {error && !budgetModalVisible && !expenseModalVisible ? <ErrorText>{error}</ErrorText> : null}
      {!month && error ? (
        <SecondaryButton title="재시도" onPress={() => { setLoading(true); void load(); }} />
      ) : null}

      {month ? (
        <Card style={{ gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Muted>남은 금액</Muted>
            <Pressable
              onPress={openBudgetModal}
              disabled={!canEditBudget}
              accessibilityRole="button"
              accessibilityLabel="월 예산 설정"
              accessibilityState={{ disabled: !canEditBudget }}
              hitSlop={10}
              style={({ pressed }) => ({
                opacity: !canEditBudget ? 0.35 : pressed ? 0.65 : 1,
                padding: spacing.xs,
              })}
            >
              <MaterialIcons
                name="account-balance-wallet"
                size={24}
                color={canEditBudget ? colors.primary : colors.textMuted}
              />
            </Pressable>
          </View>
          <Text
            style={{
              fontSize: 28,
              lineHeight: 36,
              color: colors.primary,
              fontFamily: fonts.title,
            }}
          >
            {formatKrw(month.remainingAmount)}
          </Text>
          {statRow('이번 달 예산', formatKrw(month.budgetAmount))}
          {statRow('카테고리 예산 합계', formatKrw(totalCategoryBudgeted))}
          {statRow('누적 사용', formatKrw(month.spentAmount))}
          <Text
            style={{
              marginTop: spacing.sm,
              fontSize: 13,
              lineHeight: 18,
              color: budgetStatusTone,
              fontFamily: fonts.bodyMedium,
            }}
          >
            {budgetStatusText}
          </Text>
          {topCategorySummaries.length > 0 ? (
            <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
              {topCategorySummaries.map((item) => (
                <View
                  key={item.category}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Muted>{item.label}</Muted>
                  <Text style={{ color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18 }}>
                    {`${formatKrw(item.spentAmount)} / ${item.budgetAmount == null ? '미설정' : formatKrw(item.budgetAmount)}`}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </Card>
      ) : null}

      {month ? (
        <View style={{ gap: spacing.sm }}>
          <Text
            style={{ fontSize: 17, lineHeight: 24, color: colors.text, fontFamily: fonts.title, paddingHorizontal: spacing.xs }}
          >
            최근 기록
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.xs, paddingBottom: spacing.xs }}
          >
            <Chip
              label="전체"
              selected={listCategory === 'all'}
              onPress={() => setListCategory('all')}
            />
            {EXPENSE_CATEGORIES.map((c) => (
              <Chip
                key={c.id}
                label={c.label}
                selected={listCategory === c.id}
                onPress={() => setListCategory(c.id)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );

  const renderItem: ListRenderItem<DayRow> = ({ item }) => {
    const iconName = iconForExpenseCategory(item.category);
    return (
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.sm }}>
        <ListItem
          onPress={() => openExpenseEdit(item)}
          title={
            <View style={{ gap: 2 }}>
              <Muted>{formatDayInMonthLabel(item.date)}</Muted>
              <Body size="md">{item.memo?.trim() ? item.memo : '지출'}</Body>
            </View>
          }
          trailing={
            <Text
              style={{
                fontSize: 16,
                lineHeight: 22,
                color: colors.text,
                fontFamily: fonts.title,
              }}
            >
              {`-${item.amount.toLocaleString('ko-KR')}`}
            </Text>
          }
          leading={<MaterialIcons name={iconName} size={24} color={colors.primary} />}
        />
      </View>
    );
  };

  const budgetModal = (
    <Modal
      visible={budgetModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setBudgetModalVisible(false)}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 48 : 0}
      >
        <Overlay>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Card style={{ gap: spacing.sm }}>
              <Title>월 예산</Title>
              {error ? <ErrorText>{error}</ErrorText> : null}
              <Muted>{`${formatYearMonthLabel(yearMonth)} 예산 (원)`}</Muted>
              <Input value={budgetInput} onChangeText={setBudgetInput} keyboardType="number-pad" />
              <FieldLabel>카테고리 예산 (선택)</FieldLabel>
              <Muted>합계가 월 예산과 달라도 저장할 수 있어요. 초과 시 안내가 표시됩니다.</Muted>
              <View style={{ gap: spacing.sm }}>
                {EXPENSE_CATEGORIES.filter(
                  (c) =>
                    priorityCategoryIds.includes(c.id) ||
                    categoryBudgetExpanded,
                ).map((c) => (
                  <View key={c.id} style={{ gap: 6 }}>
                    <Muted>{c.label}</Muted>
                    <Input
                      value={categoryBudgetInputs[c.id] ?? ''}
                      onChangeText={(v) =>
                        setCategoryBudgetInputs((prev) => ({ ...prev, [c.id]: v }))
                      }
                      keyboardType="number-pad"
                      placeholder="미설정"
                    />
                  </View>
                ))}
                <Pressable
                  onPress={() => setCategoryBudgetExpanded((v) => !v)}
                  accessibilityRole="button"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, paddingVertical: 4 })}
                >
                  <Text style={{ color: colors.primary, fontFamily: fonts.bodyMedium, fontSize: 14 }}>
                    {categoryBudgetExpanded ? '카테고리 접기' : '카테고리 더 보기'}
                  </Text>
                </Pressable>
              </View>
              <Text
                style={{
                  fontSize: 13,
                  lineHeight: 18,
                  color: draftBudgetStatusTone,
                  fontFamily: fonts.bodyMedium,
                }}
              >
                {`카테고리 합계 ${formatKrw(draftTotalCategoryBudgeted)} · ${draftBudgetStatusText}`}
              </Text>
              <PrimaryButton title="저장" onPress={() => void saveBudget()} loading={saving} />
              <SecondaryButton title="닫기" onPress={() => { setError(null); setBudgetModalVisible(false); }} />
            </Card>
          </ScrollView>
        </Overlay>
      </KeyboardAvoidingView>
    </Modal>
  );

  const expenseModal = (
    <Modal
      visible={expenseModalVisible}
      transparent
      animationType="fade"
      onRequestClose={closeExpenseModal}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 48 : 0}
      >
        <Overlay>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Card style={{ gap: spacing.sm }}>
              <Title>{expenseMode === 'add' ? '지출 기록' : '지출 수정'}</Title>
              {error ? <ErrorText>{error}</ErrorText> : null}
              {expenseMode === 'edit' ? (
                <Muted>{formatDayInMonthLabel(expenseDateStr)}</Muted>
              ) : (
                <>
                  <FieldLabel>날짜</FieldLabel>
                  <Pressable
                    onPress={openExpenseDatePicker}
                    disabled={saving}
                    accessibilityRole="button"
                    accessibilityLabel="날짜 변경"
                    style={({ pressed }) => ({
                      opacity: saving ? 0.5 : pressed ? 0.85 : 1,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      minHeight: 44,
                      justifyContent: 'center',
                      borderColor: colors.border,
                      borderRadius: 8,
                      borderWidth: StyleSheet.hairlineWidth,
                      backgroundColor: colors.cardMuted,
                    })}
                  >
                    <Text style={{ fontFamily: fonts.bodyMedium, color: colors.text, fontSize: 15 }}>
                      {formatDayInMonthLabel(expenseDateStr)}
                    </Text>
                  </Pressable>
                </>
              )}
              <FieldLabel>카테고리</FieldLabel>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {EXPENSE_CATEGORIES.map((c) => (
                  <Chip
                    key={c.id}
                    label={c.label}
                    selected={formCategoryId === c.id}
                    onPress={() => setFormCategoryId(c.id)}
                  />
                ))}
              </View>
              <FieldLabel>금액 (원)</FieldLabel>
              <Input value={formAmount} onChangeText={setFormAmount} keyboardType="number-pad" editable={!saving} />
              <FieldLabel>메모</FieldLabel>
              <Input
                value={formMemo}
                onChangeText={setFormMemo}
                placeholder="점심, 커피 등"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!saving}
              />
              <PrimaryButton
                title="저장"
                onPress={() => void saveExpense()}
                loading={saving}
                leading={<MaterialIcons name="save" size={20} color={colors.onPrimary} />}
              />
              {expenseMode === 'edit' ? (
                <Pressable
                  onPress={confirmDeleteExpense}
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityLabel="지출 삭제"
                  style={{ paddingVertical: spacing.md, alignItems: 'center' }}
                >
                  <Text style={{ color: colors.error, fontFamily: fonts.bodyMedium, fontSize: 16 }}>삭제</Text>
                </Pressable>
              ) : null}
              <SecondaryButton
                title="닫기"
                onPress={() => {
                  setError(null);
                  closeExpenseModal();
                }}
              />
            </Card>
          </ScrollView>
        </Overlay>
      </KeyboardAvoidingView>
    </Modal>
  );

  const expenseMonthMinDate = firstDateOfYearMonth(yearMonth);
  const expenseMonthMaxDate = lastDateOfYearMonth(yearMonth);

  const expenseDateIosPickerModal = (
    <Modal
      visible={expenseDatePickerVisible}
      transparent
      animationType="slide"
      onRequestClose={closeExpenseDatePickerDeferred}
    >
      <Pressable
        style={[pickerOverlayStyles.root, { backgroundColor: colors.overlay }]}
        onPress={closeExpenseDatePickerDeferred}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Card style={{ gap: spacing.md, margin: spacing.lg }}>
            <Title>날짜 선택</Title>
            <DateTimePicker
              value={tempExpensePickerDate}
              mode="date"
              display="spinner"
              minimumDate={expenseMonthMinDate}
              maximumDate={expenseMonthMaxDate}
              onChange={(_, d) => {
                if (d) setTempExpensePickerDate(d);
              }}
            />
            <PrimaryButton title="확인" onPress={confirmExpenseDatePicker} />
            <SecondaryButton title="취소" onPress={closeExpenseDatePickerDeferred} />
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  );

  const fab = month ? (
    <Pressable
      onPress={openExpenseAdd}
      accessibilityRole="button"
      accessibilityLabel="지출 기록"
      style={{
        position: 'absolute',
        right: spacing.lg,
        bottom: insets.bottom + spacing.xl,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      }}
    >
      <MaterialIcons name="add" size={28} color={colors.onPrimary} />
    </Pressable>
  ) : null;

  if (loading && !month) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {header}
        <LoadingBlock />
        {budgetModal}
        {expenseModal}
        {expenseDateIosPickerModal}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        style={{ flex: 1 }}
        data={days}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.35}
        ListEmptyComponent={
          month ? (
            <View style={{ paddingHorizontal: spacing.lg, alignItems: 'center', gap: spacing.sm }}>
              <MaterialIcons name="inventory-2" size={40} color={colors.textMuted} />
              <EmptyState text="기록이 없어요" />
              <Muted>지출을 기록하면 여기에 나타납니다.</Muted>
            </View>
          ) : null
        }
        renderItem={renderItem}
      />
      {fab}
      {budgetModal}
      {expenseModal}
      {expenseDateIosPickerModal}
    </View>
  );
}

const pickerOverlayStyles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});
