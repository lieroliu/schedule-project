import {
  eachDayOfInterval,
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isWithinInterval,
} from "date-fns";
import { zhTW } from "date-fns/locale";
import type { DateInfo, Participant, Schedule } from "./types";

export function formatDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseDateKey(dateKey: string): Date {
  return parseISO(dateKey);
}

export function formatDisplayDate(dateKey: string): string {
  return format(parseISO(dateKey), "M月d日 (EEE)", { locale: zhTW });
}

export function getCalendarDays(month: Date): Date[] {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}

export function getDateRangeDays(startDate: string, endDate: string): string[] {
  return eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  }).map(formatDateKey);
}

export function buildDateInfoMap(
  startDate: string,
  endDate: string,
  participants: Participant[],
  schedules: Schedule[],
): Map<string, DateInfo> {
  const participantMap = new Map(participants.map((p) => [p.id, p]));
  const dateMap = new Map<string, DateInfo>();

  for (const dateKey of getDateRangeDays(startDate, endDate)) {
    dateMap.set(dateKey, {
      date: dateKey,
      schedules: [],
      isAvailable: true,
    });
  }

  for (const schedule of schedules) {
    const info = dateMap.get(schedule.date);
    const participant = participantMap.get(schedule.participant_id);
    if (info && participant) {
      info.schedules.push({ participant, note: schedule.note });
      info.isAvailable = false;
    }
  }

  return dateMap;
}

export function isDateInRange(
  date: Date,
  startDate: string,
  endDate: string,
): boolean {
  return isWithinInterval(date, {
    start: parseISO(startDate),
    end: parseISO(endDate),
  });
}

export function isSameCalendarMonth(date: Date, month: Date): boolean {
  return isSameMonth(date, month);
}
