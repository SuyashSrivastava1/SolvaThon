
import React from 'react';
import Link from 'next/link';

export default function Login() {
  return (
    <>
<main className="w-full min-h-screen bg-background flex flex-col items-center justify-center"><div className="flex flex-col w-full items-center justify-center p-space-md md:p-margin relative overflow-hidden select-none">

<div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
<div className="absolute -bottom-48 -right-32 w-[32rem] h-[32rem] bg-secondary-container/10 rounded-full blur-[140px] pointer-events-none mix-blend-screen"></div>
<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[46rem] h-[46rem] bg-surface-container-lowest/60 rounded-full blur-[90px] pointer-events-none -z-10"></div>

<div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.035] pointer-events-none"></div>

<div className="w-full max-w-[520px] relative z-10 flex flex-col gap-space-lg">

<div className="flex items-center justify-between px-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
<div className="flex items-center gap-space-xs">
<span className="inline-block w-1.5 h-1.5 rounded-full bg-tertiary shadow-[0_0_8px_#56e5a9]"></span>
<span>SYS.NET // ACTIVE</span>
</div>
<div className="flex items-center gap-space-sm text-outline">
<span>LOC: EN-V04</span>
<span className="text-surface-variant">•</span>
<span>256-BIT CRYPT</span>
</div>
</div>

<div className="relative rounded-xl bg-surface-container-low/80 backdrop-blur-2xl p-space-xl md:p-10 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.08] before:absolute before:inset-0 before:rounded-xl before:pointer-events-none before:bg-gradient-to-b before:from-primary/10 before:via-transparent before:to-transparent">

<div className="absolute -top-[1px] left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-primary-container to-transparent shadow-[0_0_12px_#38bdf8]"></div>

<div className="flex flex-col items-center text-center">

<div className="relative flex items-center justify-center w-14 h-14 rounded-xl bg-surface-container-highest/60 mb-space-lg shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] group">
<div className="absolute inset-0 rounded-xl bg-primary/20 blur-md opacity-40 group-hover:opacity-75 transition-opacity duration-500"></div>
<svg className="relative w-7 h-7 text-primary transition-transform duration-300 group-hover:scale-105" fill="none" stroke="currentColor" strokeLinecap="round" stroke-linejoin="round" strokeWidth="1.75" viewBox="0 0 24 24">
<polygon points="12 2 2 7 12 12 22 7 12 2"><polygon>
<polyline points="2 17 12 22 22 17"></polyline>
<polyline points="2 12 12 17 22 12"></polyline>
</polygon></polygon></svg>
</div>

<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm tracking-widest uppercase mb-space-sm">
<span className="w-1 h-1 rounded-full bg-primary"></span>
          CYFT // PORTAL ACCESS
        </div>
<h1 className="font-headline-md text-headline-md text-on-surface tracking-tight mb-space-xs font-bold">
          Authenticate Session
        </h1>
<p className="font-body-md text-body-md text-on-surface-variant max-w-sm font-normal">
          Sign in to access your registered team dashboard, live timer feed, and submission workspace.
        </p>
</div>

<form className="mt-space-xl flex flex-col gap-space-lg" novalidate="" onsubmit="event.preventDefault();">

<div className="flex flex-col gap-1.5">
<div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
<label className="tracking-wider uppercase text-on-surface" htmlFor="identity_email">Institutional Email</label>
<span className="text-outline text-label-sm">KEY.01</span>
</div>
<div className="relative flex items-center group">
<span className="material-symbols-outlined absolute left-3.5 text-outline group-focus-within:text-primary transition-colors text-[20px]">
              alternate_email
            </span>
<input autocomplete="email" className="w-full pl-11 pr-4 py-3 bg-surface-container-lowest/90 text-on-surface rounded-lg placeholder-outline-variant font-body-md text-body-md ring-1 ring-white/[0.08] focus:ring-1 focus:ring-primary-container focus:outline-none focus:shadow-[0_0_20px_-3px_rgba(56,189,248,0.3)] transition-all duration-200" id="identity_email" placeholder="student.name@vitstudent.ac.in" required="" type="email"/>
</div>

<div className="flex items-center gap-1.5 px-1 mt-0.5 text-on-surface-variant">
<span className="material-symbols-outlined text-[14px] text-primary">verified_user</span>
<span className="font-label-sm text-label-sm text-outline tracking-tight">
<span className="text-primary font-medium">@vitstudent.ac.in</span> domain required
            </span>
</div>
</div>

<div className="flex flex-col gap-1.5">
<div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
<label className="tracking-wider uppercase text-on-surface" htmlFor="identity_key">Access Key</label>
<a className="text-primary hover:text-secondary-fixed transition-colors font-label-sm normal-case hover:underline underline-offset-4" href="#forgot">
              Forgot password?
            </a>
</div>
<div className="relative flex items-center group">
<span className="material-symbols-outlined absolute left-3.5 text-outline group-focus-within:text-primary transition-colors text-[20px]">
              key
            </span>
<input className="w-full pl-11 pr-16 py-3 bg-surface-container-lowest/90 text-on-surface rounded-lg placeholder-outline-variant font-body-md text-body-md ring-1 ring-white/[0.08] focus:ring-1 focus:ring-primary-container focus:outline-none focus:shadow-[0_0_20px_-3px_rgba(56,189,248,0.3)] transition-all duration-200" id="identity_key" placeholder="••••••••••••••••" required="" type="password"/>
<button aria-label="Toggle password view" className="absolute right-2 px-2.5 py-1.5 flex items-center justify-center text-outline hover:text-on-surface rounded transition-colors text-label-sm font-label-sm" id="toggle_password_btn" onclick="const f = document.getElementById('identity_key'); const ic = document.getElementById('vis_icon'); if(f.type === 'password'){ f.type = 'text'; ic.textContent = 'visibility_off'; } else { f.type = 'password'; ic.textContent = 'visibility'; }" type="button">
<span className="material-symbols-outlined text-[18px]" id="vis_icon">visibility</span>
</button>
</div>
</div>

<div className="flex items-start gap-space-sm p-3.5 rounded-lg bg-surface-container/60 ring-1 ring-white/[0.05] relative overflow-hidden">
<div className="absolute top-0 left-0 bottom-0 w-[3px] bg-secondary-container"></div>
<span className="material-symbols-outlined text-secondary text-[18px] mt-0.5 shrink-0">
            shield_lock
          </span>
<p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            Participants can view only their allocated team details. Master timer controls are locked to authorized lead admin account.
          </p>
</div>

<button className="relative w-full py-3.5 px-6 rounded-lg bg-primary-container text-on-primary-container font-headline-sm text-headline-sm font-semibold flex items-center justify-center gap-2 group transition-all duration-300 hover:bg-secondary-fixed shadow-[0_0_24px_-4px_rgba(56,189,248,0.45)] hover:shadow-[0_0_32px_0px_rgba(56,189,248,0.6)] active:scale-[0.99]" type="submit">
<span>Sign In to Portal</span>
<span className="material-symbols-outlined text-[20px] transition-transform duration-200 group-hover:translate-x-1">
            east
          </span>
</button>
</form>

<div className="mt-space-lg pt-space-md border-t border-white/[0.05] flex items-center justify-between text-outline font-label-sm text-label-sm">
<span className="flex items-center gap-1.5">
<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          NODE READY // 14ms
        </span>
<span className="tracking-widest">CYFT.CORE v4.1</span>
</div>
</div>

<div className="w-full rounded-xl bg-surface-container-low/40 backdrop-blur-md p-space-md flex flex-col sm:flex-row items-center justify-between gap-space-md ring-1 ring-white/[0.04]">
<div className="flex flex-col text-center sm:text-left">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Unregistered Roster?</span>
<span className="font-body-md text-body-md text-on-surface">New team registration?</span>
</div>
<a className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md transition-all duration-200 ring-1 ring-white/[0.08] hover:ring-primary/40 text-nowrap group" href="#register">
<span>Register Team / Create Account</span>
<span className="material-symbols-outlined text-[16px] text-primary group-hover:translate-x-0.5 transition-transform">
          arrow_forward
        </span>
</a>
</div>

<div className="flex items-center justify-center gap-4 text-outline font-label-sm text-label-sm text-center">
<span>END-TO-END VERIFIED</span>
<span className="text-surface-variant">/</span>
<span>RESTRICTED ACCESS INTERNAL ONLY</span>
</div>
</div>
</div></main>
</>
  );
}
