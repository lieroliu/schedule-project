import { getWeekOfMonth, parseISO } from "date-fns";

export const WEEK_LABELS = ["第一週", "第二週", "第三週", "第四週", "第五週", "第六週"];

export function getWeekLabel(week: number): string {
  return WEEK_LABELS[week - 1] ?? `第${week}週`;
}

export function groupByWeek<T extends { date: string }>(
  items: T[],
): Array<{ week: number; label: string; items: T[] }> {
  const map = new Map<number, T[]>();

  for (const item of items) {
    const week = getWeekOfMonth(parseISO(item.date), { weekStartsOn: 0 });
    const list = map.get(week) ?? [];
    list.push(item);
    map.set(week, list);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([week, weekItems]) => ({
      week,
      label: getWeekLabel(week),
      items: weekItems,
    }));
}
