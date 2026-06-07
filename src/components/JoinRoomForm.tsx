"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getUserName, setUserName } from "@/lib/user-storage";

export function JoinRoomForm() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [userName, setUserNameInput] = useState(() => getUserName());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedRoomId = roomId.trim();
    const trimmedName = userName.trim();
    if (!trimmedRoomId || !trimmedName) return;

    setUserName(trimmedName);
    const params = new URLSearchParams({ user: trimmedName });
    router.push(`/room/${encodeURIComponent(trimmedRoomId)}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">使用者名稱</label>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserNameInput(e.target.value)}
          placeholder="輸入你的名字"
          required
          autoFocus
          className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">房間 ID</label>
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="輸入房間 ID"
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
      >
        進入行事曆
      </button>
    </form>
  );
}
