import type { Participant } from "@/lib/types";

interface ParticipantLegendProps {
  participants: Participant[];
  currentParticipantId: string | null;
}

export function ParticipantLegend({
  participants,
  currentParticipantId,
}: ParticipantLegendProps) {
  if (participants.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500 dark:border-zinc-700">
        尚無參與者
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        參與者
      </h3>
      <ul className="space-y-2">
        {participants.map((p) => (
          <li key={p.id} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className={p.id === currentParticipantId ? "font-semibold" : ""}>
              {p.name}
              {p.id === currentParticipantId && (
                <span className="ml-1 text-xs text-indigo-500">（你）</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
