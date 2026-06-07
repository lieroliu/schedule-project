export interface Room {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface Participant {
  id: string;
  room_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Schedule {
  id: string;
  room_id: string;
  participant_id: string;
  date: string;
  note: string | null;
  start_time: string | null;
  end_time: string | null;
}

export interface AgreedSlot {
  id: string;
  room_id: string;
  date: string;
  start_time: string;
  end_time: string;
  title: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ScheduleEntry {
  participant: Participant;
  note: string | null;
  start_time: string | null;
  end_time: string | null;
}

export interface DateInfo {
  date: string;
  schedules: ScheduleEntry[];
  agreedSlots: AgreedSlot[];
  isFullyFree: boolean;
  hasFreeSlots: boolean;
}
