"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO, startOfMonth } from "date-fns";
import { createBrowserClient } from "@/lib/supabase/client";
import { getColorForIndex } from "@/lib/colors";
import {
  getParticipantId,
  getUserName,
  setParticipantId,
} from "@/lib/user-storage";
import { getAvailableSlotsForMonth } from "@/lib/calendar-utils";
import { resolveAgreedTimes, resolveScheduleTimes, type AvailableSlot } from "@/lib/time-utils";
import type { AgreedSlot, Participant, Room, Schedule } from "@/lib/types";
import { Calendar } from "./Calendar";
import { ParticipantLegend } from "./ParticipantLegend";
import { AvailableDatesPanel } from "./AvailableDatesPanel";
import { ScheduleModal, type ScheduleFormData } from "./ScheduleModal";
import { AppointmentModal, type AgreedSlotFormData } from "./AppointmentModal";

interface RoomViewProps {
  roomId: string;
  userName: string;
}

function mapScheduleRow(row: {
  id: string;
  room_id: string;
  participant_id: string;
  date: string;
  note: string | null;
  start_time: string | null;
  end_time: string | null;
}): Schedule {
  return {
    id: row.id,
    room_id: row.room_id,
    participant_id: row.participant_id,
    date: row.date,
    note: row.note ?? null,
    start_time: row.start_time,
    end_time: row.end_time,
  };
}

function mapAgreedRow(row: {
  id: string;
  room_id: string;
  date: string;
  start_time: string;
  end_time: string;
  title: string | null;
  created_by: string | null;
  created_at: string;
}): AgreedSlot {
  return {
    id: row.id,
    room_id: row.room_id,
    date: row.date,
    start_time: row.start_time,
    end_time: row.end_time,
    title: row.title ?? null,
    created_by: row.created_by,
    created_at: row.created_at,
  };
}

