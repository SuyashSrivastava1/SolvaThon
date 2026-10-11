"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getAdminData } from "@/actions/admin";
import { isAdminEmail } from "@/config/admin";
import Link from "next/link";

export default function EvaluateIndexPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user || !user.email || !isAdminEmail(user.email)) {
      router.replace("/admin");
      return;
    }

    getAdminData(user.email).then((res) => {
      if (res.success && res.teams && res.teams.length > 0) {
        // Find first pending team, or default to first team
        const pending = res.teams.find((t: any) => t.scoreTotal === null || t.scoreTotal === undefined);
        const targetId = pending ? pending.id : res.teams[0].id;
        router.replace(`/admin/evaluate/${targetId}`);
      } else {
        setErrorMsg("No teams found for evaluation.");
        setLoading(false);
      }
    });
  }, [user, authLoading, router]);

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center text-white px-4">
      {loading ? (
        <>
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-400 rounded-full animate-spin mb-4"></div>
          <p className="text-white/60 font-mono text-xs tracking-widest uppercase">
            CONNECTING TO JURY WORKBENCH...
          </p>
        </>
      ) : (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md text-center space-y-4">
          <h2 className="text-xl font-bold">No Teams Found</h2>
          <p className="text-xs text-white/70">{errorMsg}</p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold"
          >
            Return to Admin Panel
          </Link>
        </div>
      )}
    </div>
  );
}
