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
}

export interface DateInfo {
  date: string;
  schedules: Array<{ participant: Participant; note: string | null }>;
  isAvailable: boolean;
}
