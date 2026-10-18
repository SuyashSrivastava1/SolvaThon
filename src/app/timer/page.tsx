"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { HackathonTimerState, DEFAULT_TIMER_STATE } from "@/lib/timer";

interface LiveTimerData extends HackathonTimerState {
  currentRemainingSeconds: number;
  isCompleted: boolean;
  serverTime: number;
}

export default function HackathonTimerPage() {
  const [timerData, setTimerData] = useState<LiveTimerData>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("solvathon_timer_state_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed.currentRemainingSeconds === "number") {
            return parsed;
          }
        }
      } catch {}
    }
    return {
      ...DEFAULT_TIMER_STATE,
      currentRemainingSeconds: DEFAULT_TIMER_STATE.remainingSeconds,
      isCompleted: false,
      serverTime: Date.now(),
    };
  });

  const [remaining, setRemaining] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("solvathon_timer_state_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.status === "RUNNING" && parsed.targetTimestamp) {
            return Math.max(0, Math.floor((parsed.targetTimestamp - Date.now()) / 1000));
          }
          if (typeof parsed.remainingSeconds === "number") return parsed.remainingSeconds;
        }
      } catch {}
    }
    return DEFAULT_TIMER_STATE.remainingSeconds;
  });

  const [isFullscreen, setIsFullscreen] = useState(false);

  const localTargetRef = useRef<number | null>(null);
  const localStatusRef = useRef<string>(DEFAULT_TIMER_STATE.status);
  const localRemainingRef = useRef<number>(DEFAULT_TIMER_STATE.remainingSeconds);
  const serverOffsetRef = useRef<number>(0);

  // Fetch live state from server API
  const fetchTimerState = useCallback(async () => {
    try {
      const res = await fetch("/api/timer", {
        cache: "no-store",
        headers: { Pragma: "no-cache" },
      });

      if (!res.ok) return;

      const data: LiveTimerData = await res.json();
      try {
        localStorage.setItem("solvathon_timer_state_cache", JSON.stringify(data));
      } catch {}
      setTimerData(data);

      localStatusRef.current = data.status;
      localTargetRef.current = data.targetTimestamp;
      localRemainingRef.current = data.currentRemainingSeconds;

      if (data.serverTime) {
        serverOffsetRef.current = Date.now() - data.serverTime;
      }
    } catch {}
  }, []);

  // Initial fetch and 2-second background poll
  useEffect(() => {
    fetchTimerState();
    const pollInterval = setInterval(fetchTimerState, 2000);
    return () => clearInterval(pollInterval);
  }, [fetchTimerState]);

  // Smooth client-side 100ms tick loop
  useEffect(() => {
    const tickInterval = setInterval(() => {
      const now = Date.now() - serverOffsetRef.current;

      if (localStatusRef.current === "RUNNING" && localTargetRef.current) {
        const diffMs = localTargetRef.current - now;
        if (diffMs <= 0) {
          setRemaining(0);
        } else {
          setRemaining(Math.floor(diffMs / 1000));
        }
      } else {
        setRemaining(localRemainingRef.current);
      }
    }, 100);

    return () => clearInterval(tickInterval);
  }, []);

  // Fullscreen trigger (enter fullscreen)
  const enterFullscreen = () => {
    if (!document.fullscreenElement) {
      const el = document.documentElement as any;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen();
      }
    }
  };

  // Fullscreen state listener (exited only when Escape is pressed on keyboard)
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    document.addEventListener("mozfullscreenchange", handleFsChange);
    document.addEventListener("MSFullscreenChange", handleFsChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
      document.removeEventListener("mozfullscreenchange", handleFsChange);
      document.removeEventListener("MSFullscreenChange", handleFsChange);
    };
  }, []);

  // 24-hour time calculations without days (e.g. 24:00:00)
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  const hStr = String(hours).padStart(2, "0");
  const mStr = String(minutes).padStart(2, "0");
  const sStr = String(seconds).padStart(2, "0");

  return (
    <div
      className="min-h-screen bg-[#07090E] text-white font-sans selection:bg-cyan-500/30 relative flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden select-none"
      suppressHydrationWarning
    >
      {/* Dynamic Ambient Backdrops */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none mix-blend-overlay"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-cyan-500/10 rounded-full blur-[180px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[180px] pointer-events-none"></div>

      {/* Fullscreen Button — fades out upon entering fullscreen and only returns when Esc is pressed */}
      <button
        onClick={enterFullscreen}
        aria-label="Enter Fullscreen"
        title="Enter Fullscreen"
        className={`fixed top-6 right-6 z-50 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-opacity duration-500 cursor-pointer flex items-center justify-center backdrop-blur-md shadow-lg ${
          isFullscreen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <span className="material-symbols-outlined text-2xl">fullscreen</span>
      </button>

      {/* Centered Content: Only the two lines of text and the timer */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center">
        {/* Two lines of text just above the timer */}
        <div className="mb-6 sm:mb-8 md:mb-12 flex flex-col items-center gap-3 sm:gap-4">
          {/* Line 1: Pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 font-mono text-xs sm:text-sm font-bold tracking-widest uppercase shadow-lg shadow-cyan-500/10">
            <span className="material-symbols-outlined text-base">timer</span>
            <span>{timerData.phaseLabel || "OFFICIAL 24-HOUR HACKATHON CLOCK"}</span>
          </div>

          {/* Line 2: Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase drop-shadow-md">
            {timerData.title || "SOLVE-A-THON 2026"}
          </h1>
        </div>

        {/* Timer at the center: 24:00:00 (no extra cards or sections) */}
        <div
          className="font-mono font-black tracking-tight tabular-nums select-none flex items-center justify-center drop-shadow-[0_0_60px_rgba(56,189,248,0.35)]"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "clamp(3.5rem, 15vw, 13rem)",
            lineHeight: 1,
          }}
          suppressHydrationWarning
        >
          <span className="text-white drop-shadow-[0_0_35px_rgba(56,189,248,0.25)]">{hStr}</span>
          <span className="text-cyan-400/70 mx-1 sm:mx-2 md:mx-4">:</span>
          <span className="text-white drop-shadow-[0_0_35px_rgba(56,189,248,0.25)]">{mStr}</span>
          <span className="text-cyan-400/70 mx-1 sm:mx-2 md:mx-4">:</span>
          <span className="text-cyan-300 drop-shadow-[0_0_40px_rgba(56,189,248,0.5)]">{sStr}</span>
        </div>
      </main>
    </div>
  );
}
