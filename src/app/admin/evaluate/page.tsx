"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getAdminData } from "@/actions/admin";
import Link from "next/link";

export default function EvaluateIndexPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadWorkbench = async () => {
    setLoading(true);
    setErrorMsg("");

    let tokenOrEmail = user?.email || "";
    try {
      if (user) {
        tokenOrEmail = (await user.getIdToken()) || user.email || "";
      }
    } catch {}

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await getAdminData(tokenOrEmail);
        if (res.success && res.teams && res.teams.length > 0) {
          const pending = res.teams.find((t: any) => t.scoreTotal === null || t.scoreTotal === undefined);
          const targetId = pending ? pending.id : res.teams[0].id;
          router.replace(`/admin/evaluate/${targetId}`);
          return;
        } else if (res.success) {
          setErrorMsg("No teams found for evaluation.");
          setLoading(false);
          return;
        }

        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 800));
          continue;
        }

        setErrorMsg(res.error || "Failed to load teams for evaluation.");
      } catch (err: any) {
        console.error(`Jury workbench connect error (attempt ${attempt + 1}):`, err);
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 800));
          continue;
        }
        setErrorMsg("Failed to connect to jury workbench: " + (err?.message || "Connection timeout"));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user || !isAdmin) {
      router.replace("/admin");
      return;
    }

    loadWorkbench();
  }, [user, authLoading, isAdmin, router]);

  return (
    <div className="min-h-screen bg-[#07050e] flex flex-col items-center justify-center text-white px-4">
      {loading ? (
        <>
          <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-400 rounded-full animate-spin mb-4"></div>
          <p className="text-white/60 font-mono text-xs tracking-widest uppercase">
            CONNECTING TO JURY WORKBENCH...
          </p>
        </>
      ) : (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md text-center space-y-4">
          <h2 className="text-xl font-bold">Notice</h2>
          <p className="text-xs text-white/70">{errorMsg}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                loadWorkbench();
              }}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-lg shadow-purple-500/30"
            >
              Retry Connection
            </button>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold"
            >
              Return to Admin
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
