/** 해당 날짜가 속한 주의 월요일 YYYY-MM-DD (로컬 달력) */
export function getWeekMonday(d: Date = new Date()): string {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toYmd(date);
}

export function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function currentYearMonth(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function addDaysLocal(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  return toYmd(dt);
}

/** 월요일 YMD 기준 그 주 일요일(로컬 달력) */
export function weekSundayYmd(mondayYmd: string): string {
  return addDaysLocal(mondayYmd, 6);
}

export function firstYmdOfMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number);
  return toYmd(new Date(y, m - 1, 1));
}

export function lastYmdOfMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number);
  return toYmd(new Date(y, m, 0));
}

export function addMonthsLocalYearMonth(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split('-').map(Number);
  const dt = new Date(y, m - 1 + delta, 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
}
