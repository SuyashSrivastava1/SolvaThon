"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getTeamDetails, createTeam, joinTeam, selectProblemStatement, submitProject } from "@/actions/team";
import { auth } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { problemStatements } from "@/data";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [teamData, setTeamData] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form states
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [actionStatus, setActionStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState("");

  // Problem statement & submission states
  const [selectedTrack, setSelectedTrack] = useState("");
  const [trackStatus, setTrackStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [trackMsg, setTrackMsg] = useState("");

  const [submission, setSubmission] = useState({
    pptUrl: "",
    understanding: "",
    solutionSummary: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [subMsg, setSubMsg] = useState("");
  const [subError, setSubError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
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
      setSubMsg("Project submission updated successfully! Ready for jury evaluation.");
      fetchTeam();
    } else {
      setSubError(res.error || "Failed to submit project.");
    }
    setSubmitting(false);
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

  if (!user || !teamData) return null;

  const participant = teamData.participant;

  return (
    <div className="min-h-screen bg-[#030712] relative text-white font-sans selection:bg-cyan-500/30 py-16 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
      <div className="absolute top-10 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none"></div>

      <div className="container mx-auto max-w-6xl relative z-10 space-y-12">
        
        {/* Navigation Bar Header */}
        <div className="flex flex-wrap items-center justify-between gap-6 bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl shadow-xl">
          <div className="flex items-center gap-5">
            <Link 
              href="/" 
              className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-cyan-500/10 hover:border-cyan-500/30 text-white/80 hover:text-cyan-400 transition-all shadow-inner"
            >
              <span className="material-symbols-outlined text-2xl">home</span>
            </Link>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                  {participant?.fullName || user.email}
                </h1>
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-bold tracking-wider">
                  {participant?.ticketId || "VERIFIED"}
                </span>
              </div>
              <p className="text-white/50 text-xs font-mono tracking-wide">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/rules"
              className="px-5 py-2.5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-mono uppercase tracking-widest text-white/80 transition-all hover:text-white"
            >
              Guidelines
            </Link>
            <button
              onClick={() => signOut(auth)}
              className="px-5 py-2.5 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-mono uppercase tracking-widest font-semibold transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Digital Hackathon Pass Card */}
        {participant && (
          <div className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-cyan-950/20 to-slate-950 p-8 md:p-10 shadow-2xl backdrop-blur-2xl space-y-6">
            <div className="absolute top-0 right-0 px-6 py-2 bg-gradient-to-l from-cyan-500 to-blue-600 text-black font-extrabold text-xs uppercase tracking-widest rounded-bl-2xl shadow-lg font-mono">
              RESIDENTIAL PASS // 2025
            </div>

            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <span className="px-3.5 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-mono text-xs font-bold tracking-wider">
                  TICKET: {participant.ticketId}
                </span>
                <span className="text-white/30 font-mono text-sm">•</span>
                <span className="text-emerald-400 text-xs font-mono font-semibold flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  BIO-VERIFIED: {participant.hostelBlock}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 pt-2">
                <div className="bg-black/40 p-4 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider block">Hostel Block</span>
                  <span className="text-base font-bold text-white block">{participant.hostelBlock}</span>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider block">Room Number</span>
                  <span className="text-base font-bold text-white block">{participant.roomNumber}</span>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider block">Mess Caterer</span>
                  <span className="text-base font-bold text-white block">{participant.messCaterer}</span>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider block">Meal Type</span>
                  <span className="text-base font-bold text-cyan-400 block">{participant.messType}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team & Submissions Section */}
        {teamData.hasTeam ? (
          <div className="space-y-12">
            
            {/* Active Team Cluster Card */}
            <div className="bg-gradient-to-br from-blue-950/30 via-cyan-950/10 to-slate-900/40 border border-cyan-500/30 rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-2xl space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-8 border-b border-white/10 gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                    ACTIVE TEAM CLUSTER
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{teamData.team.name}</h2>
                </div>

                <div className="bg-black/60 border border-cyan-500/30 rounded-2xl p-5 text-center min-w-[200px] shadow-lg">
                  <p className="text-[10px] uppercase font-mono text-white/50 tracking-widest mb-1">TEAM INVITE CODE</p>
                  <p className="font-mono text-3xl font-black tracking-widest text-emerald-400 select-all">
                    {teamData.team.teamCode}
                  </p>
                  <p className="text-[11px] text-white/40 mt-1 font-mono">
                    Share with up to {4 - teamData.team.members.length} peers
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-white">
                    Roster Composition ({teamData.team.members.length}/4 Members)
                  </h3>
                  <span className={`text-xs font-mono px-3 py-1 rounded-full font-semibold ${
                    teamData.team.members.length >= 4 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  }`}>
                    {teamData.team.members.length >= 4 ? 'TEAM FULL' : `${4 - teamData.team.members.length} SLOTS OPEN`}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {teamData.team.members.map((m: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-black/40 p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-mono text-xs text-cyan-400 font-bold">
                          0{idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-base text-white">{m.name}</p>
                          <p className="text-xs font-mono text-white/40">{m.ticketId}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-emerald-400 text-xl">check_circle</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Problem Statement Track Selection */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-2xl space-y-8">
              <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
                    PROTOCOL // TRACK ALLOCATION
                  </div>
                  <h3 className="text-2xl font-bold text-white">Choose Your Problem Statement</h3>
                </div>
                {teamData.team.problemStatement && (
                  <span className="px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold self-start md:self-auto">
                    ✓ TRACK LOCKED: {teamData.team.problemStatement}
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveTrack} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {problemStatements.map((ps) => {
                    const isSelected = selectedTrack === ps.id;
                    return (
                      <div
                        key={ps.id}
                        onClick={() => setSelectedTrack(ps.id)}
                        className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-4 ${
                          isSelected
                            ? "bg-cyan-500/10 border-cyan-500 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500/50"
                            : "bg-white/[0.02] border-white/10 hover:border-white/25 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono text-cyan-400 font-bold px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                              {ps.id} • {ps.track}
                            </span>
                            <span className="text-xs font-mono text-white/40">{ps.difficulty}</span>
                          </div>
                          <h4 className="font-bold text-lg text-white">{ps.title}</h4>
                          <p className="text-xs text-white/70 leading-relaxed">{ps.description}</p>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-white/50">
                          <span>Mentor: {ps.mentor}</span>
                          <span className={`font-bold ${isSelected ? 'text-cyan-400' : 'text-white/30'}`}>
                            {isSelected ? 'SELECTED' : 'SELECT TRACK'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-white/5">
                  <p className="text-xs text-white/50 font-mono max-w-xl leading-relaxed">
                    Locking your track assigns your team to the domain mentors and specifies your evaluation rubrics.
                  </p>
                  <button
                    type="submit"
                    disabled={!selectedTrack || trackStatus === "loading"}
                    className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
                  >
                    {trackStatus === "loading" ? "Locking Track..." : "Confirm Problem Statement"}
                  </button>
                </div>

                {trackMsg && (
                  <div className={`p-4 rounded-xl text-center text-xs font-mono ${
                    trackStatus === "error" ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {trackMsg}
                  </div>
                )}
              </form>
            </div>

            {/* Project Submission Box */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-2xl space-y-8">
              <div className="border-b border-white/10 pb-6 space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
                  STAGE 02 // PRESENTATION &amp; ABSTRACT SUBMISSION
                </div>
                <h3 className="text-2xl font-bold text-white">Project Deliverable Submission</h3>
                <p className="text-xs text-white/60">
                  Submit your team presentation link, problem statement understanding, and solution overview.
                </p>
              </div>

              {teamData.team.submittedAt && (
                <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-emerald-400">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl">task_alt</span>
                    <span>Submission Recorded on {new Date(teamData.team.submittedAt).toLocaleString()}</span>
                  </div>
                  <span className="uppercase font-bold tracking-wider px-3 py-1 bg-emerald-500/20 rounded-lg">
                    READY FOR JURY EVALUATION
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmitProject} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
                    PPT / Presentation Link <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={submission.pptUrl}
                    onChange={(e) => setSubmission({ ...submission, pptUrl: e.target.value })}
                    placeholder="https://docs.google.com/presentation/d/... or Canva / Drive link"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:ring-2 focus:ring-cyan-500/50 outline-none font-mono text-sm transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
                    Understanding of the Problem Statement <span className="text-cyan-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={submission.understanding}
                    onChange={(e) => setSubmission({ ...submission, understanding: e.target.value })}
                    placeholder="Explain your team's understanding of the assigned problem statement..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:ring-2 focus:ring-cyan-500/50 outline-none font-mono text-sm leading-relaxed transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
                    Brief Description of Proposed Solution <span className="text-cyan-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={submission.solutionSummary}
                    onChange={(e) => setSubmission({ ...submission, solutionSummary: e.target.value })}
                    placeholder="Briefly describe your approach, solution architecture, and key features..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:ring-2 focus:ring-cyan-500/50 outline-none font-mono text-sm leading-relaxed transition-all"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-9 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-extrabold text-sm rounded-xl transition-all shadow-xl shadow-emerald-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <span className="w-5 h-5 border-2 border-black/40 border-t-black rounded-full animate-spin"></span>
                        <span>Saving Submission...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-xl">cloud_upload</span>
                        <span>{teamData.team.submittedAt ? "Update Deliverable Submission" : "Submit Final Deliverable"}</span>
                      </>
                    )}
                  </button>
                </div>

                {subMsg && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono text-center rounded-xl">
                    {subMsg}
                  </div>
                )}
                {subError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono text-center rounded-xl">
                    {subError}
                  </div>
                )}
              </form>
            </div>
          </div>
        ) : (
          /* Not in a team yet: Create or Join */
          <div className="grid md:grid-cols-2 gap-8">
            {/* Create Team */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-2xl shadow-xl flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <span className="material-symbols-outlined text-3xl">add_circle</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2 text-white">Create a New Team</h3>
                  <p className="text-white/60 text-xs leading-relaxed">
                    Initialize a new team cluster, generate your unique 6-character team invite code, and invite up to 3 hostellite peers.
                  </p>
                </div>

                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
                      Team Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CyberVanguard"
                      required
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-sans text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={actionStatus === "loading"}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer text-sm"
                  >
                    {actionStatus === "loading" ? "Creating Team..." : "Create Team Cluster"}
                  </button>
                </form>
              </div>
            </div>

            {/* Join Team */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-2xl shadow-xl flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <span className="material-symbols-outlined text-3xl">group_add</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2 text-white">Join Existing Team</h3>
                  <p className="text-white/60 text-xs leading-relaxed">
                    Enter the 6-character alphanumeric Team Code provided by your team lead to join their cluster.
                  </p>
                </div>

                <form onSubmit={handleJoin} className="space-y-4 pt-2">
                  <div className="space-y-2">
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
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono tracking-widest text-xl uppercase text-center"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={actionStatus === "loading"}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer text-sm"
                  >
                    {actionStatus === "loading" ? "Joining Team..." : "Join Team"}
                  </button>
                </form>
              </div>
            </div>

            {message && (
              <div
                className={`col-span-1 md:col-span-2 text-center p-4 rounded-2xl border text-xs font-mono font-medium ${
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
