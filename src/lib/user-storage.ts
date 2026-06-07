const USER_NAME_KEY = "schedule-user-name";
const PARTICIPANT_ID_KEY = "schedule-participant-id";

export function getUserName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(USER_NAME_KEY) ?? "";
}

export function setUserName(name: string): void {
  localStorage.setItem(USER_NAME_KEY, name.trim());
}

function participantStorageKey(roomId: string, userName: string): string {
  return `${PARTICIPANT_ID_KEY}-${roomId}-${userName.trim()}`;
}

export function getParticipantId(roomId: string, userName: string): string | null {
  if (typeof window === "undefined" || !userName.trim()) return null;
  return localStorage.getItem(participantStorageKey(roomId, userName));
}

export function setParticipantId(
  roomId: string,
  userName: string,
  participantId: string,
): void {
  localStorage.setItem(participantStorageKey(roomId, userName), participantId);
}
