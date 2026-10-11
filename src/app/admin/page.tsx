"use client";

import { useState } from "react";
import { getAdminData } from "@/actions/admin";
import Link from "next/link";

export default function AdminPortalPage() {
  const [accessKey, setAccessKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [data, setData] = useState<any>(null);

  // Search & Filter state
  const [activeTab, setActiveTab] = useState<"participants" | "teams" | "analytics">("participants");
  const [searchTerm, setSearchTerm] = useState("");
  const [blockFilter, setBlockFilter] = useState("ALL");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const res = await getAdminData(accessKey);
    if (res.success) {
      setData(res);
      setAuthenticated(true);
    } else {
      setErrorMsg(res.error || "Failed to authenticate.");
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setLoading(true);
    const res = await getAdminData(accessKey);
    if (res.success) {
      setData(res);
    }
    setLoading(false);
  };

  const exportParticipantsCSV = () => {
    if (!data?.participants) return;
    const headers = [
      "Full Name",
      "Email ID",
      "Mobile Number",
      "Hostel Block",
      "Room Number",
      "Mess Caterer",
      "Mess Type",
      "Ticket ID",
      "Team Name",
      "Team Code",
      "Registration Time"
    ];

    const rows = data.participants.map((p: any) => [
      `"${p.fullName}"`,
      `"${p.emailId}"`,
      `"${p.mobileNumber}"`,
      `"${p.hostelBlock}"`,
      `"${p.roomNumber}"`,
      `"${p.messCaterer}"`,
      `"${p.messType}"`,
      `"${p.ticketId}"`,
      `"${p.teamName}"`,
      `"${p.teamCode}"`,
      `"${p.registrationTime}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any[]) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `solvathon_participants_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportTeamsCSV = () => {
    if (!data?.teams) return;
    const headers = [
      "Team Name",
      "Team Code",
      "Member Count",
      "Problem Statement",
      "PPT Link",
      "Understanding of Problem Statement",
      "Solution Summary",
      "Submitted At",
      "Roster"
    ];

    const rows = data.teams.map((t: any) => [
      `"${t.name}"`,
      `"${t.teamCode}"`,
      t.memberCount,
      `"${t.problemStatement}"`,
      `"${t.pptUrl || ''}"`,
      `"${(t.understanding || '').replace(/"/g, '""')}"`,
      `"${(t.solutionSummary || '').replace(/"/g, '""')}"`,
      `"${t.submittedAt || 'Pending'}"`,
      `"${t.members.map((m: any) => `${m.fullName} (${m.ticketId}, ${m.hostelBlock}-${m.roomNumber})`).join("; ")}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any[]) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `solvathon_teams_submissions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center text-white px-4 relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="relative z-10 max-w-md w-full bg-white/[0.04] border border-white/10 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <span className="material-symbols-outlined text-3xl">shield</span>
          </div>

          <div>
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1">
              HOSTEL WARDEN &amp; COMMITTEE PORTAL
            </div>
            <h1 className="text-2xl font-black text-white">Central Command Access</h1>
            <p className="text-white/60 text-xs mt-2">
              Enter the authorized warden clearance key to inspect residential allocations and team submissions.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              required
              placeholder="Enter Warden Access Key"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-center font-mono focus:ring-2 focus:ring-cyan-500/50 outline-none"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">vpn_key</span>
                  <span>Unlock Warden Console</span>
                </>
              )}
            </button>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono">
                {errorMsg}
              </div>
            )}
          </form>

          <div className="pt-2 text-xs text-white/40 font-mono">
            Default Key: <span className="text-cyan-400">warden_cyft_2025</span>
          </div>
        </div>
      </div>
    );
  }

  const { stats, participants, teams } = data;

  const filteredParticipants = participants.filter((p: any) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.emailId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBlock = blockFilter === "ALL" || p.hostelBlock === blockFilter;
    return matchesSearch && matchesBlock;
  });

  const uniqueBlocks = Array.from(new Set(participants.map((p: any) => p.hostelBlock))) as string[];

  return (
    <div className="min-h-screen bg-[#050B14] relative text-white font-sans selection:bg-cyan-500/30 py-10 px-4">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

      <div className="container mx-auto max-w-7xl relative z-10 space-y-8">
        
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white/[0.04] border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-lg">home</span>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black">Warden &amp; Committee Portal</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                  LIVE SESSION
                </span>
              </div>
              <p className="text-white/50 text-xs font-mono">
                CYFT Hostellite Solvathon 2025 • High-Trust Administration
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
              Refresh Data
            </button>
            <button
              onClick={exportParticipantsCSV}
              className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Participants CSV
            </button>
            <button
              onClick={exportTeamsCSV}
              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Teams &amp; Submissions CSV
            </button>
            <button
              onClick={() => setAuthenticated(false)}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-mono uppercase tracking-wider transition-all"
            >
              Lock Console
            </button>
          </div>
        </div>

        {/* Telemetry Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-1">
            <span className="text-xs font-mono text-white/40 uppercase">Verified Participants</span>
            <div className="text-4xl font-black text-cyan-400 tracking-tight">{stats.totalParticipants}</div>
            <p className="text-[11px] text-white/50">Unique Hostellite Passes</p>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-1">
            <span className="text-xs font-mono text-white/40 uppercase">Total Teams Formed</span>
            <div className="text-4xl font-black text-blue-400 tracking-tight">{stats.totalTeams}</div>
            <p className="text-[11px] text-white/50">{stats.fullTeams} Teams at 4/4 Full Cap</p>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-1">
            <span className="text-xs font-mono text-white/40 uppercase">Deliverables Submitted</span>
            <div className="text-4xl font-black text-emerald-400 tracking-tight">{stats.submissionsCount}</div>
            <p className="text-[11px] text-white/50">GitHub Repositories Logged</p>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-1">
            <span className="text-xs font-mono text-white/40 uppercase">Hostel Blocks Active</span>
            <div className="text-4xl font-black text-purple-400 tracking-tight">
              {Object.keys(stats.blockStats).length}
            </div>
            <p className="text-[11px] text-white/50">Across Men&apos;s &amp; Ladies&apos; Blocks</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-white/10 gap-4">
          <button
            onClick={() => setActiveTab("participants")}
            className={`pb-3 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === "participants"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-lg">badge</span>
            Participants Directory ({participants.length})
          </button>

          <button
            onClick={() => setActiveTab("teams")}
            className={`pb-3 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === "teams"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-lg">hub</span>
            Team Rosters &amp; Submissions ({teams.length})
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`pb-3 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === "analytics"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-lg">analytics</span>
            Block &amp; Mess Breakdown
          </button>
        </div>

        {/* Tab 1: Participants Directory */}
        {activeTab === "participants" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <input
                type="text"
                placeholder="Search by name, email, ticket ID, or room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-80 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-white/40 uppercase">Filter Block:</span>
                <div className="relative inline-block">
                  <select
                    value={blockFilter}
                    onChange={(e) => setBlockFilter(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-xl pl-3 pr-9 py-2 text-xs text-white appearance-none outline-none cursor-pointer [&>option]:bg-[#050B14]"
                  >
                    <option value="ALL">All Blocks ({participants.length})</option>
                    {uniqueBlocks.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none text-base">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-x-auto shadow-2xl backdrop-blur-xl">
              <table className="w-full text-left text-sm border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-mono text-cyan-400 uppercase bg-white/[0.02]">
                    <th className="p-4">Ticket ID</th>
                    <th className="p-4">Participant Name</th>
                    <th className="p-4">Hostel Allotment</th>
                    <th className="p-4">Mess &amp; Diet</th>
                    <th className="p-4">Team</th>
                    <th className="p-4">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-white/40 font-mono text-sm">
                        No participants found matching current query.
                      </td>
                    </tr>
                  ) : (
                    filteredParticipants.map((p: any) => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-mono text-cyan-400 font-semibold">{p.ticketId}</td>
                        <td className="p-4">
                          <div className="font-bold text-white">{p.fullName}</div>
                          <div className="text-xs text-white/50 font-mono">{p.emailId}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-xs">
                            {p.hostelBlock} • Rm {p.roomNumber}
                          </span>
                        </td>
                        <td className="p-4 text-xs">
                          <div className="text-white/80">{p.messCaterer}</div>
                          <div className="text-cyan-400/80 font-mono">{p.messType}</div>
                        </td>
                        <td className="p-4">
                          {p.teamName !== "No Team" ? (
                            <div>
                              <span className="font-semibold text-white">{p.teamName}</span>
                              <span className="block text-[11px] font-mono text-emerald-400">{p.teamCode}</span>
                            </div>
                          ) : (
                            <span className="text-white/30 text-xs font-mono">Individual</span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-xs text-white/70">
                          {p.mobileNumber}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Team Rosters & Submissions */}
        {activeTab === "teams" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teams.length === 0 ? (
                <div className="col-span-2 p-12 text-center text-white/40 font-mono">
                  No teams registered yet.
                </div>
              ) : (
                teams.map((t: any) => (
                  <div
                    key={t.id}
                    className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4 hover:border-cyan-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between border-b border-white/10 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-white">{t.name}</h3>
                          <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${t.memberCount >= 4 ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                            {t.memberCount}/4 Members
                          </span>
                        </div>
                        <p className="text-xs font-mono text-white/40 mt-0.5">CODE: <strong className="text-emerald-400">{t.teamCode}</strong></p>
                      </div>
                      {t.submittedAt ? (
                        <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono rounded-full font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">verified</span> SUBMITTED
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-white/5 text-white/40 text-xs font-mono rounded-full">
                          IN DEVELOPMENT
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-white/40 uppercase">Selected Track</span>
                      <p className="text-sm font-semibold text-cyan-300">
                        {t.problemStatement}
                      </p>
                    </div>

                    {t.pptUrl && (
                      <div className="space-y-2 bg-black/40 p-3 rounded-xl border border-white/5 text-xs">
                        <div>
                          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">PPT / Presentation Link</span>
                          <a
                            href={t.pptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-cyan-300 hover:underline block truncate"
                          >
                            {t.pptUrl}
                          </a>
                        </div>
                        {t.understanding && (
                          <div className="pt-2 border-t border-white/5">
                            <span className="text-[10px] font-mono text-white/40 uppercase block mb-0.5">Understanding of Problem</span>
                            <p className="text-white/80 leading-relaxed">{t.understanding}</p>
                          </div>
                        )}
                        {t.solutionSummary && (
                          <div className="pt-2 border-t border-white/5">
                            <span className="text-[10px] font-mono text-white/40 uppercase block mb-0.5">Solution Summary</span>
                            <p className="text-white/80 leading-relaxed">{t.solutionSummary}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-mono text-white/40 uppercase">Member Roster</span>
                      <div className="space-y-1.5">
                        {t.members.map((m: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-xs bg-white/[0.02] px-3 py-2 rounded-lg border border-white/5">
                            <span className="font-medium text-white">{m.fullName}</span>
                            <span className="font-mono text-white/50">{m.hostelBlock} • Rm {m.roomNumber} ({m.ticketId})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Analytics Breakdown */}
        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
                Hostel Block Distribution
              </h3>
              <div className="space-y-2">
                {Object.entries(stats.blockStats).map(([block, count]) => (
                  <div key={block} className="flex items-center justify-between text-sm">
                    <span className="text-white/70">{block}</span>
                    <span className="font-mono font-bold text-cyan-400 bg-white/5 px-2.5 py-0.5 rounded">
                      {count as number}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
                Mess Caterer Intake
              </h3>
              <div className="space-y-2">
                {Object.entries(stats.messStats).map(([mess, count]) => (
                  <div key={mess} className="flex items-center justify-between text-sm">
                    <span className="text-white/70">{mess}</span>
                    <span className="font-mono font-bold text-blue-400 bg-white/5 px-2.5 py-0.5 rounded">
                      {count as number}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
                Problem Statement Tracks
              </h3>
              <div className="space-y-2">
                {Object.entries(stats.trackStats).map(([track, count]) => (
                  <div key={track} className="flex items-center justify-between text-sm">
                    <span className="text-white/70 truncate max-w-[200px]">{track}</span>
                    <span className="font-mono font-bold text-purple-400 bg-white/5 px-2.5 py-0.5 rounded">
                      {count as number}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
