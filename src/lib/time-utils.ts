import type { AgreedSlot, Schedule } from "./types";

export const DAY_START_MINUTES = 0; // 00:00
export const DAY_END_MINUTES = 24 * 60; // 24:00

export interface TimeRange {
  start: number;
  end: number;
}

export interface AvailableSlot {
  date: string;
  startTime: string;
  endTime: string;
}

export function parseTimeToMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  const parts = time.split(":");
  const hours = Number(parts[0]);
  const minutes = Number(parts[1] ?? 0);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime}-${endTime}`;
}

export function normalizeTimeInput(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}

export function resolveScheduleTimes(
  startTime: string,
  endTime: string,
): { start_time: string | null; end_time: string | null } {
  const hasStart = startTime.trim().length > 0;
  const hasEnd = endTime.trim().length > 0;

  if (!hasStart && !hasEnd) {
    return { start_time: null, end_time: null };
  }

  if (hasStart && hasEnd) {
    return {
      start_time: normalizeTimeInput(startTime),
      end_time: normalizeTimeInput(endTime),
    };
  }

  throw new Error("請同時填寫開始與結束時間，或兩者都留空代表整天沒空");
}

export function resolveAgreedTimes(
  startTime: string,
  endTime: string,
): { start_time: string; end_time: string } {
  if (!startTime.trim() || !endTime.trim()) {
    throw new Error("請填寫開始與結束時間");
  }
  if (startTime >= endTime) {
    throw new Error("結束時間必須晚於開始時間");
  }
  return {
    start_time: normalizeTimeInput(startTime),
    end_time: normalizeTimeInput(endTime),
  };
}

export function scheduleToBusyRange(schedule: Schedule): TimeRange {
  const start = parseTimeToMinutes(schedule.start_time);
  const end = parseTimeToMinutes(schedule.end_time);

  if (start === null || end === null) {
    return { start: DAY_START_MINUTES, end: DAY_END_MINUTES };
  }

  return {
    start: Math.max(DAY_START_MINUTES, start),
    end: Math.min(DAY_END_MINUTES, end),
  };
}

export function agreedSlotToBusyRange(agreed: AgreedSlot): TimeRange {
  const start = parseTimeToMinutes(agreed.start_time)!;
  const end = parseTimeToMinutes(agreed.end_time)!;
  return {
    start: Math.max(DAY_START_MINUTES, start),
    end: Math.min(DAY_END_MINUTES, end),
  };
}

export function mergeTimeRanges(ranges: TimeRange[]): TimeRange[] {
  if (ranges.length === 0) return [];

  const sorted = [...ranges]
    .filter((r) => r.end > r.start)
    .sort((a, b) => a.start - b.start);

  const merged: TimeRange[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

export function getFreeTimeRanges(busyRanges: TimeRange[]): TimeRange[] {
  const merged = mergeTimeRanges(busyRanges);
  const free: TimeRange[] = [];
  let cursor = DAY_START_MINUTES;

  for (const busy of merged) {
    if (busy.start > cursor) {
      free.push({ start: cursor, end: busy.start });
    }
    cursor = Math.max(cursor, busy.end);
  }

  if (cursor < DAY_END_MINUTES) {
    free.push({ start: cursor, end: DAY_END_MINUTES });
  }

  return free.filter((r) => r.end > r.start);
}

export function getFreeSlotsForDate(
  date: string,
  schedules: Schedule[],
  agreedSlots: AgreedSlot[] = [],
): AvailableSlot[] {
  const daySchedules = schedules.filter((s) => s.date === date);
  const dayAgreed = agreedSlots.filter((a) => a.date === date);
  const busyRanges = [
    ...daySchedules.map(scheduleToBusyRange),
    ...dayAgreed.map(agreedSlotToBusyRange),
  ];
  const freeRanges = getFreeTimeRanges(busyRanges);

  return freeRanges.map((range) => ({
    date,
    startTime: formatMinutes(range.start),
    endTime: formatMinutes(range.end),
  }));
}

export function isFullDayFree(
  date: string,
  schedules: Schedule[],
  agreedSlots: AgreedSlot[] = [],
): boolean {
  const slots = getFreeSlotsForDate(date, schedules, agreedSlots);
  if (slots.length !== 1) return false;
  return (
    slots[0].startTime === formatMinutes(DAY_START_MINUTES) &&
    slots[0].endTime === formatMinutes(DAY_END_MINUTES)
  );
}

export function hasAnyFreeSlot(
  date: string,
  schedules: Schedule[],
  agreedSlots: AgreedSlot[] = [],
): boolean {
  return getFreeSlotsForDate(date, schedules, agreedSlots).length > 0;
}

export function formatScheduleTime(
  startTime: string | null,
  endTime: string | null,
): string {
  if (!startTime || !endTime) return "整天沒空";
  const start = startTime.slice(0, 5);
  const end = endTime.slice(0, 5);
  return `${start}-${end}`;
}

export function formatAgreedTime(agreed: AgreedSlot): string {
  return formatScheduleTime(agreed.start_time, agreed.end_time);
}
