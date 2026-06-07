import { useMemo } from "react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { formatDisplayDate } from "@/lib/calendar-utils";
import { formatTimeRange, type AvailableSlot } from "@/lib/time-utils";
import { groupByWeek } from "@/lib/week-grouping";

interface AvailableDatesPanelProps {
  availableSlots: AvailableSlot[];
  currentMonth: Date;
  onSlotClick?: (slot: AvailableSlot) => void;
}

export function AvailableDatesPanel({
  availableSlots,
  currentMonth,
  onSlotClick,
}: AvailableDatesPanelProps) {
  const monthLabel = format(currentMonth, "M月", { locale: zhTW });
  const groupedSlots = useMemo(() => groupByWeek(availableSlots), [availableSlots]);

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">
          ✓
        </span>
        <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          {monthLabel}空檔（{availableSlots.length}）
        </h3>
      </div>

      {availableSlots.length === 0 ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          此月份沒有時間空檔。
        </p>
      ) : (
        <div className="max-h-none space-y-3 overflow-y-auto sm:max-h-48">
          {groupedSlots.map(({ week, label, items }) => (
            <section key={week}>
              <h4 className="mb-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {label}
              </h4>
              <ul className="space-y-2 sm:space-y-1.5">
                {items.map((slot) => (
                  <li key={`${slot.date}-${slot.startTime}-${slot.endTime}`}>
                    <button
                      type="button"
                      onClick={() => onSlotClick?.(slot)}
                      disabled={!onSlotClick}
                      className="flex w-full min-h-[48px] touch-manipulation flex-col justify-center rounded-xl bg-white px-4 py-3 text-left transition active:scale-[0.98] active:bg-emerald-100 disabled:cursor-default disabled:active:scale-100 disabled:active:bg-white sm:min-h-0 sm:rounded-lg sm:px-2.5 sm:py-1.5 sm:active:scale-100 disabled:hover:bg-white dark:bg-emerald-900/50 dark:active:bg-emerald-900 dark:disabled:active:bg-emerald-900/50 dark:hover:bg-emerald-900 dark:disabled:hover:bg-emerald-900/50"
                    >
                      <span className="text-base font-medium text-emerald-800 sm:text-sm dark:text-emerald-200">
                        {formatDisplayDate(slot.date)}
                      </span>
                      <span className="text-sm text-emerald-600 sm:text-sm dark:text-emerald-300">
                        {formatTimeRange(slot.startTime, slot.endTime)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="mt-2 text-xs text-emerald-600/80 dark:text-emerald-400/80">
        點擊空檔可新增約定排程
      </p>
    </div>
  );
}