export function RoomView({ roomId, userName: userNameProp }: RoomViewProps) {
  const userName = userNameProp || getUserName();

  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [agreedSlots, setAgreedSlots] = useState<AgreedSlot[]>([]);
  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [appointmentModal, setAppointmentModal] = useState<{
    mode: "create" | "view";
    slot: AvailableSlot | AgreedSlot;
  } | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const supabase = useMemo(() => createBrowserClient(), []);

  const fetchRoomData = useCallback(async () => {
    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (roomError || !roomData) {
      throw new Error("找不到此房間，請確認房間 ID 是否正確");
    }

    const [participantsRes, schedulesRes, agreedRes] = await Promise.all([
      supabase
        .from("participants")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at"),
      supabase.from("busy_dates").select("*").eq("room_id", roomId),
      supabase.from("agreed_slots").select("*").eq("room_id", roomId),
    ]);

    return {
      room: roomData,
      participants: participantsRes.data ?? [],
      schedules: (schedulesRes.data ?? []).map(mapScheduleRow),
      agreedSlots: (agreedRes.data ?? []).map(mapAgreedRow),
    };
  }, [supabase, roomId]);

  const resolveParticipantId = useCallback(
    (name: string, currentParticipants: Participant[]): string | null => {
      const byName = currentParticipants.find((p) => p.name === name);
      if (byName) return byName.id;

      const storedId = getParticipantId(roomId, name);
      if (!storedId) return null;

      const byStored = currentParticipants.find(
        (p) => p.id === storedId && p.name === name,
      );
      return byStored?.id ?? null;
    },
    [roomId],
  );

  const ensureParticipant = useCallback(
    async (name: string, currentParticipants: Participant[]): Promise<string> => {
      const existingId = resolveParticipantId(name, currentParticipants);
      if (existingId) {
        setParticipantId(roomId, name, existingId);
        setCurrentParticipantId(existingId);
        return existingId;
      }

      const { data, error: insertError } = await supabase
        .from("participants")
        .insert({
          room_id: roomId,
          name,
          color: getColorForIndex(currentParticipants.length),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setParticipantId(roomId, name, data.id);
      setCurrentParticipantId(data.id);
      setParticipants((prev) => [...prev, data]);
      return data.id;
    },
    [supabase, roomId, resolveParticipantId],
  );

  useEffect(() => {
    let cancelled = false;

    void fetchRoomData()
      .then(async ({ room: r, participants: p, schedules: s, agreedSlots: a }) => {
        if (cancelled) return;
        setRoom(r);
        setParticipants(p);
        setSchedules(s);
        setAgreedSlots(a);
        setCurrentMonth(() => {
          const todayKey = format(new Date(), "yyyy-MM-dd");
          if (todayKey >= r.start_date && todayKey <= r.end_date) {
            return new Date();
          }
          return startOfMonth(parseISO(r.start_date));
        });

        if (userName) {
          const resolvedId = resolveParticipantId(userName, p);
          if (resolvedId) {
            setCurrentParticipantId(resolvedId);
            setParticipantId(roomId, userName, resolvedId);
          }
        }

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
          void fetchRoomData().then(({ participants: p, schedules: s, agreedSlots: a }) => {
            if (cancelled) return;
            setParticipants(p);
            setSchedules(s);
            setAgreedSlots(a);
            if (userName) {
              const resolvedId = resolveParticipantId(userName, p);
              if (resolvedId) setCurrentParticipantId(resolvedId);
            }
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "busy_dates", filter: `room_id=eq.${roomId}` },
        () => {
          void fetchRoomData().then(({ participants: p, schedules: s, agreedSlots: a }) => {
            if (cancelled) return;
            setParticipants(p);
            setSchedules(s);
            setAgreedSlots(a);
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agreed_slots", filter: `room_id=eq.${roomId}` },
        () => {
          void fetchRoomData().then(({ participants: p, schedules: s, agreedSlots: a }) => {
            if (cancelled) return;
            setParticipants(p);
            setSchedules(s);
            setAgreedSlots(a);
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase, roomId, fetchRoomData, userName, resolveParticipantId]);

  const selectedDateSchedules = useMemo(() => {
    if (!selectedDate) return [];
    const participantMap = new Map(participants.map((p) => [p.id, p]));
    return schedules
      .filter((s) => s.date === selectedDate)
      .map((s) => ({
        scheduleId: s.id,
        participant: participantMap.get(s.participant_id)!,
        note: s.note,
        startTime: s.start_time,
        endTime: s.end_time,
      }))
      .filter((s) => s.participant);
  }, [selectedDate, schedules, participants]);

  const myScheduleOnSelectedDate = useMemo(() => {
    if (!currentParticipantId || !selectedDate) return null;
    return schedules.find(
      (s) => s.date === selectedDate && s.participant_id === currentParticipantId,
    );
  }, [schedules, selectedDate, currentParticipantId]);

  const availableSlots = useMemo(() => {
    if (!room) return [];
    return getAvailableSlotsForMonth(
      room.start_date,
      room.end_date,
      schedules,
      currentMonth,
      agreedSlots,
    );
  }, [room, schedules, agreedSlots, currentMonth]);

  async function handleSaveSchedule(data: ScheduleFormData) {
    if (!userName) throw new Error("請先從首頁輸入使用者名稱");

    const participantId = await ensureParticipant(userName, participants);
    const { start_time, end_time } = resolveScheduleTimes(
      data.startTime,
      data.endTime,
    );

    const existing = schedules.find(
      (s) => s.date === selectedDate && s.participant_id === participantId,
    );

    const payload = {
      note: data.note || null,
      start_time,
      end_time,
    };

    if (existing) {
      const { error: updateError } = await supabase
        .from("busy_dates")
        .update(payload)
        .eq("id", existing.id)
        .eq("participant_id", participantId);

      if (updateError) throw updateError;

      setSchedules((prev) =>
        prev.map((s) =>
          s.id === existing.id ? { ...s, ...payload } : s,
        ),
      );
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("busy_dates")
        .insert({
          room_id: roomId,
          participant_id: participantId,
          date: selectedDate!,
          ...payload,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSchedules((prev) => [...prev, mapScheduleRow(inserted)]);
    }
  }

  async function handleDeleteSchedule(scheduleId: string) {
    if (!currentParticipantId) throw new Error("無法刪除此排程");

    const target = schedules.find((s) => s.id === scheduleId);
    if (!target || target.participant_id !== currentParticipantId) {
      throw new Error("只能刪除自己的排程");
    }

    const { error: deleteError } = await supabase
      .from("busy_dates")
      .delete()
      .eq("id", scheduleId)
      .eq("participant_id", currentParticipantId);

    if (deleteError) throw deleteError;
    setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
  }

  async function handleSaveAgreed(data: AgreedSlotFormData) {
    if (!userName || !appointmentModal) throw new Error("請先從首頁輸入使用者名稱");

    const participantId = await ensureParticipant(userName, participants);
    const { start_time, end_time } = resolveAgreedTimes(data.startTime, data.endTime);

    const date = (appointmentModal.slot as AvailableSlot).date;

    const { data: inserted, error: insertError } = await supabase
      .from("agreed_slots")
      .insert({
        room_id: roomId,
        date,
        start_time,
        end_time,
        title: data.title || null,
        created_by: participantId,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    setAgreedSlots((prev) => [...prev, mapAgreedRow(inserted)]);
  }

  async function handleDeleteAgreed(agreedId: string) {
    const { error: deleteError } = await supabase
      .from("agreed_slots")
      .delete()
      .eq("id", agreedId);

    if (deleteError) throw deleteError;
    setAgreedSlots((prev) => prev.filter((a) => a.id !== agreedId));
  }

  function handleDateClick(dateKey: string) {
    if (!userName) return;
    setSelectedDate(dateKey);
  }

  function handleAvailableSlotClick(slot: AvailableSlot) {
    if (!userName) return;
    setAppointmentModal({ mode: "create", slot });
  }

  function handleAgreedClick(agreed: AgreedSlot) {
    setAppointmentModal({ mode: "view", slot: agreed });
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

  const agreedForModal =
    appointmentModal?.mode === "view"
      ? (appointmentModal.slot as AgreedSlot)
      : null;

  const createSlot =
    appointmentModal?.mode === "create"
      ? (appointmentModal.slot as AvailableSlot)
      : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">房間 {room.id}</h1>
        <p className="text-sm text-zinc-500">
          {room.start_date} ~ {room.end_date}
          {userName && (
            <span className="ml-2 text-indigo-600 dark:text-indigo-400">
              · {userName}
            </span>
          )}
        </p>
      </header>

      {!userName && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          請先
          <Link href="/" className="mx-1 font-medium underline">
            返回首頁
          </Link>
          輸入使用者名稱後再新增排程。
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
        <Calendar
          startDate={room.start_date}
          endDate={room.end_date}
          participants={participants}
          schedules={schedules}
          agreedSlots={agreedSlots}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          onDateClick={handleDateClick}
          onAgreedClick={handleAgreedClick}
        />
        <div className="flex flex-col gap-4">
          <ParticipantLegend
            participants={participants}
            currentParticipantId={currentParticipantId}
          />
          <AvailableDatesPanel
            availableSlots={availableSlots}
            currentMonth={currentMonth}
            onSlotClick={userName ? handleAvailableSlotClick : undefined}
          />
        </div>
      </div>

      {selectedDate && userName && (
        <ScheduleModal
          key={`${selectedDate}-${myScheduleOnSelectedDate?.id ?? "new"}`}
          dateKey={selectedDate}
          schedules={selectedDateSchedules}
          myScheduleId={myScheduleOnSelectedDate?.id ?? null}
          myScheduleNote={myScheduleOnSelectedDate?.note ?? null}
          myStartTime={myScheduleOnSelectedDate?.start_time ?? null}
          myEndTime={myScheduleOnSelectedDate?.end_time ?? null}
          userName={userName}
          onClose={() => setSelectedDate(null)}
          onSave={handleSaveSchedule}
          onDelete={handleDeleteSchedule}
        />
      )}

      {appointmentModal && userName && createSlot && (
        <AppointmentModal
          key={`create-${createSlot.date}-${createSlot.startTime}`}
          mode="create"
          dateKey={createSlot.date}
          startTime={createSlot.startTime}
          endTime={createSlot.endTime}
          userName={userName}
          onClose={() => setAppointmentModal(null)}
          onSave={handleSaveAgreed}
        />
      )}

      {appointmentModal && userName && agreedForModal && (
        <AppointmentModal
          key={`view-${agreedForModal.id}`}
          mode="view"
          dateKey={agreedForModal.date}
          startTime={agreedForModal.start_time}
          endTime={agreedForModal.end_time}
          title={agreedForModal.title}
          userName={userName}
          onClose={() => setAppointmentModal(null)}
          onSave={handleSaveAgreed}
          onDelete={() => handleDeleteAgreed(agreedForModal.id)}
        />
      )}
    </div>
  );
}
