import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DEFAULT_TIMER_STATE, HackathonTimerState, calculateCurrentRemaining } from "@/lib/timer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: "hackathon_timer" },
    });

    let state: HackathonTimerState = DEFAULT_TIMER_STATE;

    if (config?.value) {
      try {
        state = { ...DEFAULT_TIMER_STATE, ...JSON.parse(config.value) };
      } catch (e) {
        console.error("Failed to parse hackathon_timer config:", e);
      }
    }

    const currentRemainingSeconds = calculateCurrentRemaining(state);
    const isCompleted = state.status === "RUNNING" && currentRemainingSeconds <= 0;

    return NextResponse.json(
      {
        ...state,
        currentRemainingSeconds,
        isCompleted,
        serverTime: Date.now(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/timer error:", error);
    return NextResponse.json(
      {
        ...DEFAULT_TIMER_STATE,
        currentRemainingSeconds: DEFAULT_TIMER_STATE.remainingSeconds,
        isCompleted: false,
        serverTime: Date.now(),
        error: "Failed to fetch live timer data.",
      },
      { status: 500 }
    );
  }
}
