import { useMemo } from "react";
import { format, isSameMonth, parseISO } from "date-fns";
import { zhTW } from "date-fns/locale";
import { formatDisplayDate } from "@/lib/calendar-utils";
import { formatAgreedTime } from "@/lib/time-utils";
import { groupByWeek } from "@/lib/week-grouping";
import type { AgreedSlot } from "@/lib/types";

interface AgreedDatesPanelProps {
  agreedSlots: AgreedSlot[];
  currentMonth: Date;
  onAgreedClick?: (agreed: AgreedSlot) => void;
}

export function AgreedDatesPanel({
  agreedSlots,
  currentMonth,
  onAgreedClick,
}: AgreedDatesPanelProps) {
  const monthLabel = format(currentMonth, "M月", { locale: zhTW });

  const slotsInMonth = useMemo(
    () =>
      agreedSlots.filter((slot) =>
        isSameMonth(parseISO(slot.date), currentMonth),
      ),
    [agreedSlots, currentMonth],
  );

  const groupedSlots = useMemo(
    () => groupByWeek(slotsInMonth),
    [slotsInMonth],
  );

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/30">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-[10px] text-white">
          ✓
        </span>
        <h3 className="text-sm font-semibold text-violet-800 dark:text-violet-300">
          {monthLabel}已約定（{slotsInMonth.length}）
        </h3>
      </div>

      {slotsInMonth.length === 0 ? (
        <p className="text-sm text-violet-700 dark:text-violet-400">
          此月份尚無約定排程。
        </p>
      ) : (
        <div className="max-h-48 space-y-3 overflow-y-auto">
          {groupedSlots.map(({ week, label, items }) => (
            <section key={week}>
              <h4 className="mb-1.5 text-xs font-semibold text-violet-700 dark:text-violet-400">
                {label}
              </h4>
              <ul className="space-y-1.5">
                {items.map((slot) => (
                  <li key={slot.id}>
                    <button
                      type="button"
                      onClick={() => onAgreedClick?.(slot)}
                      className="w-full rounded-lg bg-white px-2.5 py-1.5 text-left text-sm text-violet-800 transition hover:bg-violet-100 dark:bg-violet-900/50 dark:text-violet-200 dark:hover:bg-violet-900"
                    >
                      <span className="font-medium">{formatDisplayDate(slot.date)}</span>
                      <span className="ml-1 text-violet-600 dark:text-violet-300">
                        {formatAgreedTime(slot)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="mt-2 text-xs text-violet-600/80 dark:text-violet-400/80">
        點擊可刪除約定
      </p>
    </div>
  );
}
