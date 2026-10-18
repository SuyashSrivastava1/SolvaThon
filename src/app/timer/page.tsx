"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { HackathonTimerState, DEFAULT_TIMER_STATE, calculateCurrentRemaining } from "@/lib/timer";

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
  const [millis, setMillis] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");

  const localTargetRef = useRef<number | null>(null);
  const localStatusRef = useRef<string>(DEFAULT_TIMER_STATE.status);
  const localRemainingRef = useRef<number>(DEFAULT_TIMER_STATE.remainingSeconds);
  const serverOffsetRef = useRef<number>(0);

  // Play synthetic chime via Web Audio API (zero external asset dependencies)
  const playChime = useCallback((frequency = 880, duration = 0.5) => {
    if (!audioEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio chime error:", e);
    }
  }, [audioEnabled]);

  // Fetch live state from server API
  const fetchTimerState = useCallback(async () => {
    try {
      const res = await fetch("/api/timer", {
        cache: "no-store",
        headers: { Pragma: "no-cache" },
      });

      if (!res.ok) throw new Error("Network response error");

      const data: LiveTimerData = await res.json();
      try {
        localStorage.setItem("solvathon_timer_state_cache", JSON.stringify(data));
      } catch {}
      setNetworkError(false);
      setTimerData(data);

      localStatusRef.current = data.status;
      localTargetRef.current = data.targetTimestamp;
      localRemainingRef.current = data.currentRemainingSeconds;

      // Compute server vs client clock offset
      if (data.serverTime) {
        serverOffsetRef.current = Date.now() - data.serverTime;
      }
    } catch (err) {
      console.warn("Timer sync error:", err);
      setNetworkError(true);
    }
  }, []);

  // Initial fetch and 2-second background poll
  useEffect(() => {
    fetchTimerState();
    const pollInterval = setInterval(fetchTimerState, 2000);
    return () => clearInterval(pollInterval);
  }, [fetchTimerState]);

  // Smooth client-side 50ms tick loop
  useEffect(() => {
    const tickInterval = setInterval(() => {
      const now = Date.now() - serverOffsetRef.current;

      // Update current wall-clock time
      const nowObj = new Date();
      setCurrentTimeStr(
        nowObj.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );

      if (localStatusRef.current === "RUNNING" && localTargetRef.current) {
        const diffMs = localTargetRef.current - now;
        if (diffMs <= 0) {
          setRemaining(0);
          setMillis(0);
        } else {
          setRemaining(Math.floor(diffMs / 1000));
          setMillis(Math.floor((diffMs % 1000) / 10)); // 0-99
        }
      } else {
        setRemaining(localRemainingRef.current);
        setMillis(0);
      }
    }, 50);

    return () => clearInterval(tickInterval);
  }, []);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Split calculations
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  const totalDuration = timerData.durationSeconds || 86400;
  const elapsed = Math.max(0, totalDuration - remaining);
  const percentElapsed = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

  const isCompleted = timerData.status === "RUNNING" && remaining <= 0;
  const isPaused = timerData.status === "PAUSED";
  const isRunning = timerData.status === "RUNNING" && remaining > 0;
  const isStopped = timerData.status === "STOPPED";

  return (
    <div className="min-h-screen bg-[#07090E] text-white font-sans selection:bg-cyan-500/30 relative flex flex-col justify-between overflow-hidden">
      {/* Dynamic Ambient Backdrops */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none mix-blend-overlay"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-cyan-500/10 rounded-full blur-[180px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[180px] pointer-events-none"></div>

      {/* ── TOP BAR: TELEMETRY & BRAND ── */}
      <header className="relative z-20 w-full px-6 sm:px-10 py-6 flex items-center justify-between border-b border-white/5 backdrop-blur-md bg-black/20">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-3 group"
            title="Return to Main Portal"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-black text-black text-lg shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              S
            </div>
            <div>
              <div className="font-extrabold tracking-tight text-white text-base sm:text-lg flex items-center gap-2">
                <span>SOLVE-A-THON 2026</span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/5 border border-white/10 text-white/60">
                  VIT CHENNAI
                </span>
              </div>
              <div className="text-[11px] font-mono text-cyan-400 tracking-wider uppercase">
                Official Hackathon Telemetry Clock
              </div>
            </div>
          </Link>
        </div>

        {/* Live Status Beacon */}
        <div className="flex items-center gap-3">
          {isRunning && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>LIVE CLOCK ACTIVE</span>
            </div>
          )}
          {isPaused && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
              <span>CLOCK PAUSED BY ADMIN</span>
            </div>
          )}
          {isCompleted && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
              <span>TIME CONCLUDED</span>
            </div>
          )}
          {isStopped && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 font-mono text-xs font-bold uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-white/40"></span>
              <span>CLOCK STANDBY</span>
            </div>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Projector Fullscreen Mode"}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer hidden sm:flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-lg">
              {isFullscreen ? "fullscreen_exit" : "fullscreen"}
            </span>
          </button>

          {/* Audio Chime Toggle */}
          <button
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              if (!audioEnabled) playChime(660, 0.2);
            }}
            title={audioEnabled ? "Audio Chimes Enabled" : "Audio Chimes Muted"}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer hidden sm:flex items-center justify-center ${
              audioEnabled
                ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {audioEnabled ? "volume_up" : "volume_off"}
            </span>
          </button>
        </div>
      </header>

      {/* ── MAIN BODY: MASSIVE AUDITORIUM TIMER ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-8 md:py-12 max-w-7xl mx-auto w-full text-center">
        {/* Phase Header Flag */}
        <div className="mb-6 sm:mb-8 flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 font-mono text-xs sm:text-sm font-bold tracking-widest uppercase shadow-lg shadow-cyan-500/10">
            <span className="material-symbols-outlined text-base">timer</span>
            <span>{timerData.phaseLabel || "HACKATHON COUNTDOWN"}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white uppercase drop-shadow-md">
            {isCompleted ? "Time's Up! Hackathon Ended" : timerData.title || "Solve-a-thon 2026"}
          </h1>
        </div>

        {/* ── TIMER GRID (DAYS, HOURS, MINUTES, SECONDS) ── */}
        <div className="w-full max-w-5xl bg-black/40 border border-white/10 rounded-3xl p-6 sm:p-10 md:p-12 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.8),0_0_50px_rgba(56,189,248,0.15)] relative overflow-hidden">
          {/* Top Radial Glow Emitter */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-cyan-500/15 blur-2xl pointer-events-none" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 relative z-10">
            {/* Days Card */}
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/5 shadow-inner">
              <span
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white tabular-nums drop-shadow-[0_0_35px_rgba(56,189,248,0.25)]"
              >
                {String(days).padStart(2, "0")}
              </span>
              <span className="text-[11px] sm:text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase mt-2">
                DAYS
              </span>
            </div>

            {/* Hours Card */}
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/5 shadow-inner">
              <span
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white tabular-nums drop-shadow-[0_0_35px_rgba(56,189,248,0.25)]"
              >
                {String(hours).padStart(2, "0")}
              </span>
              <span className="text-[11px] sm:text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase mt-2">
                HOURS
              </span>
            </div>

            {/* Minutes Card */}
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/5 shadow-inner">
              <span
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white tabular-nums drop-shadow-[0_0_35px_rgba(56,189,248,0.25)]"
              >
                {String(minutes).padStart(2, "0")}
              </span>
              <span className="text-[11px] sm:text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase mt-2">
                MINUTES
              </span>
            </div>

            {/* Seconds Card */}
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/5 shadow-inner relative">
              <span
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-cyan-300 tabular-nums drop-shadow-[0_0_35px_rgba(56,189,248,0.4)]"
              >
                {String(seconds).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[11px] sm:text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                  SECONDS
                </span>
                {isRunning && (
                  <span className="text-[9px] font-mono text-cyan-300/60 tabular-nums">
                    .{String(millis).padStart(2, "0")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── PROGRESS BAR ── */}
          <div className="mt-8 pt-6 border-t border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono text-white/50">
              <span>ELAPSED: {percentElapsed.toFixed(1)}%</span>
              <span>
                {isCompleted
                  ? "HACKATHON CONCLUDED"
                  : isPaused
                  ? "COUNTDOWN PAUSED"
                  : `${Math.floor(remaining / 3600)}h ${Math.floor((remaining % 3600) / 60)}m REMAINING`}
              </span>
            </div>
            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(56,189,248,0.5)]"
                style={{ width: `${percentElapsed}%` }}
              />
            </div>
          </div>
        </div>

        {/* Network & Offline Status Banner */}
        {networkError && (
          <div className="mt-4 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
            ⚠️ Live link momentarily synchronizing... Timer continuing on local hardware clock.
          </div>
        )}
      </main>

      {/* ── FOOTER: AUDITORIUM TELEMETRY INFO ── */}
      <footer className="relative z-20 w-full px-6 sm:px-10 py-5 border-t border-white/5 backdrop-blur-md bg-black/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-white/50">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>HOSTED ON TIMER.SOLVATHON26.CO.IN</span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">SYSTEM TIME: {currentTimeStr || "--:--:--"}</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="text-white/40 hover:text-cyan-400 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
            Super Admin Controller
          </Link>
          <span>© 2026 SOLVE-A-THON</span>
        </div>
      </footer>
    </div>
  );
}
