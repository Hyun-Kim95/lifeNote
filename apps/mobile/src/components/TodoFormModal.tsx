import { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useApi } from '../api/useApi';
import {
  isUtcMidnightDueAt,
  type Todo,
  type TodoDayPeriodApi,
  type TodoScheduleType,
} from '../todos/todoModel';
import {
  Card,
  Chip,
  ErrorText,
  FieldLabel,
  Input,
  Muted,
  Overlay,
  PrimaryButton,
  SecondaryButton,
  Title,
} from './Ui';
import { useAppTheme } from '../theme/ThemeContext';
import { firstYmdOfMonth, lastYmdOfMonth, weekSundayYmd } from '../lib/week';

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidYmd(s: string): boolean {
  const t = s.trim();
  if (!YMD_RE.test(t)) return false;
  const d = new Date(`${t}T12:00:00Z`);
  return !Number.isNaN(d.getTime());
}

function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseYmdLocal(ymd: string): Date {
  const [y, mo, d] = ymd.split('-').map(Number);
  return new Date(y, mo - 1, d, 12, 0, 0, 0);
}

function combineLocalYmdAndTime(ymd: string, timePort: Date): string {
  const [y, mo, d] = ymd.trim().split('-').map(Number);
  const c = new Date(y, mo - 1, d, timePort.getHours(), timePort.getMinutes(), 0, 0);
  return c.toISOString();
}

const weekdayOptions = [
  { label: '월', value: 1 },
  { label: '화', value: 2 },
  { label: '수', value: 3 },
  { label: '목', value: 4 },
  { label: '금', value: 5 },
  { label: '토', value: 6 },
  { label: '일', value: 7 },
];

const scheduleOptions: Array<{ label: string; value: TodoScheduleType }> = [
  { label: '특정 날짜', value: 'once' },
  { label: '언젠가', value: 'someday' },
  { label: '매일', value: 'daily' },
  { label: '매주', value: 'weekly' },
  { label: '매월', value: 'monthly' },
  { label: '간격', value: 'interval' },
];

const priorityOptions: Array<{ label: string; value: 'low' | 'normal' | 'high' }> = [
  { label: '낮음', value: 'low' },
  { label: '보통', value: 'normal' },
  { label: '높음', value: 'high' },
];

type PickerTarget = 'onceDate' | 'onceTime' | 'start' | 'end' | null;

function buildBody(
  title: string,
  priority: 'low' | 'normal' | 'high',
  scheduleType: TodoScheduleType,
  onceDate: string,
  startDate: string,
  endDate: string,
  weekdays: number[],
  monthDay: string,
  intervalDays: string,
  useOnceTime: boolean,
  onceTimePort: Date,
  dayPeriod: TodoDayPeriodApi,
): { ok: true; body: Record<string, unknown> } | { ok: false; error: string } {
  if (!title.trim()) {
    return { ok: false, error: '제목을 입력하세요.' };
  }

  if (scheduleType === 'someday') {
    return {
      ok: true,
      body: {
        title: title.trim(),
        priority,
        scheduleType: 'someday',
      },
    };
  }

  const normalizedEndDate = endDate.trim();
  if (normalizedEndDate && !isValidYmd(normalizedEndDate)) {
    return { ok: false, error: '종료일은 YYYY-MM-DD 형식이어야 합니다.' };
  }

  const payload: Record<string, unknown> = {
    title: title.trim(),
    priority,
    scheduleType,
    dayPeriod,
    ...(normalizedEndDate ? { endDate: normalizedEndDate } : {}),
  };

  if (scheduleType === 'once') {
    if (!isValidYmd(onceDate)) {
      return { ok: false, error: '날짜를 선택하세요.' };
    }
    const y = onceDate.trim();
    payload.dueOn = y;
    payload.startDate = y;
    if (useOnceTime) {
      payload.dueAt = combineLocalYmdAndTime(y, onceTimePort);
    } else {
      payload.dueAt = `${y}T00:00:00.000Z`;
    }
  }

  if (scheduleType === 'daily') {
    if (startDate.trim() && !isValidYmd(startDate)) {
      return { ok: false, error: '시작일 형식이 올바르지 않습니다.' };
    }
    if (startDate.trim()) {
      payload.startDate = startDate.trim();
    }
  }

  if (scheduleType === 'weekly') {
    if (weekdays.length === 0) {
      return { ok: false, error: '매주는 요일을 1개 이상 선택해야 합니다.' };
    }
    if (startDate.trim() && !isValidYmd(startDate)) {
      return { ok: false, error: '시작일 형식이 올바르지 않습니다.' };
    }
    payload.weekdays = weekdays;
    if (startDate.trim()) {
      payload.startDate = startDate.trim();
    }
  }

  if (scheduleType === 'monthly') {
    const n = Number(monthDay);
    if (!Number.isInteger(n) || n < 1 || n > 31) {
      return { ok: false, error: '매월 반복일은 1~31 사이 숫자여야 합니다.' };
    }
    if (startDate.trim() && !isValidYmd(startDate)) {
      return { ok: false, error: '시작일 형식이 올바르지 않습니다.' };
    }
    payload.monthDay = n;
    if (startDate.trim()) {
      payload.startDate = startDate.trim();
    }
  }

  if (scheduleType === 'interval') {
    const every = Number(intervalDays);
    if (!Number.isInteger(every) || every < 1) {
      return { ok: false, error: '간격은 1 이상의 숫자여야 합니다.' };
    }
    if (!isValidYmd(startDate)) {
      return { ok: false, error: '간격 반복은 시작일이 필요합니다.' };
    }
    payload.intervalDays = every;
    payload.startDate = startDate.trim();
  }

  return { ok: true, body: payload };
}

