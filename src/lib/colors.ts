export const PARTICIPANT_COLORS = [
  "#6366f1", // indigo
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ef4444", // red
  "#22c55e", // green
  "#3b82f6", // blue
  "#f97316", // orange
  "#06b6d4", // cyan
];

export function getColorForIndex(index: number): string {
  return PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
}
