"use client";

import { useEffect, useState } from "react";
import { formatDisplayDate } from "@/lib/calendar-utils";
import { formatAgreedTime, formatTimeRange } from "@/lib/time-utils";
import type { AgreedSlot } from "@/lib/types";

export interface AgreedSlotFormData {
  title: string;
  startTime: string;
  endTime: string;
}

interface AppointmentModalProps {
  mode: "create" | "view";
  dateKey: string;
  startTime: string;
  endTime: string;
  title?: string | null;
  userName: string;
  onClose: () => void;
  onSave: (data: AgreedSlotFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function AppointmentModal({
  mode,
  dateKey,
  startTime: initialStart,
  endTime: initialEnd,
  title: initialTitle,
  userName,
  onClose,
  onSave,
  onDelete,
}: AppointmentModalProps) {
  const [title, setTitle] = useState(initialTitle ?? "");
  const [startTime, setStartTime] = useState(initialStart.slice(0, 5));
  const [endTime, setEndTime] = useState(initialEnd.slice(0, 5));
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
    if (startTime >= endTime) {
      setError("結束時間必須晚於開始時間");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSave({ title: title.trim(), startTime, endTime });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    setError("");
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗");
    } finally {
      setDeleting(false);
    }
  }

  if (mode === "view") {
    const agreed = {
      start_time: initialStart,
      end_time: initialEnd,
    } as AgreedSlot;

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
              <h2 className="text-lg font-semibold">約定排程</h2>
              <p className="text-sm text-zinc-500">{formatDisplayDate(dateKey)}</p>
              <p className="mt-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                {formatAgreedTime(agreed)}
              </p>
              {initialTitle && (
                <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{initialTitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
            >
              ✕
            </button>
          </div>

          {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/30"
          >
            {deleting ? "刪除中..." : "刪除此約定時段"}
          </button>
        </div>
      </div>
    );
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
            <h2 className="text-lg font-semibold">新增約定排程</h2>
            <p className="text-sm text-zinc-500">{formatDisplayDate(dateKey)}</p>
            <p className="mt-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
              {userName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">開始時間</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">結束時間</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">約定內容</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：聚餐、開會..."
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>

          <p className="text-xs text-zinc-400">
            已預填空檔時段 {formatTimeRange(initialStart.slice(0, 5), initialEnd.slice(0, 5))}，可調整時間
          </p>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "儲存中..." : "確認約定"}
          </button>
        </form>
      </div>
    </div>
  );
}