function resetFormFromTodo(t: Todo, todayYmd: string) {
  let useOnceTime = false;
  let onceTimePort = new Date();
  if (t.scheduleType === 'once' && t.dueAt && !isUtcMidnightDueAt(t.dueAt)) {
    useOnceTime = true;
    onceTimePort = new Date(t.dueAt);
  }
  const dayPeriod: TodoDayPeriodApi =
    t.dayPeriod === 'am' || t.dayPeriod === 'pm' || t.dayPeriod === 'all_day'
      ? t.dayPeriod
      : 'all_day';
  return {
    title: t.title,
    priority: t.priority,
    scheduleType: t.scheduleType,
    onceDate: (t.dueOn ?? t.startDate ?? todayYmd).trim() || todayYmd,
    startDate: (t.startDate ?? todayYmd).trim() || todayYmd,
    endDate: t.endDate?.trim() ?? '',
    weekdays: [...(t.weekdays ?? [])].sort((a, b) => a - b),
    monthDay: t.monthDay != null ? String(t.monthDay) : '',
    intervalDays: t.intervalDays != null ? String(t.intervalDays) : '',
    useOnceTime,
    onceTimePort,
    dayPeriod,
  };
}

export type TodoPlanSlotDraft = {
  planSlotId: string;
  label: string;
  dayOfWeek: number;
  weekStart: string;
};

export type TodoScheduleRangePrefill =
  | { kind: 'week'; weekStart: string }
  | { kind: 'month'; yearMonth: string };

