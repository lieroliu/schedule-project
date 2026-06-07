interface HourSelectProps {
  value: string;
  onChange: (value: string) => void;
  includeEndOfDay?: boolean;
  placeholder?: string;
  className?: string;
}

export function HourSelect({
  value,
  onChange,
  includeEndOfDay = false,
  placeholder = "選擇",
  className = "",
}: HourSelectProps) {
  const maxHour = includeEndOfDay ? 24 : 23;
  const hours = Array.from({ length: maxHour + 1 }, (_, i) => i);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 ${className}`}
    >
      <option value="">{placeholder}</option>
      {hours.map((hour) => (
        <option key={hour} value={String(hour)}>
          {hour === 24 ? "24 點（晚上 12 點）" : `${hour} 點`}
        </option>
      ))}
    </select>
  );
}
