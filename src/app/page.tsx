
import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <>
<header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="h-20 w-full max-w-[1440px] mx-auto px-gutter-mobile lg:px-gutter flex items-center justify-between gap-space-md"><div className="flex items-center gap-space-md shrink-0"><img alt="CYFT Hackathon Logo" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AEtjO1UUEiCGnn5c_bL-wgu_f9haQuNvG0PPpo-bxmRNghgv5oV9BPGKdOeWF5tHDOfYPrtxRlGQi5nl8Is3SKJkRdCs_CcoAx0fv2GMcozlJYRvLfDPbhCltT8Jlinez_oxmOKJOKCb9887ptoUHuymDVPsogBFq079iIewYsQUdPxgV5SEfhMP2CVDcevbSk2iSJv9Fp9TnFOZPs4Mk2dHyrBT3K7KSBZQVqoE9mgo1DDlg784vtZVlvouJNI"/><div className="flex flex-col"><div className="flex items-center gap-space-sm"><span className="font-headline-sm text-headline-sm tracking-tight text-on-surface">CYFT // HACK 2025</span><div className="flex items-center gap-space-xs px-space-xs py-0.5 rounded-full bg-surface-container-high"><span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span><span className="font-label-sm text-label-sm text-tertiary uppercase">LIVE EVENT</span></div></div></div></div><nav className="hidden xl:flex items-center gap-space-lg" data-active-classes="text-primary font-semibold"><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" data-path="problem-statements" href="#">Problem Statements</a><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" data-path="timeline" href="#">Timeline</a><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" data-path="committee-and-wardens" href="#">Committee &amp; Wardens</a><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" data-path="guests-and-prizes" href="#">Guests &amp; Prizes</a><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" data-path="rules" href="#">Rules</a></nav><div className="flex items-center gap-space-md shrink-0"><div className="hidden sm:flex items-center gap-space-sm px-space-md py-1.5 rounded-full bg-surface-container-high"><span className="w-2 h-2 rounded-full bg-primary-container animate-ping"></span><span className="font-label-sm text-label-sm text-primary tracking-wider uppercase font-medium">142 PARTICIPANTS</span></div><a className="hidden md:inline-flex font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors px-space-sm py-1.5" data-path="login" href="#">Login</a><a className="inline-flex items-center justify-center px-space-lg py-2 rounded-lg bg-primary-container text-on-primary-container font-headline-sm text-body-sm font-semibold hover:bg-secondary-container hover:text-on-secondary transition-all shadow-[0_0_24px_-4px_rgba(56,189,248,0.25)]" data-path="register" href="#">Register Now</a><div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-on-primary text-[18px]">person</span></div></div></div></header><main className="w-full pt-20 bg-background"><div className="flex flex-col w-full">

<section className="relative w-full overflow-hidden px-gutter-mobile lg:px-gutter py-space-xl lg:py-24">

<div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-primary/10 rounded-full blur-[140px] pointer-events-none"></div>
<div className="absolute top-1/3 -right-24 w-[420px] h-[420px] bg-tertiary/5 rounded-full blur-[120px] pointer-events-none"></div>
<div className="max-w-[1440px] mx-auto flex flex-col gap-space-xl relative z-10">

<div className="flex flex-wrap items-center gap-space-sm">
<div className="inline-flex items-center gap-space-xs px-space-md py-1.5 rounded-full bg-surface-container-high/70 backdrop-blur-md">
<span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
<span className="font-label-sm text-label-sm text-primary uppercase tracking-wider font-semibold">Vellore Institute of Technology • Flagship Hackathon 2025</span>
</div>
<div className="hidden sm:inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container-lowest text-outline">
<span className="font-label-sm text-label-sm">NODE: VIT-VLR-HOSTEL-RESIDENCY</span>
</div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
<div className="lg:col-span-8 flex flex-col gap-space-md">
<h1 className="font-headline-xl text-headline-xl uppercase tracking-tighter text-on-surface">
            CYFT // INTELLIGENCE <br/>
<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-container to-secondary-fixed">IN RESIDENCE</span>
</h1>
<p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
            The premier 36-hour residential engineering hackathon exclusively for hostel innovators and autonomous builders. Built within the residential halls to solve ground-level spatial, computational, and micro-grid challenges.
          </p>
<div className="flex flex-wrap items-center gap-space-md pt-space-sm">
<a className="inline-flex items-center justify-center gap-space-xs px-space-xl py-3.5 rounded-lg bg-primary-container text-on-primary-container font-headline-sm text-body-md font-bold shadow-[0_0_32px_rgba(56,189,248,0.3)] hover:bg-secondary-container hover:text-on-secondary transition-all" href="/rules">
<span className="material-symbols-outlined text-[20px]">how_to_reg</span>
              Register Now — Hostellites Only
            </a>
<a className="inline-flex items-center justify-center gap-space-xs px-space-lg py-3.5 rounded-lg bg-surface-container-high/80 text-on-surface hover:bg-surface-bright transition-colors font-headline-sm text-body-md font-medium" href="#problems">
<span className="material-symbols-outlined text-[18px]">terminal</span>
              Explore Problem Statements
            </a>
</div>


