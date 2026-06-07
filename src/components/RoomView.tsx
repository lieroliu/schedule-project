"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addMonths, format } from "date-fns";
import { createBrowserClient } from "@/lib/supabase/client";
import { getColorForIndex } from "@/lib/colors";
import type { Participant, Room, Schedule } from "@/lib/types";
import { Calendar } from "./Calendar";
import { ParticipantLegend } from "./ParticipantLegend";
import { ScheduleModal } from "./ScheduleModal";

const PARTICIPANT_ID_KEY = "schedule-participant-id";
const PARTICIPANT_NAME_KEY = "schedule-participant-name";

function getStoredParticipantId(roomId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`${PARTICIPANT_ID_KEY}-${roomId}`);
}

function getStoredParticipantName(roomId: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(`${PARTICIPANT_NAME_KEY}-${roomId}`) ?? "";
}

interface RoomViewProps {
  roomId: string;
}

export function RoomView({ roomId }: RoomViewProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(
    () => getStoredParticipantId(roomId),
  );
  const [userName, setUserName] = useState(() => getStoredParticipantName(roomId));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const supabase = useMemo(() => createBrowserClient(), []);

  const ensureRoom = useCallback(async (): Promise<Room> => {
    const { data: existing } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (existing) return existing;

    const startDate = format(new Date(), "yyyy-MM-dd");
    const endDate = format(addMonths(new Date(), 3), "yyyy-MM-dd");

    const { data: created, error: createError } = await supabase
      .from("rooms")
      .insert({
        id: roomId,
        name: roomId,
        start_date: startDate,
        end_date: endDate,
      })
      .select()
      .single();

    if (createError) throw createError;
    return created;
  }, [supabase, roomId]);

  const fetchRoomData = useCallback(async () => {
    const roomData = await ensureRoom();
    const [participantsRes, schedulesRes] = await Promise.all([
      supabase
        .from("participants")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at"),
      supabase.from("busy_dates").select("*").eq("room_id", roomId),
    ]);

    return {
      room: roomData,
      participants: participantsRes.data ?? [],
      schedules: (schedulesRes.data ?? []).map((row) => ({
        id: row.id,
        room_id: row.room_id,
        participant_id: row.participant_id,
        date: row.date,
        note: row.note ?? null,
      })),
    };
  }, [supabase, roomId, ensureRoom]);

  useEffect(() => {
    let cancelled = false;

    void fetchRoomData()
      .then(({ room: r, participants: p, schedules: s }) => {
        if (cancelled) return;
        setRoom(r);
        setParticipants(p);
        setSchedules(s);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "載入失敗");
        setLoading(false);
      });

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participants", filter: `room_id=eq.${roomId}` },
        () => {
          void fetchRoomData().then(({ participants: p, schedules: s }) => {
            if (cancelled) return;
            setParticipants(p);
            setSchedules(s);
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "busy_dates", filter: `room_id=eq.${roomId}` },
        () => {
          void fetchRoomData().then(({ participants: p, schedules: s }) => {
            if (cancelled) return;
            setParticipants(p);
            setSchedules(s);
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase, roomId, fetchRoomData]);

  const selectedDateSchedules = useMemo(() => {
    if (!selectedDate) return [];
    const participantMap = new Map(participants.map((p) => [p.id, p]));
    return schedules
      .filter((s) => s.date === selectedDate)
      .map((s) => ({
        scheduleId: s.id,
        participant: participantMap.get(s.participant_id)!,
        note: s.note,
      }))
      .filter((s) => s.participant);
  }, [selectedDate, schedules, participants]);

  async function ensureParticipant(name: string): Promise<string> {
    if (currentParticipantId) {
      const existing = participants.find((p) => p.id === currentParticipantId);
      if (existing && existing.name !== name) {
        await supabase
          .from("participants")
          .update({ name })
          .eq("id", currentParticipantId);
      }
      return currentParticipantId;
    }

    const { data, error: insertError } = await supabase
      .from("participants")
      .insert({
        room_id: roomId,
        name,
        color: getColorForIndex(participants.length),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    localStorage.setItem(`${PARTICIPANT_ID_KEY}-${roomId}`, data.id);
    setCurrentParticipantId(data.id);
    return data.id;
  }

  async function handleSaveSchedule(name: string, note: string) {
    const participantId = await ensureParticipant(name);
    localStorage.setItem(`${PARTICIPANT_NAME_KEY}-${roomId}`, name);
    setUserName(name);

    const existing = schedules.find(
      (s) => s.date === selectedDate && s.participant_id === participantId,
    );

    if (existing) {
      const { error: updateError } = await supabase
        .from("busy_dates")
        .update({ note: note || null })
        .eq("id", existing.id);

      if (updateError) throw updateError;

      setSchedules((prev) =>
        prev.map((s) =>
          s.id === existing.id ? { ...s, note: note || null } : s,
        ),
      );
    } else {
      const { data, error: insertError } = await supabase
        .from("busy_dates")
        .insert({
          room_id: roomId,
          participant_id: participantId,
          date: selectedDate!,
          note: note || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSchedules((prev) => [
        ...prev,
        {
          id: data.id,
          room_id: data.room_id,
          participant_id: data.participant_id,
          date: data.date,
          note: data.note ?? null,
        },
      ]);
    }
  }

  async function handleDeleteSchedule(scheduleId: string) {
    const { error: deleteError } = await supabase
      .from("busy_dates")
      .delete()
      .eq("id", scheduleId);

    if (deleteError) throw deleteError;
    setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500">
        載入行事曆中...
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="rounded-xl bg-red-50 px-4 py-6 text-center text-red-600 dark:bg-red-950/30">
        {error || "無法載入房間"}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">房間 {room.id}</h1>
        <p className="text-sm text-zinc-500">
          {room.start_date} ~ {room.end_date}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
        <Calendar
          startDate={room.start_date}
          endDate={room.end_date}
          participants={participants}
          schedules={schedules}
          onDateClick={setSelectedDate}
        />
        <ParticipantLegend
          participants={participants}
          currentParticipantId={currentParticipantId}
        />
      </div>

      {selectedDate && (
        <ScheduleModal
          dateKey={selectedDate}
          schedules={selectedDateSchedules}
          currentParticipantId={currentParticipantId}
          userName={userName}
          onClose={() => setSelectedDate(null)}
          onSave={handleSaveSchedule}
          onDelete={handleDeleteSchedule}
        />
      )}
    </div>
  );
}