export type TodoFormModalProps = {
  visible: boolean;
  mode: 'create' | 'edit';
  todo: Todo | null;
  todayYmd: string;
  /** 주간 슬롯에서 열 때: 제목·매주·요일·시작일(주의 월요일) 프리필 + 생성 시 planSlotId 전달 */
  initialPlanSlotDraft?: TodoPlanSlotDraft | null;
  /** 주별·월별 탭 FAB: 해당 주·달 범위로 일정 프리필 */
  scheduleRangePrefill?: TodoScheduleRangePrefill | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

export function TodoFormModal({
  visible,
  mode,
  todo,
  todayYmd,
  initialPlanSlotDraft,
  scheduleRangePrefill,
  onClose,
  onSaved,
}: TodoFormModalProps) {
  const { colors, fonts, spacing, radius, stroke } = useAppTheme();
  const { requestJson } = useApi();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [scheduleType, setScheduleType] = useState<TodoScheduleType>('once');
  const [onceDate, setOnceDate] = useState(todayYmd);
  const [startDate, setStartDate] = useState(todayYmd);
  const [endDate, setEndDate] = useState('');
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [monthDay, setMonthDay] = useState('');
  const [intervalDays, setIntervalDays] = useState('');
  const [useOnceTime, setUseOnceTime] = useState(false);
  const [onceTimePort, setOnceTimePort] = useState(() => new Date());
  const [dayPeriod, setDayPeriod] = useState<TodoDayPeriodApi>('all_day');
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [tempPickerDate, setTempPickerDate] = useState(() => new Date());
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const applyDefaults = useCallback(() => {
    setTitle('');
    setPriority('normal');
    setScheduleType('once');
    setOnceDate(todayYmd);
    setStartDate(todayYmd);
    setEndDate('');
    setWeekdays([]);
    setMonthDay('');
    setIntervalDays('');
    setUseOnceTime(false);
    setOnceTimePort(new Date());
    setDayPeriod('all_day');
    setPickerTarget(null);
    setLocalError(null);
  }, [todayYmd]);

  useEffect(() => {
    if (!visible) return;
    setLocalError(null);
    if (mode === 'edit' && todo) {
      const f = resetFormFromTodo(todo, todayYmd);
      setTitle(f.title);
      setPriority(f.priority);
      setScheduleType(f.scheduleType);
      setOnceDate(f.onceDate);
      setStartDate(f.startDate);
      setEndDate(f.endDate);
      setWeekdays(f.weekdays);
      setMonthDay(f.monthDay);
      setIntervalDays(f.intervalDays);
      setUseOnceTime(f.useOnceTime);
      setOnceTimePort(f.onceTimePort);
      setDayPeriod(f.dayPeriod);
    } else if (mode === 'create' && initialPlanSlotDraft) {
      setTitle(initialPlanSlotDraft.label);
      setPriority('normal');
      setScheduleType('weekly');
      setWeekdays([initialPlanSlotDraft.dayOfWeek]);
      setStartDate(initialPlanSlotDraft.weekStart);
      setEndDate('');
      setOnceDate(todayYmd);
      setMonthDay('');
      setIntervalDays('');
      setUseOnceTime(false);
      setOnceTimePort(new Date());
      setDayPeriod('all_day');
      setPickerTarget(null);
    } else if (mode === 'create' && scheduleRangePrefill?.kind === 'week') {
      applyDefaults();
      setScheduleType('daily');
      setStartDate(scheduleRangePrefill.weekStart);
      setEndDate(weekSundayYmd(scheduleRangePrefill.weekStart));
      setDayPeriod('all_day');
    } else if (mode === 'create' && scheduleRangePrefill?.kind === 'month') {
      applyDefaults();
      setScheduleType('daily');
      setStartDate(firstYmdOfMonth(scheduleRangePrefill.yearMonth));
      setEndDate(lastYmdOfMonth(scheduleRangePrefill.yearMonth));
      setDayPeriod('all_day');
    } else {
      applyDefaults();
    }
  }, [visible, mode, todo, todayYmd, applyDefaults, initialPlanSlotDraft, scheduleRangePrefill]);

  /** 모달을 닫은 직후 터치가 아래 날짜 버튼으로 전달되어 피커가 다시 뜨는 것을 막음 */
  const closePickerModalDeferred = useCallback(() => {
    setTimeout(() => setPickerTarget(null), 220);
  }, []);

  const openDatePicker = (target: Exclude<PickerTarget, 'onceTime' | null>) => {
    if (Platform.OS === 'android') {
      const value =
        target === 'onceDate'
          ? parseYmdLocal(onceDate)
          : target === 'start'
            ? startDate.trim()
              ? parseYmdLocal(startDate)
              : parseYmdLocal(todayYmd)
            : endDate.trim()
              ? parseYmdLocal(endDate)
              : parseYmdLocal(todayYmd);
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        onChange: (event, date) => {
          if (event.type !== 'set' || !date) return;
          if (target === 'onceDate') setOnceDate(ymdLocal(date));
          else if (target === 'start') setStartDate(ymdLocal(date));
          else setEndDate(ymdLocal(date));
        },
      });
      return;
    }
    if (target === 'onceDate') {
      setTempPickerDate(parseYmdLocal(onceDate));
    } else if (target === 'start') {
      setTempPickerDate(startDate.trim() ? parseYmdLocal(startDate) : parseYmdLocal(todayYmd));
    } else {
      setTempPickerDate(endDate.trim() ? parseYmdLocal(endDate) : parseYmdLocal(todayYmd));
    }
    setPickerTarget(target);
  };

  const confirmDatePicker = () => {
    if (pickerTarget === 'onceDate') {
      setOnceDate(ymdLocal(tempPickerDate));
    } else if (pickerTarget === 'start') {
      setStartDate(ymdLocal(tempPickerDate));
    } else if (pickerTarget === 'end') {
      setEndDate(ymdLocal(tempPickerDate));
    }
    closePickerModalDeferred();
  };

  const openOnceTimePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: onceTimePort,
        mode: 'time',
        is24Hour: true,
        onChange: (event, d) => {
          if (event.type === 'set' && d) setOnceTimePort(d);
        },
      });
      return;
    }
    setTempPickerDate(new Date(onceTimePort.getTime()));
    setPickerTarget('onceTime');
  };

  const confirmTimePicker = () => {
    setOnceTimePort(tempPickerDate);
    closePickerModalDeferred();
  };

  const submit = async () => {
    const built = buildBody(
      title,
      priority,
      scheduleType,
      onceDate,
      startDate,
      endDate,
      weekdays,
      monthDay,
      intervalDays,
      useOnceTime,
      onceTimePort,
      dayPeriod,
    );
    if (!built.ok) {
      setLocalError(built.error);
      return;
    }
    setSaving(true);
    setLocalError(null);
    try {
      if (mode === 'create') {
        const body: Record<string, unknown> = { ...built.body };
        if (initialPlanSlotDraft?.planSlotId) {
          body.planSlotId = initialPlanSlotDraft.planSlotId;
        }
        await requestJson('/v1/todos', { method: 'POST', body });
      } else if (todo) {
        await requestJson(`/v1/todos/${todo.id}`, { method: 'PATCH', body: built.body });
      }
      await onSaved();
      onClose();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const heading = mode === 'create' ? '할 일 추가' : '할 일 수정';

  const dateButtonLabel = (ymd: string, empty: string) =>
    ymd.trim() && isValidYmd(ymd) ? ymd.trim() : empty;

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 48 : 0}
        >
          <Overlay>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: spacing.xl }}
            >
              <Card style={{ gap: spacing.sm }}>
                <Title>{heading}</Title>
                {localError ? <ErrorText>{localError}</ErrorText> : null}
                <Input value={title} onChangeText={setTitle} placeholder="제목" />
                <FieldLabel>우선순위</FieldLabel>
                <View style={styles.chipWrap}>
                  {priorityOptions.map((option) => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      selected={priority === option.value}
                      onPress={() => setPriority(option.value)}
                    />
                  ))}
                </View>
                {scheduleType !== 'someday' ? (
                  <>
                    <FieldLabel>시간대</FieldLabel>
                    <View style={styles.chipWrap}>
                      <Chip label="종일" selected={dayPeriod === 'all_day'} onPress={() => setDayPeriod('all_day')} />
                      <Chip label="오전" selected={dayPeriod === 'am'} onPress={() => setDayPeriod('am')} />
                      <Chip label="오후" selected={dayPeriod === 'pm'} onPress={() => setDayPeriod('pm')} />
                    </View>
                  </>
                ) : null}
                <FieldLabel>일정 유형</FieldLabel>
                <View style={styles.chipWrap}>
                  {scheduleOptions.map((option) => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      selected={scheduleType === option.value}
                      onPress={() => {
                        setScheduleType(option.value);
                        setUseOnceTime(false);
                      }}
                    />
                  ))}
                </View>

                {scheduleType === 'once' ? (
                  <>
                    <FieldLabel>날짜</FieldLabel>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="날짜 선택"
                      onPress={() => openDatePicker('onceDate')}
                      style={[
                        styles.dateBtn,
                        {
                          borderColor: colors.border,
                          borderRadius: radius.sm,
                          borderWidth: stroke.width,
                          backgroundColor: colors.cardMuted,
                        },
                      ]}
                    >
                      <Text style={{ fontFamily: fonts.bodyMedium, color: colors.text, fontSize: 15 }}>
                        {dateButtonLabel(onceDate, '탭하여 날짜 선택')}
                      </Text>
                    </Pressable>
                    <FieldLabel>시간 (선택)</FieldLabel>
                    <View style={styles.chipWrap}>
                      <Chip
                        label="종일"
                        selected={!useOnceTime}
                        onPress={() => setUseOnceTime(false)}
                      />
                      <Chip label="시간 지정" selected={useOnceTime} onPress={() => setUseOnceTime(true)} />
                    </View>
                    {useOnceTime ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="시간 선택"
                        onPress={() => openOnceTimePicker()}
                        style={[
                          styles.dateBtn,
                          {
                            borderColor: colors.border,
                            borderRadius: radius.sm,
                            borderWidth: stroke.width,
                            backgroundColor: colors.cardMuted,
                          },
                        ]}
                      >
                        <Text style={{ fontFamily: fonts.bodyMedium, color: colors.text, fontSize: 15 }}>
                          {onceTimePort.toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })}
                        </Text>
                      </Pressable>
                    ) : null}
                  </>
                ) : null}

                {scheduleType === 'weekly' ? (
                  <>
                    <FieldLabel>요일 선택</FieldLabel>
                    <View style={styles.chipWrap}>
                      {weekdayOptions.map((option) => (
                        <Chip
                          key={option.value}
                          label={option.label}
                          selected={weekdays.includes(option.value)}
                          onPress={() => {
                            setWeekdays((prev) =>
                              prev.includes(option.value)
                                ? prev.filter((v) => v !== option.value)
                                : [...prev, option.value].sort((a, b) => a - b),
                            );
                          }}
                        />
                      ))}
                    </View>
                  </>
                ) : null}

                {scheduleType === 'monthly' ? (
                  <>
                    <FieldLabel>매월 반복일</FieldLabel>
                    <Input
                      value={monthDay}
                      onChangeText={setMonthDay}
                      placeholder="1~31"
                      keyboardType="number-pad"
                    />
                  </>
                ) : null}

                {scheduleType === 'interval' ? (
                  <>
                    <FieldLabel>간격(일)</FieldLabel>
                    <Input
                      value={intervalDays}
                      onChangeText={setIntervalDays}
                      placeholder="예: 3"
                      keyboardType="number-pad"
                    />
                  </>
                ) : null}

                {scheduleType !== 'once' && scheduleType !== 'someday' ? (
                  <>
                    <FieldLabel>{scheduleType === 'interval' ? '시작일' : '시작일 (선택)'}</FieldLabel>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="시작일 선택"
                      onPress={() => openDatePicker('start')}
                      style={[
                        styles.dateBtn,
                        {
                          borderColor: colors.border,
                          borderRadius: radius.sm,
                          borderWidth: stroke.width,
                          backgroundColor: colors.cardMuted,
                        },
                      ]}
                    >
                      <Text style={{ fontFamily: fonts.bodyMedium, color: colors.text, fontSize: 15 }}>
                        {dateButtonLabel(startDate, '탭하여 시작일')}
                      </Text>
                    </Pressable>
                    <FieldLabel>종료일 (선택)</FieldLabel>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="종료일 선택"
                      onPress={() => openDatePicker('end')}
                      style={[
                        styles.dateBtn,
                        {
                          borderColor: colors.border,
                          borderRadius: radius.sm,
                          borderWidth: stroke.width,
                          backgroundColor: colors.cardMuted,
                        },
                      ]}
                    >
                      <Text style={{ fontFamily: fonts.bodyMedium, color: colors.text, fontSize: 15 }}>
                        {endDate.trim() ? endDate.trim() : '탭하여 종료일 (선택)'}
                      </Text>
                    </Pressable>
                  </>
                ) : null}

                {scheduleType === 'someday' ? (
                  <Muted>특정 날짜 없이 나중에 처리할 일로 추가됩니다.</Muted>
                ) : (
                  <Muted>
                    {mode === 'edit'
                      ? '일정 유형을 바꾸면 아래 필드를 새 규칙에 맞게 확인하세요.'
                      : '날짜·시간은 기기 로컬 기준입니다. 달력 피커 사용 시 앱을 네이티브로 다시 빌드하세요.'}
                  </Muted>
                )}
                <PrimaryButton
                  title={mode === 'create' ? '추가' : '저장'}
                  onPress={() => void submit()}
                  loading={saving}
                  disabled={!title.trim()}
                />
                <SecondaryButton title="닫기" onPress={onClose} />
              </Card>
            </ScrollView>
          </Overlay>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={pickerTarget === 'onceDate' || pickerTarget === 'start' || pickerTarget === 'end'} transparent animationType="slide">
        <Pressable style={[styles.pickerOverlay, { backgroundColor: colors.overlay }]} onPress={closePickerModalDeferred}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Card style={{ gap: spacing.md, margin: spacing.lg }}>
              <Title>
                {pickerTarget === 'onceDate'
                  ? '날짜 선택'
                  : pickerTarget === 'start'
                    ? '시작일 선택'
                    : '종료일 선택'}
              </Title>
              <DateTimePicker
                value={tempPickerDate}
                mode="date"
                display="spinner"
                onChange={(_, d) => {
                  if (d) setTempPickerDate(d);
                }}
              />
              <PrimaryButton title="확인" onPress={confirmDatePicker} />
              <SecondaryButton title="취소" onPress={closePickerModalDeferred} />
            </Card>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={pickerTarget === 'onceTime'} transparent animationType="slide">
        <Pressable style={[styles.pickerOverlay, { backgroundColor: colors.overlay }]} onPress={closePickerModalDeferred}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Card style={{ gap: spacing.md, margin: spacing.lg }}>
              <Title>시간 선택</Title>
              <DateTimePicker
                value={tempPickerDate}
                mode="time"
                display="spinner"
                is24Hour
                onChange={(_, d) => {
                  if (d) setTempPickerDate(d);
                }}
              />
              <PrimaryButton title="확인" onPress={confirmTimePicker} />
              <SecondaryButton title="취소" onPress={closePickerModalDeferred} />
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: 'center',
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});