<div className="flex flex-col items-start mt-12 w-full select-none">
  <div className="relative font-bold tracking-tighter leading-none" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(3rem, 8vw, 8rem)' }}>
    <div className="absolute -top-[20%] opacity-10 text-transparent" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.4)' }}>00d:00h:00m</div>
    <div className="absolute -top-[10%] opacity-30 text-transparent" style={{ WebkitTextStroke: '1.5px rgba(255,255,255,0.6)' }}>00d:00h:00m</div>
    <div className="relative text-transparent" style={{ WebkitTextStroke: '2px rgba(255,255,255,1)' }}>00d:00h:00m</div>
    <div className="absolute -bottom-[10%] opacity-30 text-transparent" style={{ WebkitTextStroke: '1.5px rgba(255,255,255,0.6)' }}>00d:00h:00m</div>
    <div className="absolute -bottom-[20%] opacity-10 text-transparent" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.4)' }}>00d:00h:00m</div>
  </div>
  <p className="mt-[20%] sm:mt-[15%] md:mt-[10%] lg:mt-16 font-label-md text-primary tracking-widest uppercase text-sm font-semibold">Time remaining until registrations close</p>
</div>
</div>

<div className="lg:col-span-4 flex flex-col gap-space-md w-full">
  <div className="bg-surface-container-low/90 backdrop-blur-xl p-space-lg rounded-xl shadow-xl flex flex-col gap-space-md">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-space-xs">
        <span className="w-2 h-2 rounded-full bg-tertiary"></span>
        <span className="font-label-sm text-label-sm text-tertiary uppercase font-medium">SYS.MONITOR // VERIFIED</span>
      </div>
      <span className="font-label-sm text-label-sm text-outline">SLOTS: 200 CAP</span>
    </div>
    <div className="flex items-baseline justify-between">
      <div>
        <span className="font-headline-xl text-[68px] leading-none font-extrabold text-on-surface tracking-tight" id="live-counter">148</span>
        <div className="font-label-sm text-label-sm text-outline uppercase mt-1">Live Registered Participants</div>
      </div>
      <div className="text-right">
        <span className="inline-flex items-center px-space-xs py-0.5 rounded bg-tertiary/10 text-tertiary font-label-sm text-label-sm">
          &gt;100 THRESHOLD MET
        </span>
        <div className="font-body-sm text-body-sm text-on-surface-variant mt-1 flex items-center justify-end gap-1">
          <span className="material-symbols-outlined text-[14px] text-tertiary">check_circle</span>
          HOSTEL VERIFIED
        </div>
      </div>
    </div>
    <div className="w-full bg-surface-container-lowest/60 p-space-sm rounded-lg flex flex-col gap-space-xs">
      <div className="flex justify-between items-center text-outline font-label-sm text-label-sm">
        <span>INTAKE ACCELERATION</span>
        <span className="text-primary font-medium">+4 checked in 12m ago</span>
      </div>
      <svg className="w-full h-12 text-primary" fill="none" viewBox="0 0 320 48">
        <path d="M0 40 L30 38 L60 32 L90 35 L120 28 L150 24 L180 30 L210 18 L240 22 L270 12 L300 8 L320 4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        <path d="M0 40 L30 38 L60 32 L90 35 L120 28 L150 24 L180 30 L210 18 L240 22 L270 12 L300 8 L320 4 L320 48 L0 48 Z" fill="currentColor" fillOpacity="0.08" />
      </svg>
    </div>
  </div>
</div>
</div>

<div className="grid grid-cols-2 md:grid-cols-4 gap-space-md pt-space-md">
  <div className="bg-surface-container-low p-space-md rounded-lg flex items-center gap-space-sm">
    <span className="material-symbols-outlined text-primary text-[24px]">apartment</span>
    <div className="flex flex-col">
      <span className="font-headline-sm text-body-md font-semibold text-on-surface">Campus Core</span>
      <span className="font-body-sm text-body-sm text-outline">Smart Room 101 Labs</span>
    </div>
  </div>
  <div className="bg-surface-container-low p-space-md rounded-lg flex items-center gap-space-sm">
    <span className="material-symbols-outlined text-tertiary text-[24px]">offline_bolt</span>
    <div className="flex flex-col">
      <span className="font-headline-sm text-body-md font-semibold text-on-surface">Zero Cloud Failover</span>
      <span className="font-body-sm text-body-sm text-outline">Intranet Mesh &amp; Power</span>
    </div>
  </div>
  <div className="bg-surface-container-low p-space-md rounded-lg flex items-center gap-space-sm">
    <span className="material-symbols-outlined text-secondary text-[24px]">security</span>
    <div className="flex flex-col">
      <span className="font-headline-sm text-body-md font-semibold text-on-surface">Hostel Bio-Pass</span>
      <span className="font-body-sm text-body-sm text-outline">Strict Late-Night Entry</span>
    </div>
  </div>
  <div className="bg-surface-container-low p-space-md rounded-lg flex items-center gap-space-sm">
    <span className="material-symbols-outlined text-primary-container text-[24px]">payments</span>
    <div className="flex flex-col">
      <span className="font-headline-sm text-body-md font-semibold text-on-surface">₹1,50,000 Pool</span>
      <span className="font-body-sm text-body-sm text-outline">Direct Cash &amp; Credits</span>
    </div>
  </div>
