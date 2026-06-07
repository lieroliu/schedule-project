"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JoinRoomForm() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = roomId.trim();
    if (trimmed) {
      router.push(`/room/${trimmed}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">房間 ID</label>
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="輸入房間 ID"
          required
          autoFocus
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
