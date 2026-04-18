export type TodoScheduleType =
  | 'once'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'interval'
  | 'someday';

export type TodoDayPeriodApi = 'all_day' | 'am' | 'pm';

export type Todo = {
  id: string;
  title: string;
  done: boolean;
  priority: 'low' | 'normal' | 'high';
  dueOn?: string | null;
  /** ISO 8601, 정렬·시각 표시 */
  dueAt?: string | null;
  scheduleType: TodoScheduleType;
  startDate?: string | null;
  endDate?: string | null;
  weekdays?: number[];
  monthDay?: number | null;
  intervalDays?: number | null;
  /** 종일·오전·오후(미지정 null) */
  dayPeriod?: TodoDayPeriodApi | null;
  /** 주간 계획 슬롯에서 생성 시 */
  planSlotId?: string | null;
};

export const priorityLabel: Record<string, string> = {
  low: '낮음',
  normal: '보통',
  high: '높음',
};

export const scheduleTypeLabel: Record<TodoScheduleType, string> = {
  once: '특정 날짜',
  daily: '매일',
  weekly: '매주',
  monthly: '매월',
  interval: '간격',
  someday: '언젠가',
};

export const dayPeriodLabel: Record<TodoDayPeriodApi, string> = {
  all_day: '종일',
  am: '오전',
  pm: '오후',
};

const weekdayOptions = [
  { label: '월', value: 1 },
  { label: '화', value: 2 },
  { label: '수', value: 3 },
  { label: '목', value: 4 },
  { label: '금', value: 5 },
  { label: '토', value: 6 },
  { label: '일', value: 7 },
];

export function describeSchedule(todo: Todo): string {
  if (todo.scheduleType === 'someday') {
    return '날짜 미정';
  }
  if (todo.scheduleType === 'once') {
    return todo.dueOn ? `일정 ${todo.dueOn}` : '특정 날짜';
  }
  if (todo.scheduleType === 'daily') {
    return '매일 반복';
  }
  if (todo.scheduleType === 'weekly') {
    const labels = weekdayOptions
      .filter((it) => (todo.weekdays ?? []).includes(it.value))
      .map((it) => it.label)
      .join(', ');
    return labels ? `매주 ${labels}` : '매주 반복';
  }
  if (todo.scheduleType === 'monthly') {
    return todo.monthDay ? `매월 ${todo.monthDay}일` : '매월 반복';
  }
  return todo.intervalDays ? `${todo.intervalDays}일 간격` : '간격 반복';
}

/** UTC 자정-only ISO면 시간 없음으로 간주 */
export function isUtcMidnightDueAt(iso: string | null | undefined): boolean {
  if (!iso) return true;
  return /T00:00:00(.000)?Z$/i.test(iso);
}

/** 목록 섹션용: 명시 dayPeriod 우선, 없으면 dueAt 시각으로 오전/오후, 그 외 종일 */
export function todoDisplayDayPeriod(todo: Todo): TodoDayPeriodApi {
  if (todo.dayPeriod === 'am' || todo.dayPeriod === 'pm') return todo.dayPeriod;
  if (todo.dayPeriod === 'all_day') return 'all_day';
  if (todo.dueAt && !isUtcMidnightDueAt(todo.dueAt)) {
    const h = new Date(todo.dueAt).getHours();
    return h < 12 ? 'am' : 'pm';
  }
  return 'all_day';
}

export function formatDueAtTimeLocal(iso: string | null | undefined): string | null {
  if (!iso || isUtcMidnightDueAt(iso)) return null;
  try {
    return new Date(iso).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
}