</div>
</div>
</section>

<section className="w-full px-gutter-mobile lg:px-gutter py-space-xl bg-surface-container-lowest/50" id="problems">
<div className="max-w-[1440px] mx-auto flex flex-col gap-space-xl">

<div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
<div className="flex flex-col gap-space-xs">
<div className="flex items-center gap-space-xs">
<span className="font-label-sm text-label-sm text-primary uppercase">PROTOCOL // 02</span>
<span className="text-outline">•</span>
<span className="font-label-sm text-label-sm text-outline uppercase">ENGINEERING CHALLENGES</span>
</div>
<h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">CHALLENGE DOMAINS &amp; TRACKS</h2>
<p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
            Selected problem statements engineered to address high-friction bottlenecks within university residential infrastructure.
          </p>
</div>

<div className="flex flex-wrap items-center gap-space-xs" id="track-filters">
<button className="px-space-md py-1.5 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm font-semibold transition-all" type="button">All Domains</button>
<button className="px-space-md py-1.5 rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm transition-all" type="button">Edge Intelligence</button>
<button className="px-space-md py-1.5 rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm transition-all" type="button">Campus Logistics</button>
<button className="px-space-md py-1.5 rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm transition-all" type="button">Autonomous Agents</button>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">

<div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col justify-between gap-space-md hover:bg-surface-container transition-all shadow-md">
<div className="flex flex-col gap-space-sm">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-primary px-space-xs py-0.5 bg-primary/10 rounded">TRACK // POWER SYSTEMS</span>
<span className="font-label-sm text-label-sm text-tertiary flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                HIGH IMPACT
              </span>
</div>
<h3 className="font-headline-md text-headline-md text-on-surface">PS-01: Autonomous Hostel Energy Grid Balancing</h3>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Design a low-latency micro-inverter and sensor telemetry agent that redistributes peak electrical loads across hostel wings during generator failover periods without shedding critical room loads.
            </p>
</div>
<div className="flex flex-col gap-space-sm pt-space-sm">
<div className="flex flex-wrap items-center gap-space-xs text-outline font-label-sm text-label-sm">
<span className="bg-surface-container-high px-space-xs py-1 rounded">IoT / ESP32</span>
<span className="bg-surface-container-high px-space-xs py-1 rounded">Reinforcement Learning</span>
<span className="bg-surface-container-high px-space-xs py-1 rounded">Mentor: Dr. Ramanathan</span>
</div>
<div className="flex items-center justify-between pt-2">
<span className="font-body-sm text-body-sm text-outline">Difficulty: Level 4/5</span>
<button className="inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:text-secondary transition-colors font-medium">
                View Technical Spec <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</button>
</div>
</div>
</div>

<div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col justify-between gap-space-md hover:bg-surface-container transition-all shadow-md">
<div className="flex flex-col gap-space-sm">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-primary px-space-xs py-0.5 bg-primary/10 rounded">TRACK // SMART DINING</span>
<span className="font-label-sm text-label-sm text-tertiary flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                CRITICAL NEED
              </span>
</div>
<h3 className="font-headline-md text-headline-md text-on-surface">PS-02: Real-time Mess Queue &amp; Waste Analytics</h3>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Build an edge-deployed computer vision pipeline that estimates tray depletion rates, predicts queue wait times across 4 dining halls, and triggers automated surplus notifications for hostel staff.
            </p>
</div>
<div className="flex flex-col gap-space-sm pt-space-sm">
<div className="flex flex-wrap items-center gap-space-xs text-outline font-label-sm text-label-sm">
<span className="bg-surface-container-high px-space-xs py-1 rounded">YOLOv8 Edge</span>
<span className="bg-surface-container-high px-space-xs py-1 rounded">WebSockets API</span>
<span className="bg-surface-container-high px-space-xs py-1 rounded">Mentor: Prof. Narayanan</span>
</div>
<div className="flex items-center justify-between pt-2">
<span className="font-body-sm text-body-sm text-outline">Difficulty: Level 3/5</span>
<button className="inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:text-secondary transition-colors font-medium">
                View Technical Spec <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</button>
</div>
</div>
</div>

<div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col justify-between gap-space-md hover:bg-surface-container transition-all shadow-md">
<div className="flex flex-col gap-space-sm">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-primary px-space-xs py-0.5 bg-primary/10 rounded">TRACK // DISASTER COMMS</span>
<span className="font-label-sm text-label-sm text-secondary-fixed flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed"></span>
                HARDWARE HEAVY
              </span>
</div>
<h3 className="font-headline-md text-headline-md text-on-surface">PS-03: Localized Mesh Network for Disaster Comms</h3>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Implement zero-infrastructure packet forwarding over LoRa and peer-to-peer Wi-Fi Direct between Block A through Block G for emergency notifications when centralized ISP routing drops.
            </p>
