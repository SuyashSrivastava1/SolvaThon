"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getTeamDetails, createTeam, joinTeam } from "@/actions/team";
import { auth } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [teamData, setTeamData] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [actionStatus, setActionStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState("");

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
    const result = await getTeamDetails(user.uid);
    if (!result.success && result.error === "Participant not found.") {
      router.push("/rules"); // Redirect to registration
    } else if (result.success) {
      setTeamData(result);
    }
    setFetching(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionStatus("loading");
    const result = await createTeam(user!.uid, teamName);
    if (result.success) {
      setActionStatus("success");
      setMessage("Team created successfully!");
      fetchTeam();
    } else {
      setActionStatus("error");
      setMessage(result.error || "Failed");
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionStatus("loading");
    const result = await joinTeam(user!.uid, teamCode);
    if (result.success) {
      setActionStatus("success");
      setMessage("Successfully joined the team!");
      fetchTeam();
    } else {
      setActionStatus("error");
      setMessage(result.error || "Failed");
    }
  };

  if (loading || fetching) return <div className="min-h-screen bg-[#050B14] text-white flex items-center justify-center">Loading...</div>;
  if (!user || !teamData) return null;

  return (
    <div className="min-h-screen bg-[#050B14] relative text-white font-sans overflow-hidden py-20 px-4">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
      
      <div className="container mx-auto max-w-4xl relative z-10 space-y-8">
        
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {teamData.participant?.fullName || user.email}</h1>
            <p className="text-white/60 text-sm">{user.email}</p>
          </div>
          <button onClick={() => signOut(auth)} className="px-4 py-2 border border-white/20 hover:bg-white/10 rounded-xl text-sm transition-all">
            Sign Out
          </button>
        </div>

        {teamData.hasTeam ? (
          <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/20 border border-cyan-500/30 rounded-2xl p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-widest mb-1">Your Team</h2>
                <h3 className="text-4xl font-extrabold">{teamData.team.name}</h3>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-center">
                <p className="text-xs text-white/50 mb-1">Share this Code to invite members</p>
                <p className="font-mono text-xl font-bold tracking-widest text-emerald-400 select-all">{teamData.team.teamCode}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg border-b border-white/10 pb-2">Roster ({teamData.team.members.length}/4 Members)</h4>
              <ul className="space-y-3">
                {teamData.team.members.map((m: any, idx: number) => (
                  <li key={idx} className="flex justify-between items-center bg-black/20 px-4 py-3 rounded-lg border border-white/5">
                    <span className="font-medium">{m.name}</span>
                  </li>
                ))}
              </ul>
              {teamData.team.members.length >= 4 && (
                <p className="text-yellow-400 text-sm mt-4 text-center">Your team is full!</p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Create Team */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-2">Create a Team</h3>
              <p className="text-white/60 text-sm mb-6">Start a new team and invite up to 3 friends.</p>
              
              <form onSubmit={handleCreate} className="space-y-4">
                <input type="text" placeholder="Awesome Team Name" required value={teamName} onChange={e => setTeamName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
                <button type="submit" disabled={actionStatus === 'loading'} className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 rounded-xl transition-all disabled:opacity-50">
                  Create Team
                </button>
              </form>
            </div>

            {/* Join Team */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-2">Join a Team</h3>
              <p className="text-white/60 text-sm mb-6">Have a Team Code? Enter it below to join.</p>
              
              <form onSubmit={handleJoin} className="space-y-4">
                <input type="text" placeholder="Enter Team Code" required value={teamCode} onChange={e => setTeamCode(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono" />
                <button type="submit" disabled={actionStatus === 'loading'} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50">
                  Join Team
                </button>
              </form>
            </div>
            
            {message && (
              <div className={`col-span-1 md:col-span-2 text-center p-4 rounded-xl border ${actionStatus === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                {message}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
