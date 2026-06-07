"use client";

import { useMemo, useState } from "react";
import { addMonths, format, subMonths } from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  buildDateInfoMap,
  formatDateKey,
  getCalendarDays,
  isDateInRange,
  isSameCalendarMonth,
} from "@/lib/calendar-utils";
import type { Participant, Schedule } from "@/lib/types";

interface CalendarProps {
  startDate: string;
  endDate: string;
  participants: Participant[];
  schedules: Schedule[];
  onDateClick: (dateKey: string) => void;
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const MAX_VISIBLE = 2;

export function Calendar({
  startDate,
  endDate,
  participants,
  schedules,
  onDateClick,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date(startDate));

  const dateInfoMap = useMemo(
    () => buildDateInfoMap(startDate, endDate, participants, schedules),
    [startDate, endDate, participants, schedules],
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
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="rounded-lg px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          ←
        </button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, "yyyy年 M月", { locale: zhTW })}
        </h2>
        <button
          type="button"
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="rounded-lg px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          →
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-zinc-500"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date) => {
          const dateKey = formatDateKey(date);
          const inRange = isDateInRange(date, startDate, endDate);
          const inMonth = isSameCalendarMonth(date, currentMonth);
          const info = dateInfoMap.get(dateKey);
          const isAvailable = info?.isAvailable ?? false;
          const daySchedules = info?.schedules ?? [];
          const visible = daySchedules.slice(0, MAX_VISIBLE);
          const overflow = daySchedules.length - MAX_VISIBLE;

          return (
            <button
              key={dateKey}
              type="button"
              disabled={!inRange}
              onClick={() => handleDayClick(date)}
              className={[
                "relative flex min-h-[88px] flex-col rounded-lg p-1.5 text-left text-sm transition",
                !inMonth && "opacity-30",
                !inRange && "cursor-not-allowed opacity-20",
                inRange && "cursor-pointer hover:ring-2 hover:ring-indigo-300",
                isAvailable && inRange &&
                  "bg-emerald-50 ring-2 ring-emerald-400 dark:bg-emerald-950/40",
                !isAvailable && inRange && "bg-zinc-50 dark:bg-zinc-800/50",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="mb-1 self-start font-medium">{format(date, "d")}</span>

              {isAvailable && inRange && (
                <span className="rounded bg-emerald-100 px-1 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                  空檔
                </span>
              )}

              {visible.map(({ participant, note }) => (
                <span
                  key={participant.id}
                  className="mt-0.5 truncate rounded px-1 py-0.5 text-[10px] leading-tight text-white"
                  style={{ backgroundColor: participant.color }}
                  title={note ? `${participant.name}: ${note}` : participant.name}
                >
                  {participant.name}
                  {note ? ` · ${note}` : ""}
                </span>
              ))}

              {overflow > 0 && (
                <span className="mt-0.5 text-[10px] text-zinc-500">+{overflow} 更多</span>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-center text-xs text-zinc-500">
        綠色高亮 = 空檔（無人排程）· 點擊日期新增或編輯排程
      </p>
    </div>
  );
}