</div>
<div className="flex flex-col gap-space-sm pt-space-sm">
<div className="flex flex-wrap items-center gap-space-xs text-outline font-label-sm text-label-sm">
<span className="bg-surface-container-high px-space-xs py-1 rounded">LoRaWAN</span>
<span className="bg-surface-container-high px-space-xs py-1 rounded">Cryptographic Gossip</span>
<span className="bg-surface-container-high px-space-xs py-1 rounded">Mentor: Dr. Priya Nair</span>
</div>
<div className="flex items-center justify-between pt-2">
<span className="font-body-sm text-body-sm text-outline">Difficulty: Level 5/5</span>
<button className="inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:text-secondary transition-colors font-medium">
                View Technical Spec <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</button>
</div>
</div>
</div>

<div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col justify-between gap-space-md hover:bg-surface-container transition-all shadow-md">
<div className="flex flex-col gap-space-sm">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-primary px-space-xs py-0.5 bg-primary/10 rounded">TRACK // RESIDENTIAL ACCESS</span>
<span className="font-label-sm text-label-sm text-tertiary flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                EDGE EMBEDDED
              </span>
</div>
<h3 className="font-headline-md text-headline-md text-on-surface">PS-04: Attendance Verification via Edge Vision</h3>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Build an anti-spoofing night-vision facial verification engine that integrates with local hostel warden portals, logging 4,000 students under 20 minutes without queue stalling or remote server lag.
            </p>
</div>
<div className="flex flex-col gap-space-sm pt-space-sm">
<div className="flex flex-wrap items-center gap-space-xs text-outline font-label-sm text-label-sm">
<span className="bg-surface-container-high px-space-xs py-1 rounded">TensorRT</span>
<span className="bg-surface-container-high px-space-xs py-1 rounded">Local SQLite Cache</span>
<span className="bg-surface-container-high px-space-xs py-1 rounded">Mentor: Cyber Lead Guild</span>
</div>
<div className="flex items-center justify-between pt-2">
<span className="font-body-sm text-body-sm text-outline">Difficulty: Level 4/5</span>
<button className="inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:text-secondary transition-colors font-medium">
                View Technical Spec <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</button>
</div>
</div>
</div>
</div>
</div>
</section>

<section className="w-full px-gutter-mobile lg:px-gutter py-space-xl" id="timeline">
<div className="max-w-[1440px] mx-auto flex flex-col gap-space-xl">
<div className="flex flex-col gap-space-xs">
<div className="flex items-center gap-space-xs">
<span className="font-label-sm text-label-sm text-primary uppercase">PROTOCOL // 03</span>
<span className="text-outline">•</span>
<span className="font-label-sm text-label-sm text-outline uppercase">CHRONOLOGICAL EXECUTION</span>
</div>
<h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">36-HOUR RESIDENTIAL TIMELINE</h2>
<p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
          Non-stop development lifecycle anchored in Smart Room 101 with continuous warden gate oversight and milestone evaluations.
        </p>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md relative">

<div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col gap-space-sm relative overflow-hidden group hover:bg-surface-container transition-all">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-primary font-bold">DAY 1 • 09:00 AM</span>
<span className="px-space-xs py-0.5 rounded bg-surface-container-high text-tertiary font-label-sm text-label-sm">STATION-1</span>
</div>
<h4 className="font-headline-sm text-headline-sm text-on-surface">Check-in &amp; Hostellite Verification</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Physical check-in at Smart Room 101. Student ID, room biometric validation, and allocation of dedicated high-speed switch drops.
          </p>
<div className="mt-auto pt-space-xs flex items-center gap-space-xs font-label-sm text-label-sm text-outline">
<span className="material-symbols-outlined text-[14px]">pin_drop</span> Smart Room 101, Technology Tower
          </div>
</div>

<div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col gap-space-sm relative overflow-hidden group hover:bg-surface-container transition-all">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-primary font-bold">DAY 1 • 11:00 AM</span>
<span className="px-space-xs py-0.5 rounded bg-primary/10 text-primary font-label-sm text-label-sm">KEY TRIGGER</span>
</div>
<h4 className="font-headline-sm text-headline-sm text-on-surface">Problem Statements &amp; Clock Start</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Master 36-Hour Hackathon timer begins. GitHub Classroom team repositories unlocked and initial architecture draft submission window opens.
          </p>
<div className="mt-auto pt-space-xs flex items-center gap-space-xs font-label-sm text-label-sm text-outline">
<span className="material-symbols-outlined text-[14px]">timer</span> Master Clock Locked: 36:00:00
          </div>
</div>

<div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col gap-space-sm relative overflow-hidden group hover:bg-surface-container transition-all">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-primary font-bold">DAY 1 • 04:00 PM</span>
<span className="px-space-xs py-0.5 rounded bg-surface-container-high text-outline font-label-sm text-label-sm">MILESTONE 1</span>
</div>
<h4 className="font-headline-sm text-headline-sm text-on-surface">Mentorship Review &amp; Roll Call</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Hostel wardens and technical faculty review repository commit progress. Mandatory hostellite residency roll-call check.
          </p>
<div className="mt-auto pt-space-xs flex items-center gap-space-xs font-label-sm text-label-sm text-outline">
<span className="material-symbols-outlined text-[14px]">checklist</span> 100% In-Person Verification
          </div>
</div>

