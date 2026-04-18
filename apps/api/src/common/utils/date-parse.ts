/** `YYYY-MM-DD` → UTC 자정 Date (날짜만 비교용) */
export function parseYmdToUtcDate(ymd: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    throw new Error('invalid_date_format');
  }
  const d = new Date(`${ymd}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    throw new Error('invalid_date');
  }
  return d;
}

export function todayYmdUtc(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function yearMonthFromYmd(ymd: string): string {
  return ymd.slice(0, 7);
}

/** UTC 기준 현재 달 `YYYY-MM` (예산·월 경계와 `todayYmdUtc` 정합) */
export function currentYearMonthUtc(): string {
  return todayYmdUtc().slice(0, 7);
}

/** `YYYY-MM`에 `delta`개월 더한 UTC 월 문자열 */
export function addMonthsYearMonthUtc(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** UTC 기준 해당 날짜가 월요일인지 */
export function isUtcMonday(ymd: string): boolean {
  const d = parseYmdToUtcDate(ymd);
  return d.getUTCDay() === 1;
}

/** weekStart(월요일) 기준 일요일 YYYY-MM-DD */
export function weekEndMondayUtc(weekStartYmd: string): string {
  const d = parseYmdToUtcDate(weekStartYmd);
  const end = new Date(d);
  end.setUTCDate(end.getUTCDate() + 6);
  return end.toISOString().slice(0, 10);
}

/** `YYYY-MM` 형식·월 1~12 여부 */
export function isValidYearMonthUtc(ym: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(ym)) return false;
  const [y, m] = ym.split('-').map(Number);
  if (m < 1 || m > 12) return false;
  if (y < 1970 || y > 9999) return false;
  return true;
}

/** 월요일(UTC 자정)부터 7일간 각 UTC 자정 `Date` */
export function eachUtcMidnightInWeekFromMonday(weekStartYmd: string): Date[] {
  const start = parseYmdToUtcDate(weekStartYmd);
  const out: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    out.push(d);
  }
  return out;
}

/** 해당 달의 매일 UTC 자정 `Date` */
export function eachUtcMidnightInMonth(yearMonth: string): Date[] {
  if (!isValidYearMonthUtc(yearMonth)) {
    throw new Error('invalid_year_month');
  }
  const [y, m] = yearMonth.split('-').map(Number);
  const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const out: Date[] = [];
  for (let d = 1; d <= dim; d++) {
    out.push(new Date(Date.UTC(y, m - 1, d)));
  }
  return out;
}
