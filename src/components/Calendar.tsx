"use client";

import { useMemo } from "react";
import { addMonths, format, subMonths } from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  buildDateInfoMap,
  formatDateKey,
  getCalendarDays,
  isDateInRange,
  isSameCalendarMonth,
} from "@/lib/calendar-utils";
import { formatAgreedTime, formatScheduleTime } from "@/lib/time-utils";
import type { AgreedSlot, Participant, Schedule } from "@/lib/types";

interface CalendarProps {
  startDate: string;
  endDate: string;
  participants: Participant[];
  schedules: Schedule[];
  agreedSlots: AgreedSlot[];
  currentMonth: Date;
  onMonthChange: (month: Date) => void;
  onDateClick: (dateKey: string) => void;
  onAgreedClick: (agreed: AgreedSlot) => void;
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const MAX_VISIBLE = 2;

export function Calendar({
  startDate,
  endDate,
  participants,
  schedules,
  agreedSlots,
  currentMonth,
  onMonthChange,
  onDateClick,
  onAgreedClick,
}: CalendarProps) {
  const dateInfoMap = useMemo(
    () => buildDateInfoMap(startDate, endDate, participants, schedules, agreedSlots),
    [startDate, endDate, participants, schedules, agreedSlots],
  );

  const calendarDays = useMemo(
    () => getCalendarDays(currentMonth),
    [currentMonth],
  );

  function handleDayClick(date: Date) {
    const dateKey = formatDateKey(date);
    if (!isDateInRange(date, startDate, endDate)) return;
    onDateClick(dateKey);
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm sm:p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          className="flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-lg text-sm text-zinc-600 hover:bg-zinc-100 active:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:active:bg-zinc-700"
        >
          ←
        </button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, "yyyy年 M月", { locale: zhTW })}
        </h2>
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          className="flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-lg text-sm text-zinc-600 hover:bg-zinc-100 active:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:active:bg-zinc-700"
        >
          →
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-0.5 sm:gap-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-1 text-center text-xs font-medium text-zinc-500 sm:py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {calendarDays.map((date) => {
          const dateKey = formatDateKey(date);
          const inRange = isDateInRange(date, startDate, endDate);
          const inMonth = isSameCalendarMonth(date, currentMonth);
          const info = dateInfoMap.get(dateKey);
          const isFullyFree = info?.isFullyFree ?? false;
          const hasFreeSlots = info?.hasFreeSlots ?? false;
          const daySchedules = info?.schedules ?? [];
          const dayAgreed = info?.agreedSlots ?? [];
          const hasAgreed = dayAgreed.length > 0;
          const visible = daySchedules.slice(0, MAX_VISIBLE);
          const overflow = daySchedules.length - MAX_VISIBLE;

          return (
            <button
              key={dateKey}
              type="button"
              disabled={!inRange}
              onClick={() => {
                if (!inRange) return;
                if (hasAgreed && dayAgreed.length === 1) {
                  onAgreedClick(dayAgreed[0]);
                } else if (!hasAgreed) {
                  handleDayClick(date);
                }
              }}
              className={[
                "relative flex aspect-square min-h-[44px] touch-manipulation flex-col rounded-lg p-1 text-left transition active:opacity-80 sm:aspect-auto sm:min-h-[96px] sm:p-1.5 sm:text-sm sm:active:opacity-100",
                !inMonth && "opacity-30",
                !inRange && "cursor-not-allowed opacity-20",
                inRange && "cursor-pointer hover:ring-2 hover:ring-indigo-300",
                hasAgreed && inRange &&
                  "bg-violet-50 ring-2 ring-violet-400 dark:bg-violet-950/40",
                !hasAgreed && isFullyFree && inRange &&
                  "bg-emerald-50 ring-2 ring-emerald-400 dark:bg-emerald-950/40",
                !hasAgreed && !isFullyFree && hasFreeSlots && inRange &&
                  "bg-amber-50 ring-1 ring-amber-300 dark:bg-amber-950/30",
                !hasAgreed && !hasFreeSlots && inRange && "bg-zinc-50 dark:bg-zinc-800/50",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="mb-0.5 self-start text-base font-semibold sm:mb-1 sm:text-sm sm:font-medium">
                {format(date, "d")}
              </span>

              {hasAgreed && inRange &&
                dayAgreed.map((agreed) => (
                  <span
                    key={agreed.id}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAgreedClick(agreed);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        onAgreedClick(agreed);
                      }
                    }}
                    className="mt-0.5 truncate rounded bg-violet-200 px-1 py-0.5 text-[10px] font-medium text-violet-800 max-sm:mt-auto max-sm:self-center max-sm:px-1.5 max-sm:py-1 max-sm:text-[11px] dark:bg-violet-900/60 dark:text-violet-200"
                    title="點擊刪除"
                  >
                    {formatAgreedTime(agreed)}
                  </span>
                ))}

              {!hasAgreed && isFullyFree && inRange && (
                <span className="hidden rounded bg-emerald-100 px-1 py-0.5 text-[10px] font-medium text-emerald-700 sm:inline dark:bg-emerald-900/50 dark:text-emerald-300">
                  全天空檔
                </span>
              )}

              {!hasAgreed && !isFullyFree && hasFreeSlots && inRange && (
                <span className="hidden rounded bg-amber-100 px-1 py-0.5 text-[10px] font-medium text-amber-700 sm:inline dark:bg-amber-900/50 dark:text-amber-300">
                  部分空檔
                </span>
              )}

              {!hasAgreed && (
                <div className="hidden sm:contents">
                  {visible.map(({ participant, note, start_time, end_time }) => (
                    <span
                      key={participant.id}
                      className="mt-0.5 truncate rounded px-1 py-0.5 text-[10px] leading-tight text-white"
                      style={{ backgroundColor: participant.color }}
                      title={`${participant.name} ${formatScheduleTime(start_time, end_time)}${note ? `: ${note}` : ""}`}
                    >
                      {participant.name}
                      {" "}
                      {formatScheduleTime(start_time, end_time)}
                    </span>
                  ))}

                  {overflow > 0 && (
                    <span className="mt-0.5 text-[10px] text-zinc-500">+{overflow} 更多</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-center text-xs text-zinc-500">
        綠色 = 全天空檔 · 黃色 = 部分空檔 · 紫色 = 已約定（點擊刪除）
      </p>
    </div>
  );
}
