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