<div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col gap-space-sm relative overflow-hidden group hover:bg-surface-container transition-all">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-tertiary font-bold">DAY 2 • 12:00 AM</span>
<span className="px-space-xs py-0.5 rounded bg-tertiary/10 text-tertiary font-label-sm text-label-sm">ENERGY SURGE</span>
</div>
<h4 className="font-headline-sm text-headline-sm text-on-surface">Midnight Hack &amp; Snack Drop</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Night rations delivered by Hostel Mess Council. High-caffeine fueling round, rapid-fire lightning bug bounty challenges.
          </p>
<div className="mt-auto pt-space-xs flex items-center gap-space-xs font-label-sm text-label-sm text-outline">
<span className="material-symbols-outlined text-[14px]">restaurant</span> Mess Guild Support Active
          </div>
</div>

<div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col gap-space-sm relative overflow-hidden group hover:bg-surface-container transition-all">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-error font-bold">DAY 2 • 08:00 AM</span>
<span className="px-space-xs py-0.5 rounded bg-error/10 text-error font-label-sm text-label-sm">LOCKDOWN</span>
</div>
<h4 className="font-headline-sm text-headline-sm text-on-surface">Code Freeze &amp; Final Evaluation</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Strict repository commit freeze. Live hardware demo evaluation in front of technical jury and industry directors.
          </p>
<div className="mt-auto pt-space-xs flex items-center gap-space-xs font-label-sm text-label-sm text-outline">
<span className="material-symbols-outlined text-[14px]">gavel</span> 5-Min Strict Pitch + 3-Min Q&amp;A
          </div>
</div>

<div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col gap-space-sm relative overflow-hidden group hover:bg-surface-container transition-all">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-secondary-fixed font-bold">DAY 2 • 11:30 AM</span>
<span className="px-space-xs py-0.5 rounded bg-secondary-fixed/10 text-secondary-fixed font-label-sm text-label-sm">FINALE</span>
</div>
<h4 className="font-headline-sm text-headline-sm text-on-surface">Valedictory &amp; Cash Prizes</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Announcement of winners by Chief Guest and Director of Student Welfare. Immediate distribution of ₹1.5L prize pool and certificates.
          </p>
<div className="mt-auto pt-space-xs flex items-center gap-space-xs font-label-sm text-label-sm text-outline">
<span className="material-symbols-outlined text-[14px]">military_tech</span> Main Auditorium Stage
          </div>
</div>
</div>
</div>
</section>

<section className="w-full px-gutter-mobile lg:px-gutter py-space-xl bg-surface-container-lowest/50" id="committee">
<div className="max-w-[1440px] mx-auto flex flex-col gap-space-xl">
<div className="flex flex-col gap-space-xs">
<div className="flex items-center gap-space-xs">
<span className="font-label-sm text-label-sm text-primary uppercase">PROTOCOL // 04</span>
<span className="text-outline">•</span>
<span className="font-label-sm text-label-sm text-outline uppercase">GOVERNANCE &amp; WARDENS</span>
</div>
<h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">COMMITTEE, DIRECTORS &amp; WARDENS</h2>
<p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
          Supervised under the patronage of Student Welfare and the residential hostel authorities ensuring seamless security and technical infrastructure.
        </p>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">

<div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-space-md shadow-md">
<div className="w-full h-48 rounded-lg overflow-hidden relative bg-surface-container">
<img className="w-full h-full object-cover" data-alt="Distinguished South Asian senior academic director with glasses and formal jacket, smiling with academic authority against dark technology background with ambient cyan lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUdGnz3R9OB7qp_hGpHYYmMqu0KqgDWw2hsdC_-sBAGaKvzXPXWwzMt5BcvFftLPfNxAgnVSpp2Ht22eKhBAMxjfQu8ekSq5xvkaV2mRLDYeiZOsW3kcHUPDRaul689PTwdLfgVdU-jMYoh9K8zxGf0SVj7Z0F2KYghmSN9qsQuS2J2VYC168-FW7D1KFTPz2eruF97CI2iXHCIgCjj_LjgpZ16d97oYTbzljpIQs4VIxTJ5jjtc69"/>
<div className="absolute top-2 right-2 px-space-xs py-0.5 rounded bg-surface-container-lowest/80 text-primary font-label-sm text-[10px]">DIRECTORATE</div>
</div>
<div className="flex flex-col gap-1">
<h4 className="font-headline-sm text-headline-sm text-on-surface">Dr. S. Ramanathan</h4>
<span className="font-label-sm text-label-sm text-primary">Director, Student Welfare</span>
<p className="font-body-sm text-body-sm text-on-surface-variant pt-1">
              Overseeing campus residential life and overall event logistics clearance.
            </p>
</div>
<div className="mt-auto pt-space-xs flex flex-col gap-1 font-label-sm text-[11px] text-outline">
<span>JURISDICTION: Central Campus</span>
<span className="text-on-surface-variant">dsw@vitstudent.ac.in</span>
</div>
</div>

