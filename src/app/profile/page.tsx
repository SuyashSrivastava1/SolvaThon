"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  getTeamDetails,
  createTeam,
  joinTeam,
  selectProblemStatement,
  submitProject,
  submitFinalProject
} from "@/actions/team";
import { auth } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { problemStatements } from "@/data";
import { isAdminEmail } from "@/config/admin";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [teamData, setTeamData] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form states for Team creation/joining
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [actionStatus, setActionStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState("");

  // Track selection
  const [selectedTrack, setSelectedTrack] = useState("");
  const [trackStatus, setTrackStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [trackMsg, setTrackMsg] = useState("");

  // Phase view state: Defaults automatically to FINAL if super admin enabled final phase
  const [activePhaseView, setActivePhaseView] = useState<"IDEA" | "FINAL">("IDEA");

  // Phase 1: Idea submission
  const [submission, setSubmission] = useState({
    pptUrl: "",
    understanding: "",
    solutionSummary: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [subMsg, setSubMsg] = useState("");
  const [subError, setSubError] = useState("");

  // Phase 2: Final project submission
  const [finalSubmission, setFinalSubmission] = useState({
    finalDocUrl: "",
    finalRepoUrl: "",
    finalDemoUrl: "",
    finalSummary: ""
  });
  const [submittingFinal, setSubmittingFinal] = useState(false);
  const [finalMsg, setFinalMsg] = useState("");
  const [finalError, setFinalError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      if (isAdminEmail(user.email)) {
        router.replace("/admin");
        return;
      }
      fetchTeam();
    }
  }, [user, loading, router]);

  const fetchTeam = async () => {
    if (!user) return;
    setFetching(true);
    setFetchError(null);
    try {
      const result = await getTeamDetails(user.uid);
      if (!result.success && result.error === "Participant not found.") {
        router.push("/register");
        return;
      }
      if (result.success) {
        setTeamData(result);
        if (result.team?.problemStatement) {
          setSelectedTrack(result.team.problemStatement);
        }
        if (result.team) {
          setSubmission({
            pptUrl: result.team.pptUrl || "",
            understanding: result.team.understanding || "",
            solutionSummary: result.team.solutionSummary || ""
          });
          setFinalSubmission({
            finalDocUrl: result.team.finalDocUrl || "",
            finalRepoUrl: result.team.finalRepoUrl || "",
            finalDemoUrl: result.team.finalDemoUrl || "",
            finalSummary: result.team.finalSummary || ""
          });

          // If super admin has switched the global phase to FINAL, auto-direct participant to final project page
          if (result.submissionPhase === "FINAL") {
            setActivePhaseView("FINAL");
          }
        }
      } else {
        setFetchError(result.error || "Failed to load team data.");
      }
    } catch (err: any) {
      console.error("fetchTeam Error:", err);
      setFetchError("Unable to retrieve participant details. Please check your connection.");
    } finally {
      setFetching(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionStatus("loading");
    setMessage("");
    const result = await createTeam(user!.uid, teamName);
    if (result.success) {
      setActionStatus("success");
      setMessage("Team created successfully! Code: " + result.teamCode);
      fetchTeam();
    } else {
      setActionStatus("error");
      setMessage(result.error || "Failed to create team.");
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionStatus("loading");
    setMessage("");
    const result = await joinTeam(user!.uid, teamCode);
    if (result.success) {
      setActionStatus("success");
      setMessage("Successfully joined the team!");
      fetchTeam();
    } else {
      setActionStatus("error");
      setMessage(result.error || "Failed to join team.");
    }
  };

  const handleSaveTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrack) return;
    setTrackStatus("loading");
    setTrackMsg("");
    const res = await selectProblemStatement(user!.uid, selectedTrack);
    if (res.success) {
      setTrackStatus("success");
      setTrackMsg("Problem Statement locked successfully!");
      fetchTeam();
    } else {
      setTrackStatus("error");
      setTrackMsg(res.error || "Failed to set problem statement.");
    }
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubError("");
    setSubMsg("");
    const res = await submitProject(user!.uid, submission);
    if (res.success) {
      setSubMsg("Idea presentation updated successfully! Ready for jury evaluation.");
      fetchTeam();
    } else {
      setSubError(res.error || "Failed to submit presentation.");
    }
    setSubmitting(false);
  };

  const handleSubmitFinalProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFinal(true);
    setFinalError("");
    setFinalMsg("");
    const res = await submitFinalProject(user!.uid, finalSubmission);
    if (res.success) {
      setFinalMsg("Final project deliverable submitted successfully! Stored for jury evaluation.");
      fetchTeam();
    } else {
      setFinalError(res.error || "Failed to submit final deliverable.");
    }
    setSubmittingFinal(false);
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center text-white px-4">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
        <p className="text-white/60 font-mono text-xs tracking-widest uppercase">RETRIEVING PROFILE TELEMETRY...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center text-white px-4">
        <div className="max-w-md w-full bg-white/[0.04] border border-white/10 p-8 rounded-3xl backdrop-blur-2xl text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <span className="material-symbols-outlined text-3xl">warning</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Profile Data Unavailable</h2>
            <p className="text-white/60 text-xs leading-relaxed">{fetchError}</p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={fetchTeam}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              Retry Connection
            </button>
            <Link
              href="/register"
              className="w-full py-3.5 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              Complete Registration
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { participant } = teamData;
  const isFinalActive = teamData.submissionPhase === "FINAL";

  return (
    <div className="min-h-screen bg-[#030712] relative text-white font-sans selection:bg-cyan-500/30 py-12 px-4 md:px-8">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="container mx-auto max-w-5xl relative z-10 space-y-10">
        
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Portal
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-white/50 hidden sm:inline">
              UID: {user?.uid.slice(0, 8)}...
            </span>
            <button
              onClick={() => {
                signOut(auth);
                router.replace("/");
              }}
              className="px-4 py-2 bg-white/10 hover:bg-red-500/20 hover:text-red-300 text-white/80 rounded-xl text-xs font-semibold transition-all border border-transparent hover:border-red-500/30 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Sign Out
            </button>
          </div>
        </div>

        {/* Global Phase Notification Banner */}
        {isFinalActive && (
          <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-cyan-500/20 border border-emerald-500/40 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-emerald-500/10 animate-pulse">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <span className="material-symbols-outlined text-2xl">rocket_launch</span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Final Project Submission Phase is Live!</h4>
                <p className="text-xs text-white/70">
                  Super Admin has unlocked Phase 2. Please submit your final documentation and repository code.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActivePhaseView("FINAL")}
              className="px-4 py-2 bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all hover:bg-emerald-300 shrink-0 cursor-pointer"
            >
              Go to Final Submission
            </button>
          </div>
        )}

        {/* Participant Identification Pass */}
        {participant && (
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-4 w-full">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div>
                  <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest">OFFICIAL PARTICIPANT BADGE</div>
                  <h1 className="text-2xl md:text-3xl font-black text-white mt-0.5">{participant.fullName}</h1>
                  <p className="text-xs font-mono text-white/50">{participant.emailId}</p>
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 rounded-2xl text-right">
                  <span className="text-[10px] uppercase font-mono text-cyan-400/70 block">TICKET ID</span>
                  <span className="text-lg font-mono font-black text-cyan-300 tracking-wider block">{participant.ticketId}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                <div className="bg-black/40 p-3.5 rounded-2xl border border-white/10 space-y-0.5">
                  <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider block">Hostel Block</span>
                  <span className="text-sm font-bold text-white block">{participant.hostelBlock}</span>
                </div>
                <div className="bg-black/40 p-3.5 rounded-2xl border border-white/10 space-y-0.5">
                  <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider block">Room Number</span>
                  <span className="text-sm font-bold text-white block">{participant.roomNumber}</span>
                </div>
                <div className="bg-black/40 p-3.5 rounded-2xl border border-white/10 space-y-0.5">
                  <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider block">Mess Caterer</span>
                  <span className="text-sm font-bold text-white block">{participant.messCaterer}</span>
                </div>
                <div className="bg-black/40 p-3.5 rounded-2xl border border-white/10 space-y-0.5">
                  <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider block">Meal Plan</span>
                  <span className="text-sm font-bold text-cyan-400 block">{participant.messType}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team & Submissions Section */}
        {teamData.hasTeam ? (
          <div className="space-y-10">
            
            {/* Active Team Cluster Card */}
            <div className="bg-gradient-to-br from-blue-950/30 via-cyan-950/10 to-slate-900/40 border border-cyan-500/30 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-2xl space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-white/10 gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                    ACTIVE TEAM CLUSTER
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white">{teamData.team.name}</h2>
                </div>

                <div className="bg-black/60 border border-cyan-500/30 rounded-2xl p-4 text-center min-w-[180px] shadow-lg">
                  <p className="text-[10px] uppercase font-mono text-white/50 tracking-widest mb-0.5">TEAM INVITE CODE</p>
                  <p className="font-mono text-2xl font-black tracking-widest text-emerald-400 select-all">
                    {teamData.team.teamCode}
                  </p>
                  <p className="text-[10px] text-white/40 font-mono">
                    {teamData.team.members.length}/4 Members Joined
                  </p>
                </div>
              </div>

              {/* Roster Members */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {teamData.team.members.map((m: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-black/40 p-3.5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-mono text-xs text-cyan-400 font-bold">
                        0{idx + 1}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-sm text-white truncate">{m.name}</p>
                        <p className="text-[11px] font-mono text-white/40 truncate">{m.ticketId}</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Evaluation Scorecard (If Evaluated by Admin) */}
            {teamData.team.scoreTotal !== null && teamData.team.scoreTotal !== undefined && (
              <div className="bg-gradient-to-br from-purple-950/30 via-indigo-950/20 to-slate-900/50 border border-purple-500/30 rounded-3xl p-6 md:p-8 backdrop-blur-2xl space-y-5 shadow-2xl">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                      <span className="material-symbols-outlined text-2xl">workspace_premium</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Official Jury Evaluation</h3>
                      <p className="text-xs text-purple-300/70 font-mono">
                        Evaluated by Administrator on {teamData.team.evaluatedAt ? new Date(teamData.team.evaluatedAt).toLocaleDateString() : 'Recent'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-purple-300 uppercase block">Total Score</span>
                    <span className="text-3xl font-black text-purple-300 font-mono">{teamData.team.scoreTotal} <span className="text-sm text-white/40">/ 300</span></span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-black/40 border border-white/10 p-4 rounded-2xl text-center space-y-1">
                    <span className="text-xs text-white/50 font-mono uppercase block">Innovation</span>
                    <span className="text-2xl font-black text-cyan-400 font-mono">{teamData.team.scoreInnovation ?? 0}</span>
                    <span className="text-[10px] text-white/40 block">/ 100 Points</span>
                  </div>
                  <div className="bg-black/40 border border-white/10 p-4 rounded-2xl text-center space-y-1">
                    <span className="text-xs text-white/50 font-mono uppercase block">Problem Understanding</span>
                    <span className="text-2xl font-black text-blue-400 font-mono">{teamData.team.scoreUnderstanding ?? 0}</span>
                    <span className="text-[10px] text-white/40 block">/ 100 Points</span>
                  </div>
                  <div className="bg-black/40 border border-white/10 p-4 rounded-2xl text-center space-y-1">
                    <span className="text-xs text-white/50 font-mono uppercase block">Progress &amp; Execution</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">{teamData.team.scoreProgress ?? 0}</span>
                    <span className="text-[10px] text-white/40 block">/ 100 Points</span>
                  </div>
                </div>

                {teamData.team.evaluationNotes && (
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xs text-white/80 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-purple-400 font-bold block">Jury Remarks:</span>
                    <p className="italic leading-relaxed">{teamData.team.evaluationNotes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Submission Phase Tabs (Controlled by Super Admin with Participant Switcher) */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white/[0.03] border border-white/10 p-3.5 rounded-2xl backdrop-blur-xl">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActivePhaseView("IDEA")}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                    activePhaseView === "IDEA"
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                      : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">slideshow</span>
                  Phase 1: Idea Submission
                  {teamData.team.submittedAt && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActivePhaseView("FINAL")}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                    activePhaseView === "FINAL"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-black shadow-lg shadow-emerald-500/20 font-extrabold"
                      : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">rocket_launch</span>
                  Phase 2: Final Project
                  {teamData.team.finalSubmittedAt && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-white/40 uppercase">Current Official Stage:</span>
                <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
                  isFinalActive
                    ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                    : "bg-cyan-500/20 border border-cyan-500/30 text-cyan-300"
                }`}>
                  {isFinalActive ? "⚡ Phase 2: Final Submission" : "💡 Phase 1: Idea Submission"}
                </span>
              </div>
            </div>

            {/* ═════════ VIEW 1: PHASE 1 (IDEA SUBMISSION & TRACK SELECTION) ═════════ */}
            {activePhaseView === "IDEA" && (
              <div className="space-y-8 animate-fadeIn">
                {/* Problem Statement Track Selection */}
                <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl space-y-6">
                  <div className="border-b border-white/10 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
                        PROTOCOL // TRACK ALLOCATION
                      </div>
                      <h3 className="text-xl font-bold text-white">Select Your Problem Statement</h3>
                    </div>
                    {teamData.team.problemStatement && (
                      <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
                        ✓ TRACK LOCKED: {teamData.team.problemStatement}
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleSaveTrack} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {problemStatements.map((ps) => {
                        const isSelected = selectedTrack === ps.id;
                        return (
                          <div
                            key={ps.id}
                            onClick={() => setSelectedTrack(ps.id)}
                            className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3 ${
                              isSelected
                                ? "bg-cyan-500/10 border-cyan-500 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500/50"
                                : "bg-black/30 border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-cyan-400">
                                {ps.id}
                              </span>
                              <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
                                {ps.track}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-white mb-1">{ps.title}</h4>
                              <p className="text-xs text-white/60 leading-relaxed line-clamp-2">{ps.description}</p>
                            </div>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {ps.tags.map((t, idx) => (
                                <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/50">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/5">
                      <p className="text-xs text-white/50 font-mono">
                        Locking your track assigns your team to the domain mentors and rubrics.
                      </p>
                      <button
                        type="submit"
                        disabled={!selectedTrack || trackStatus === "loading"}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
                      >
                        {trackStatus === "loading" ? "Locking Track..." : "Confirm Problem Statement"}
                      </button>
                    </div>

                    {trackMsg && (
                      <div className={`p-3.5 rounded-xl text-center text-xs font-mono ${
                        trackStatus === "error" ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {trackMsg}
                      </div>
                    )}
                  </form>
                </div>

                {/* Phase 1: Presentation & Abstract Submission Form */}
                <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl space-y-6">
                  <div className="border-b border-white/10 pb-4 space-y-1">
                    <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
                      STAGE 01 // IDEA &amp; ABSTRACT SUBMISSION
                    </div>
                    <h3 className="text-xl font-bold text-white">Idea &amp; Presentation Submission</h3>
                    <p className="text-xs text-white/60">
                      Submit your team presentation link, problem statement understanding, and solution architecture.
                    </p>
                  </div>

                  {teamData.team.submittedAt && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-emerald-400">
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-xl">task_alt</span>
                        <span>Idea Submission Recorded on {new Date(teamData.team.submittedAt).toLocaleString()}</span>
                      </div>
                      <span className="uppercase font-bold tracking-wider px-2.5 py-0.5 bg-emerald-500/20 rounded">
                        RECORDED IN DATABASE
                      </span>
                    </div>
                  )}

                  <form onSubmit={handleSubmitProject} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
                        Presentation / PPT Link <span className="text-cyan-400">*</span>
                      </label>
                      <input
                        type="url"
                        required
                        value={submission.pptUrl}
                        onChange={(e) => setSubmission({ ...submission, pptUrl: e.target.value })}
                        placeholder="https://docs.google.com/presentation/d/... or Canva / Drive link"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:ring-2 focus:ring-cyan-500/50 outline-none font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
                        Understanding of Problem Statement <span className="text-cyan-400">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={submission.understanding}
                        onChange={(e) => setSubmission({ ...submission, understanding: e.target.value })}
                        placeholder="Explain your team's understanding of the core issues and technical constraints..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:ring-2 focus:ring-cyan-500/50 outline-none font-mono text-sm leading-relaxed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
                        Proposed Solution Architecture <span className="text-cyan-400">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={submission.solutionSummary}
                        onChange={(e) => setSubmission({ ...submission, solutionSummary: e.target.value })}
                        placeholder="Outline your tech stack, system architecture, and novelty of your idea..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:ring-2 focus:ring-cyan-500/50 outline-none font-mono text-sm leading-relaxed"
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                            <span>Saving Submission...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-lg">cloud_upload</span>
                            <span>{teamData.team.submittedAt ? "Update Idea Submission" : "Submit Idea Deliverable"}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {subMsg && (
                      <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono text-center rounded-xl">
                        {subMsg}
                      </div>
                    )}
                    {subError && (
                      <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono text-center rounded-xl">
                        {subError}
                      </div>
                    )}
                  </form>
                </div>
              </div>
            )}

            {/* ═════════ VIEW 2: PHASE 2 (FINAL PROJECT SUBMISSION PAGE) ═════════ */}
            {activePhaseView === "FINAL" && (
              <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl space-y-6 animate-fadeIn">
                <div className="border-b border-white/10 pb-4 space-y-1">
                  <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-widest font-semibold">
                    STAGE 02 // FINAL PROJECT DELIVERABLE SUBMISSION
                  </div>
                  <h3 className="text-2xl font-extrabold text-white">Final Project Submission Portal</h3>
                  <p className="text-xs text-white/60">
                    Submit your final project documentation, source code repository, and working demonstration for final judging.
                  </p>
                </div>

                {teamData.team.finalSubmittedAt && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-emerald-400">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-xl">verified</span>
                      <span>Final Project Submitted on {new Date(teamData.team.finalSubmittedAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {teamData.team.finalDocUrl && (
                        <a
                          href={teamData.team.finalDocUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 rounded text-[11px] underline"
                        >
                          View Document ↗
                        </a>
                      )}
                      {teamData.team.finalRepoUrl && (
                        <a
                          href={teamData.team.finalRepoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded text-[11px] underline"
                        >
                          View Code Repo ↗
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmitFinalProject} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
                      Final Project Document Link <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      value={finalSubmission.finalDocUrl}
                      onChange={(e) => setFinalSubmission({ ...finalSubmission, finalDocUrl: e.target.value })}
                      placeholder="https://docs.google.com/document/d/... or Drive PDF / Notion Report"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:ring-2 focus:ring-emerald-500/50 outline-none font-mono text-sm"
                    />
                    <p className="text-[11px] text-white/40 font-mono">
                      Must be accessible by jury (ensure view permissions are enabled on Google Drive).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
                        GitHub / Source Code Repository <span className="text-cyan-400">*</span>
                      </label>
                      <input
                        type="url"
                        required
                        value={finalSubmission.finalRepoUrl}
                        onChange={(e) => setFinalSubmission({ ...finalSubmission, finalRepoUrl: e.target.value })}
                        placeholder="https://github.com/organization/repo"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:ring-2 focus:ring-cyan-500/50 outline-none font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
                        Live Demo / Video Pitch URL <span className="text-white/40 text-[10px]">(Optional)</span>
                      </label>
                      <input
                        type="url"
                        value={finalSubmission.finalDemoUrl}
                        onChange={(e) => setFinalSubmission({ ...finalSubmission, finalDemoUrl: e.target.value })}
                        placeholder="https://youtu.be/... or deployed Vercel URL"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:ring-2 focus:ring-cyan-500/50 outline-none font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
                      Executive Technical Summary &amp; Implementation Highlights <span className="text-emerald-400">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={finalSubmission.finalSummary}
                      onChange={(e) => setFinalSubmission({ ...finalSubmission, finalSummary: e.target.value })}
                      placeholder="Detail your engineering progress, hardware/software stack, how you tested your solution, and future roadmap..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:ring-2 focus:ring-emerald-500/50 outline-none font-mono text-sm leading-relaxed"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingFinal}
                      className="px-9 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-emerald-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                      {submittingFinal ? (
                        <>
                          <span className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin"></span>
                          <span>Uploading Final Deliverables...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-xl">check_circle</span>
                          <span>{teamData.team.finalSubmittedAt ? "Update Final Project Submission" : "Submit Final Project"}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {finalMsg && (
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono text-center rounded-xl">
                      {finalMsg}
                    </div>
                  )}
                  {finalError && (
                    <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono text-center rounded-xl">
                      {finalError}
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        ) : (
          /* Not in a team yet: Create or Join */
          <div className="grid md:grid-cols-2 gap-8">
            {/* Create Team */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl shadow-xl flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <span className="material-symbols-outlined text-2xl">add_circle</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1 text-white">Create a New Team</h3>
                  <p className="text-white/60 text-xs leading-relaxed">
                    Form a new team cluster, receive your unique 6-character team invite code, and invite up to 3 hostellite peers.
                  </p>
                </div>

                <form onSubmit={handleCreate} className="space-y-3.5 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
                      Team Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CyberVanguard"
                      required
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-sans text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={actionStatus === "loading"}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider"
                  >
                    {actionStatus === "loading" ? "Creating Team..." : "Create Team Cluster"}
                  </button>
                </form>
              </div>
            </div>

            {/* Join Team */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl shadow-xl flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <span className="material-symbols-outlined text-2xl">group_add</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1 text-white">Join Existing Team</h3>
                  <p className="text-white/60 text-xs leading-relaxed">
                    Enter the 6-character alphanumeric Team Code provided by your team lead to join their cluster.
                  </p>
                </div>

                <form onSubmit={handleJoin} className="space-y-3.5 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
                      6-Character Team Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AB12CD"
                      required
                      maxLength={6}
                      value={teamCode}
                      onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono tracking-widest text-lg uppercase text-center"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={actionStatus === "loading"}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider"
                  >
                    {actionStatus === "loading" ? "Joining Team..." : "Join Team"}
                  </button>
                </form>
              </div>
            </div>

            {message && (
              <div
                className={`col-span-1 md:col-span-2 text-center p-3.5 rounded-2xl border text-xs font-mono font-medium ${
                  actionStatus === "error"
                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                }`}
              >
                {message}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
