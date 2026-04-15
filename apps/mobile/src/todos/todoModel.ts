export type TodoScheduleType =
  | 'once'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'interval'
  | 'someday';

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
