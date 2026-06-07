import {
  eachDayOfInterval,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
} from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  hasAnyFreeSlot,
  isFullDayFree,
  getFreeSlotsForDate,
  type AvailableSlot,
} from "./time-utils";
import type { AgreedSlot, DateInfo, Participant, Schedule } from "./types";

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
  agreedSlots: AgreedSlot[] = [],
): Map<string, DateInfo> {
  const participantMap = new Map(participants.map((p) => [p.id, p]));
  const dateMap = new Map<string, DateInfo>();

  for (const dateKey of getDateRangeDays(startDate, endDate)) {
    dateMap.set(dateKey, {
      date: dateKey,
      schedules: [],
      agreedSlots: agreedSlots.filter((a) => a.date === dateKey),
      isFullyFree: isFullDayFree(dateKey, schedules, agreedSlots),
      hasFreeSlots: hasAnyFreeSlot(dateKey, schedules, agreedSlots),
    });
  }

  for (const schedule of schedules) {
    const info = dateMap.get(schedule.date);
    const participant = participantMap.get(schedule.participant_id);
    if (info && participant) {
      info.schedules.push({
        participant,
        note: schedule.note,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
      });
    }
  }

  for (const dateKey of getDateRangeDays(startDate, endDate)) {
    const info = dateMap.get(dateKey);
    if (info) {
      info.isFullyFree = isFullDayFree(dateKey, schedules, agreedSlots);
      info.hasFreeSlots = hasAnyFreeSlot(dateKey, schedules, agreedSlots);
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

export function getAvailableSlotsForMonth(
  startDate: string,
  endDate: string,
  schedules: Schedule[],
  month: Date,
  agreedSlots: AgreedSlot[] = [],
): AvailableSlot[] {
  return getDateRangeDays(startDate, endDate)
    .filter((date) => isSameMonth(parseISO(date), month))
    .flatMap((date) => getFreeSlotsForDate(date, schedules, agreedSlots));
}
