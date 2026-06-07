"use client";

import { useEffect, useState } from "react";
import { formatDisplayDate } from "@/lib/calendar-utils";
import type { Participant } from "@/lib/types";

interface ScheduleModalProps {
  dateKey: string;
  schedules: Array<{ participant: Participant; note: string | null; scheduleId: string }>;
  currentParticipantId: string | null;
  userName: string;
  onClose: () => void;
  onSave: (name: string, note: string) => Promise<void>;
  onDelete: (scheduleId: string) => Promise<void>;
}

export function ScheduleModal({
  dateKey,
  schedules,
  currentParticipantId,
  userName,
  onClose,
  onSave,
  onDelete,
}: ScheduleModalProps) {
  const mySchedule = schedules.find(
    (s) => s.participant.id === currentParticipantId,
  );
  const [name, setName] = useState(userName || mySchedule?.participant.name || "");
  const [note, setNote] = useState(mySchedule?.note || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError("");
    try {
      await onSave(name.trim(), note.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!mySchedule) return;
    setDeleting(true);
    setError("");
    try {
      await onDelete(mySchedule.scheduleId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">排程</h2>
            <p className="text-sm text-zinc-500">{formatDisplayDate(dateKey)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        {schedules.length > 0 && (
          <div className="mb-4 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
            <p className="mb-2 text-xs font-medium text-zinc-500">大家的排程</p>
            <ul className="space-y-2">
              {schedules.map((s) => (
                <li key={s.scheduleId} className="flex items-start gap-2 text-sm">
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: s.participant.color }}
                  />
                  <div>
                    <span className="font-medium">{s.participant.name}</span>
                    {s.note && (
                      <p className="text-zinc-600 dark:text-zinc-400">{s.note}</p>
                    )}
                    {!s.note && (
                      <p className="text-zinc-400">沒空</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {schedules.length === 0 && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
            此日目前無排程，大家都空閒
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">你的名字</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="輸入名字"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">排程內容</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例：下午開會、沒空、旅遊..."
              rows={3}
              className="w-full resize-none rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-800"
            />
            <p className="mt-1 text-xs text-zinc-400">留空表示此日沒空</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2">
            {mySchedule && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/30"
              >
                {deleting ? "刪除中..." : "刪除我的排程"}
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="ml-auto rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "儲存中..." : "儲存排程"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
