/** ISO-неделя: YYYY-Www (UTC, ISO 8601). */
export function getIsoWeekKey(date: Date): string {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const year = utc.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function formatWeekShortLabel(weekKey: string): string {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekKey);
  if (!match) return weekKey;
  return `Нед. ${Number(match[2])}`;
}

/** Последние N календарных ISO-недель (от старых к новым). */
export function lastIsoWeekKeys(count: number, end = new Date()): string[] {
  const keys: string[] = [];
  const cursor = new Date(end);
  let guard = 0;
  const limit = Math.max(1, count);
  while (keys.length < limit && guard < limit * 4) {
    guard += 1;
    const key = getIsoWeekKey(cursor);
    if (!keys.includes(key)) keys.unshift(key);
    cursor.setDate(cursor.getDate() - 7);
  }
  return keys;
}