<div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-space-md shadow-md">
<div className="w-full h-48 rounded-lg overflow-hidden relative bg-surface-container">
<img className="w-full h-full object-cover" data-alt="Professional Indian male professor in formal shirt with determined expression in university lab setting, dark cyan ambient rim light" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCR1Psm8D6qvAeXUaQxiGZ7qiwAy6RlPSYWCw7mI0_T5xAGq2qpeM1EiXKp04mR6tz5JeSXGWkpC8rTp0rRaD_mMonEd6rTAS9UZesJ2L6iNBzsXI64WljzLJwreVbLv8OBJ7WrrIuLS-urURjLV6AkXaipMAqo-y5yfqyAlc2JDdQU6BVlz01VN7r4wsx50OfqFzomvl6-2Sw9S0zsor_ErFmU5KKb-WSbvUjvTVc6OdjnEiBhJ3iU"/>
<div className="absolute top-2 right-2 px-space-xs py-0.5 rounded bg-surface-container-lowest/80 text-tertiary font-label-sm text-[10px]">WARDEN // MH</div>
</div>
<div className="flex flex-col gap-1">
<h4 className="font-headline-sm text-headline-sm text-on-surface">Prof. K. Narayanan</h4>
<span className="font-label-sm text-label-sm text-primary">Senior Warden, Men's Blocks</span>
<p className="font-body-sm text-body-sm text-on-surface-variant pt-1">
              Hostel Blocks A through D nocturnal logistics, entry permissions and power grid sync.
            </p>
</div>
<div className="mt-auto pt-space-xs flex flex-col gap-1 font-label-sm text-[11px] text-outline">
<span>JURISDICTION: Men's Hostel (Blocks A-D)</span>
<span className="text-on-surface-variant">warden.mh@vit.ac.in</span>
</div>
</div>

<div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-space-md shadow-md">
<div className="w-full h-48 rounded-lg overflow-hidden relative bg-surface-container">
<img className="w-full h-full object-cover" data-alt="Professional South Asian female engineering professor and hostel warden with confident calm expression in modern institutional office, deep dark cinematic shadows with soft cyan glow" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBe6yhOf-rEFb-98r6YVo1J1K1N7CijZF_fSiLgE_zhpO98QM9uP9EhCqoD4kPxqlt-35YKSfmyWMHyUMfWxS1Aa0fjk-HtJ4ODKA3HsbOZLj0uvJvB1KRTgtTM2HEBcAwz0ri8ntA2SwiaetyDnc_5wjSUTLLq6axtN1ZR6m18Z9UtVHm7fr70yVcDCCvYTGoWzGVsLUEk4GiNgxa6s87L1-Hz_5gt4vMllUTpVQn8hs-kDAZXIN2G"/>
<div className="absolute top-2 right-2 px-space-xs py-0.5 rounded bg-surface-container-lowest/80 text-secondary font-label-sm text-[10px]">WARDEN // LH</div>
</div>
<div className="flex flex-col gap-1">
<h4 className="font-headline-sm text-headline-sm text-on-surface">Dr. Priya Nair</h4>
<span className="font-label-sm text-label-sm text-primary">Senior Warden, Women's Blocks</span>
<p className="font-body-sm text-body-sm text-on-surface-variant pt-1">
              Hostel Blocks E through G logistics, transit coordination and safety protocols.
            </p>
</div>
<div className="mt-auto pt-space-xs flex flex-col gap-1 font-label-sm text-[11px] text-outline">
<span>JURISDICTION: Ladies' Hostel (Blocks E-G)</span>
<span className="text-on-surface-variant">warden.lh@vit.ac.in</span>
</div>
</div>

<div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-space-md shadow-md">
<div className="w-full h-48 rounded-lg overflow-hidden relative bg-surface-container">
<img className="w-full h-full object-cover" data-alt="Sharp young Indian student leader and software engineer standing in a server room with glowing blue network server racks, wearing dark branded tech hoodie" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUftHvl3VM7sCzAefpwNWol6Jfbm2_B6_Pvxc9M4RWfXTwTXE9C1W8VrjyWZkuAsvFIvakishLU7tlwPu3C6kzzU1n39So-fOHKYKXQB0eGMRMLixdLrLvX4O1Pev0Hg87NuqXdHISvd6b5v7--6y1k_mwI8IDct6HxPDHDBAM7BBt5mObUKl6gptyDdu6ps_jD02k9EEuKM64j_dEzTGFumEH9wGn_pvzmZqPXmsla213_TViCiWw"/>
<div className="absolute top-2 right-2 px-space-xs py-0.5 rounded bg-surface-container-lowest/80 text-tertiary-fixed font-label-sm text-[10px]">STUDENT CHAIR</div>
</div>
<div className="flex flex-col gap-1">
<h4 className="font-headline-sm text-headline-sm text-on-surface">Arnav Deshmukh</h4>
<span className="font-label-sm text-label-sm text-primary">Chief Technical Convener</span>
<p className="font-body-sm text-body-sm text-on-surface-variant pt-1">
              Lead architect of intranet judge pipelines, automated check-ins and hackathon logistics.
            </p>
</div>
<div className="mt-auto pt-space-xs flex flex-col gap-1 font-label-sm text-[11px] text-outline">
<span>ROOM 412, BLOCK-B RESIDENCY</span>
<span className="text-on-surface-variant">techlead@cyfthack.org</span>
</div>
</div>
</div>
</div>
</section>

<section className="w-full px-gutter-mobile lg:px-gutter py-space-xl" id="guests-prizes">
<div className="max-w-[1440px] mx-auto flex flex-col gap-space-xl">

