export type TimerStatus = "STOPPED" | "RUNNING" | "PAUSED";

export interface HackathonTimerState {
  status: TimerStatus;
  durationSeconds: number; // Initial duration configured by admin (e.g. 24h = 86400)
  remainingSeconds: number; // Frozen remaining seconds when paused/stopped
  targetTimestamp: number | null; // Milliseconds timestamp of target end time when RUNNING
  startedAt: number | null;
  pausedAt: number | null;
  updatedAt: number;
  title: string;
  phaseLabel: string;
}

export const DEFAULT_TIMER_STATE: HackathonTimerState = {
  status: "STOPPED",
  durationSeconds: 24 * 3600, // 24 hours
  remainingSeconds: 24 * 3600,
  targetTimestamp: null,
  startedAt: null,
  pausedAt: null,
  updatedAt: Date.now(),
  title: "Solve-a-thon 2026",
  phaseLabel: "Official 24-Hour Hackathon Clock",
};

/**
 * Calculates the current real-time remaining seconds for a given timer state.
 */
export function calculateCurrentRemaining(state: HackathonTimerState): number {
  if (state.status === "RUNNING" && state.targetTimestamp) {
    const diff = Math.floor((state.targetTimestamp - Date.now()) / 1000);
    return Math.max(0, diff);
  }
  return Math.max(0, state.remainingSeconds);
}
