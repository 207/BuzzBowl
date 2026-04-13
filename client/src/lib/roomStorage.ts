export function hostKey(roomCode: string): string {
  return `buzzin_host_${roomCode.trim().toUpperCase()}`;
}

export function playerKey(roomCode: string): string {
  return `buzzin_player_${roomCode.trim().toUpperCase()}`;
}

export function setupKey(roomCode: string): string {
  return `buzzin_setup_${roomCode.trim().toUpperCase()}`;
}

export interface HostSetupPayload {
  mode: "ffa" | "teams";
  difficulty: string;
  category: string;
  questionCount: number;
  hostName: string;
}

export function readHostSetup(code: string): HostSetupPayload | null {
  try {
    const raw = sessionStorage.getItem(setupKey(code));
    if (!raw) return null;
    return JSON.parse(raw) as HostSetupPayload;
  } catch {
    return null;
  }
}