<div className="bg-gradient-to-br from-surface-container-high/80 via-surface-container-low to-surface-container-lowest p-space-lg lg:p-space-xl rounded-2xl shadow-xl flex flex-col lg:flex-row items-center gap-space-xl">
<div className="w-full lg:w-1/3 aspect-square max-w-[320px] rounded-xl overflow-hidden relative shadow-2xl bg-surface-dim shrink-0">
<img className="w-full h-full object-cover" data-alt="Celebrated world-class artificial intelligence research scientist delivering a keynote, dramatic rim lighting in electric cyan and deep indigo, futuristic backdrop" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKsMK2gO37tRi6vz-xV5zP992AbGuqGODzPjjoIYUOO87QT8Wq3yQnrMFtwOE9B1wu65BP5Azla_wO8U_7dbbnHZgFhYJCf3l8Jyds88PyMA9HNknXVqWhp3M3lGKEWrjgv7jD032rdjp52X5Td76OjYqm1mqWGcU8gSilqPfazr0p6I-1P3mBwHQzOp8tB9MjWrqbTmZIIF8Jszr6xbUIeI39dGFRCgHLvihSdPsy8vXaClRQ7Kzy"/>
<div className="absolute bottom-3 left-3 px-space-sm py-1 rounded bg-surface-container-lowest/90 text-primary font-label-sm text-label-sm">KEYNOTE GUEST OF HONOUR</div>
</div>
<div className="flex flex-col gap-space-md w-full">
<div className="flex flex-wrap items-center gap-space-xs">
<span className="font-label-sm text-label-sm text-tertiary uppercase font-medium">DISTINGUISHED CHIEF GUEST</span>
<span className="text-outline">•</span>
<span className="font-label-sm text-label-sm text-outline">VALEDICTORY KEYNOTE</span>
</div>
<h3 className="font-headline-lg text-headline-lg text-on-surface">Dr. Vikramaditya Sen</h3>
<p className="font-label-md text-label-md text-primary font-semibold">VP &amp; Global AI Research Director • Ex-DeepMind Pioneer</p>
<p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
            Leading international frontiers in decentralized autonomy and embodied machine agents. Dr. Sen will conduct live architectural evaluations during the final round and present exclusive incubation opportunities at Bangalore Research Labs.
          </p>
<div className="flex flex-wrap items-center gap-space-md pt-space-xs">
<div className="flex items-center gap-space-xs text-on-surface font-body-sm text-body-sm">
<span className="material-symbols-outlined text-primary text-[18px]">verified</span>
              Direct In-Person Judging
            </div>
<div className="flex items-center gap-space-xs text-on-surface font-body-sm text-body-sm">
<span className="material-symbols-outlined text-tertiary text-[18px]">rocket_launch</span>
              Fast-Track Seed Incubation
            </div>
</div>
</div>
</div>

<div className="flex flex-col gap-space-lg">
<div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
<div>
<span className="font-label-sm text-label-sm text-primary uppercase">BOUNTIES &amp; RECOGNITION</span>
<h3 className="font-headline-lg text-headline-lg text-on-surface">₹1,50,000 TOTAL CASH POOL</h3>
</div>
<div className="font-label-sm text-label-sm text-outline">DISBURSED VIA INSTANT DIRECT BANK TRANSFER</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">

<div className="bg-surface-container-high/60 backdrop-blur-md p-space-xl rounded-xl flex flex-col justify-between gap-space-lg shadow-xl relative overflow-hidden order-1 md:order-2">
<div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-2xl"></div>
<div className="flex flex-col gap-space-sm relative z-10">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-primary font-bold">1ST RANK • CHAMPION</span>
<span className="material-symbols-outlined text-primary text-[28px]">trophy</span>
</div>
<div className="font-headline-xl text-[54px] font-black text-on-surface tracking-tight">₹75,000</div>
<p className="font-body-md text-body-md text-on-surface-variant">
                Direct cash award + Fast-track incubation interview with Vellore Technology Business Incubator (V-TBI) + Rolling Championship Trophy.
              </p>
</div>
<div className="pt-space-md border-t-0 bg-surface-container-lowest/40 p-space-sm rounded-lg flex flex-col gap-1 font-label-sm text-[11px] text-tertiary">
<span>+ ₹1,00,000 AWS GPU Cloud Compute Credits</span>
<span>+ Official Citation from Director of Student Welfare</span>
</div>
</div>

<div className="bg-surface-container-low p-space-xl rounded-xl flex flex-col justify-between gap-space-lg shadow-md order-2 md:order-1">
<div className="flex flex-col gap-space-sm">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-secondary font-bold">2ND RANK • RUNNER UP</span>
<span className="material-symbols-outlined text-secondary text-[24px]">military_tech</span>
</div>
<div className="font-headline-xl text-[44px] font-bold text-on-surface tracking-tight">₹45,000</div>
<p className="font-body-md text-body-md text-on-surface-variant">
                Direct cash bounty + High-performance GPU Cloud Credits + Commendation Medal for entire team.
              </p>
</div>
<div className="pt-space-md bg-surface-container-lowest/40 p-space-sm rounded-lg flex flex-col gap-1 font-label-sm text-[11px] text-outline">
<span>+ ₹50,000 Cloud GPU Infrastructure</span>
<span>+ Priority Internship Screening at Partner Labs</span>
</div>
</div>

<div className="bg-surface-container-low p-space-xl rounded-xl flex flex-col justify-between gap-space-lg shadow-md order-3">
<div className="flex flex-col gap-space-sm">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-tertiary font-bold">3RD RANK • THIRD PLACE</span>
<span className="material-symbols-outlined text-tertiary text-[24px]">workspace_premium</span>
</div>
<div className="font-headline-xl text-[44px] font-bold text-on-surface tracking-tight">₹30,000</div>
<p className="font-body-md text-body-md text-on-surface-variant">
                Direct cash reward + Micro-controller &amp; Edge Vision Hardware Dev Kits distributed to each team member.
              </p>
</div>
<div className="pt-space-md bg-surface-container-lowest/40 p-space-sm rounded-lg flex flex-col gap-1 font-label-sm text-[11px] text-outline">
<span>+ Complete Jetson / ESP32 Hardware Bundle</span>
<span>+ Developer Guild Commendation</span>
</div>
</div>
</div>

<div className="bg-surface-container p-space-md rounded-lg flex flex-col sm:flex-row items-center justify-between gap-space-md">
<div className="flex items-center gap-space-md">
<span className="material-symbols-outlined text-primary text-[28px]">verified_user</span>
<div className="flex flex-col">
<span className="font-headline-sm text-body-md font-semibold text-on-surface">Digital Certificates of Excellence for All Hostellite Finalists</span>
<span className="font-body-sm text-body-sm text-outline">Cryptographically verifiable credentials issued directly to registered @vitstudent.ac.in emails.</span>
</div>
</div>
<span className="font-label-sm text-label-sm text-tertiary shrink-0">100% ISSUANCE UPON CODE SUBMISSION</span>
</div>
</div>
</div>
</section>



<aside className="sticky bottom-4 z-40 px-gutter-mobile lg:px-gutter w-full pointer-events-none">
<div className="max-w-[1440px] mx-auto pointer-events-auto">
<div className="bg-surface-container-highest/90 backdrop-blur-2xl px-space-lg py-space-sm rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex items-center justify-between gap-space-md">
<div className="flex items-center gap-space-md">
<div className="hidden sm:flex items-center gap-space-xs">
<span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse"></span>
<span className="font-label-sm text-label-sm text-on-surface font-semibold">148 HOSTEL BUILDERS VERIFIED</span>
</div>
<span className="hidden md:inline font-label-sm text-label-sm text-outline">• 52 SLOTS REMAINING</span>
</div>
<div className="flex items-center gap-space-md">
<div className="hidden sm:flex items-center gap-space-xs text-outline font-label-sm text-label-sm">
<span>TIMER:</span>
<span className="text-primary font-bold">36:00:00</span>
</div>
<a className="px-space-lg py-2 rounded-lg bg-primary-container text-on-primary-container font-headline-sm text-body-sm font-bold hover:bg-secondary-container hover:text-on-secondary transition-all shadow-[0_0_16px_rgba(56,189,248,0.3)]" href="/rules">
            Quick Register
          </a>
</div>
</div>
</div>
</aside>

</div></main><footer className="w-full bg-surface-container-lowest"><div className="max-w-[1440px] mx-auto px-gutter-mobile lg:px-gutter py-space-xl flex flex-col gap-space-lg"><div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md"><div className="flex items-center gap-space-md"><img alt="CYFT Hackathon Logo" className="h-6 w-auto object-contain opacity-80" src="https://lh3.googleusercontent.com/aida/AEtjO1UUEiCGnn5c_bL-wgu_f9haQuNvG0PPpo-bxmRNghgv5oV9BPGKdOeWF5tHDOfYPrtxRlGQi5nl8Is3SKJkRdCs_CcoAx0fv2GMcozlJYRvLfDPbhCltT8Jlinez_oxmOKJOKCb9887ptoUHuymDVPsogBFq079iIewYsQUdPxgV5SEfhMP2CVDcevbSk2iSJv9Fp9TnFOZPs4Mk2dHyrBT3K7KSBZQVqoE9mgo1DDlg784vtZVlvouJNI"/><span className="font-label-md text-label-md text-on-surface-variant">CYFT // ARCHITECTURE • GLOBAL HACKATHON PROTOCOL</span></div><div className="flex items-center gap-space-md"><span className="font-label-sm text-label-sm text-tertiary flex items-center gap-space-xs"><span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>SYSTEMS OPERATIONAL</span><span className="font-label-sm text-label-sm text-outline">NODE LATENCY: 14MS</span></div></div><div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md text-on-surface-variant pt-space-md"><div className="flex flex-col gap-1"><p className="font-body-sm text-body-sm text-on-surface">Organized by CYFT Technical Committee &amp; Student Guild</p><p className="font-body-sm text-body-sm text-outline">Direct Enquiries: operations@cyfthack.org • Telegram: @CYFT_DISPATCH</p></div><p className="font-label-sm text-label-sm text-outline">© 2025 CYFT HACK. ALL ENCRYPTED RIGHTS RESERVED.</p></div></div></footer>
</>
  );
}
