"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { getParticipantCount } from '@/actions/stats';
import { getSystemSettings } from '@/actions/team';
import { useAuth } from '@/context/AuthContext';
import { isAdminEmail } from '@/config/admin';

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */
const problemStatements = [
  {
    id: "PS-01",
    title: "Autonomous Hostel Energy Grid Balancing",
    track: "POWER SYSTEMS",
    icon: "bolt",
    color: "#38bdf8",
    tags: ["IoT / ESP32", "Reinforcement Learning"],
    description: "Design a low-latency micro-inverter and sensor telemetry agent that redistributes peak electrical loads across hostel wings during generator failover periods.",
    detailedDescription: "During nocturnal diesel generator failovers and peak electrical load intervals, individual hostel blocks experience acute voltage drops and localized circuit breaker trips. Teams must architect an edge IoT telemetry and load-balancing system. The solution should ingest high-frequency current and voltage metrics from micro-inverter and sensor nodes, predict consumption spikes with lightweight algorithms, and automatically orchestrate phase and circuit switching across hostel wings—guaranteeing continuous, uninterrupted power for critical study spaces and campus amenities."
  },
  {
    id: "PS-02",
    title: "Real-time Mess Queue & Waste Analytics",
    track: "SMART DINING",
    icon: "restaurant",
    color: "#34d399",
    tags: ["YOLOv8 Edge", "WebSockets API"],
    description: "Build an edge-deployed computer vision pipeline that estimates tray depletion rates and predicts queue wait times across 4 dining halls.",
    detailedDescription: "Hostel dining halls accommodate thousands of students within concentrated meal windows, causing heavy entry queues, unpredictable wait times, and significant food wastage. This challenge requires developing an edge-deployed computer vision pipeline that processes real-time camera streams to monitor queue length and measure buffet tray depletion rates. The system must push dynamic wait-time forecasts and refill alerts to student dashboards via low-latency WebSockets while adhering strictly to privacy standards by eliminating biometric storage."
  },
  {
    id: "PS-03",
    title: "Localized Mesh Network for Disaster Comms",
    track: "DISASTER COMMS",
    icon: "cell_tower",
    color: "#a855f7",
    tags: ["LoRaWAN", "Cryptographic Gossip"],
    description: "Implement zero-infrastructure packet forwarding over LoRa and peer-to-peer Wi-Fi Direct between hostel blocks for emergency notifications.",
    detailedDescription: "During extreme weather events, cyclones, or campus fiber optic disruptions, standard cellular towers and internet gateways frequently experience complete outages. Participants must engineer a zero-infrastructure, peer-to-peer wireless mesh network spanning residential hostel blocks. Utilizing LoRa packet radios and decentralized gossip forwarding, nodes must reliably transmit encrypted warden broadcast notifications, emergency distress beacons, and medical dispatch requests without relying on centralized telecommunication infrastructure."
  },
  {
    id: "PS-04",
    title: "Attendance Verification via Edge Vision",
    track: "RESIDENTIAL ACCESS",
    icon: "face",
    color: "#f59e0b",
    tags: ["TensorRT", "Local SQLite Cache"],
    description: "Build an anti-spoofing night-vision facial verification engine that integrates with local hostel warden portals for 4,000+ students.",
    detailedDescription: "Nightly residential biometric roll-calls for 4,000+ hostel students generate massive physical bottlenecks and administrative overhead. This challenge requires engineering an embedded anti-spoofing optical verification engine that executes purely on local edge servers without external cloud latency. The system must achieve sub-second verification against local encrypted caches, reject printed photo or screen replay attacks, and seamlessly sync confirmed check-in logs with warden administrative portals."
  },
  {
    id: "PS-05",
    title: "Hostel Water Storage & Telemetry Pipeline",
    track: "HYDRO-TELEMETRY",
    icon: "water_drop",
    color: "#22d3ee",
    tags: ["Ultrasonic Sensors", "MQTT Pipeline"],
    description: "Automated hydrostatic pressure sensors and overhead water volume forecasting engine to eliminate nocturnal dryouts across blocks A–D.",
    detailedDescription: "Residential blocks rely on complex overhead and underground reservoir systems where sudden midnight consumption spikes can cause acute water dryouts. Participants must architect an automated telemetry pipeline utilizing hydrostatic pressure and ultrasonic level sensors. The solution must ingest data through lightweight MQTT channels, model consumption trends per hostel wing, detect latent pipeline leakages, and trigger automated pump actuation routines before reserves reach critical exhaustion thresholds."
  },
  {
    id: "PS-06",
    title: "Acoustic Silence Enforcement in Study Halls",
    track: "ACOUSTIC SENSING",
    icon: "graphic_eq",
    color: "#f43f5e",
    tags: ["MEMS Array", "Edge Impulse"],
    description: "Spatial audio classification of decibel spikes and automated gentle visual warnings to preserve nocturnal study atmospheres without human intervention.",
    detailedDescription: "Late-night residential study halls require quiet, focused environments, but physical supervision by security personnel is sporadic and intrusive. Teams must construct a spatial acoustic sensing unit equipped with a MEMS microphone array and edge audio classification. The device will filter ambient background noise from persistent disruptive conversations, triggering gentle, non-intrusive progressive visual warnings to maintain study room etiquette automatically."
  },
];

const committeeMembers = [
  {
    name: "Dr. S. Ramanathan",
    role: "Director, Student Welfare",
    desc: "Overseeing campus residential life and overall event logistics clearance.",
    tag: "DIRECTORATE",
    jurisdiction: "Central Campus",
    email: "dsw@vitstudent.ac.in",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUdGnz3R9OB7qp_hGpHYYmMqu0KqgDWw2hsdC_-sBAGaKvzXPXWwzMt5BcvFftLPfNxAgnVSpp2Ht22eKhBAMxjfQu8ekSq5xvkaV2mRLDYeiZOsW3kcHUPDRaul689PTwdLfgVdU-jMYoh9K8zxGf0SVj7Z0F2KYghmSN9qsQuS2J2VYC168-FW7D1KFTPz2eruF97CI2iXHCIgCjj_LjgpZ16d97oYTbzljpIQs4VIxTJ5jjtc69"
  },
  {
    name: "Prof. K. Narayanan",
    role: "Senior Warden, Men's Blocks",
    desc: "Hostel Blocks A–D nocturnal logistics, entry permissions and power grid sync.",
    tag: "WARDEN · MH",
    jurisdiction: "Men's Hostel (Blocks A-D)",
    email: "warden.mh@vit.ac.in",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCR1Psm8D6qvAeXUaQxiGZ7qiwAy6RlPSYWCw7mI0_T5xAGq2qpeM1EiXKp04mR6tz5JeSXGWkpC8rTp0rRaD_mMonEd6rTAS9UZesJ2L6iNBzsXI64WljzLJwreVbLv8OBJ7WrrIuLS-urURjLV6AkXaipMAqo-y5yfqyAlc2JDdQU6BVlz01VN7r4wsx50OfqFzomvl6-2Sw9S0zsor_ErFmU5KKb-WSbvUjvTVc6OdjnEiBhJ3iU"
  },
  {
    name: "Dr. Priya Nair",
    role: "Senior Warden, Women's Blocks",
    desc: "Hostel Blocks E–G logistics, transit coordination and safety protocols.",
    tag: "WARDEN · LH",
    jurisdiction: "Ladies' Hostel (Blocks E-G)",
    email: "warden.lh@vit.ac.in",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBe6yhOf-rEFb-98r6YVo1J1K1N7CijZF_fSiLgE_zhpO98QM9uP9EhCqoD4kPxqlt-35YKSfmyWMHyUMfWxS1Aa0fjk-HtJ4ODKA3HsbOZLj0uvJvB1KRTgtTM2HEBcAwz0ri8ntA2SwiaetyDnc_5wjSUTLLq6axtN1ZR6m18Z9UtVHm7fr70yVcDCCvYTGoWzGVsLUEk4GiNgxa6s87L1-Hz_5gt4vMllUTpVQn8hs-kDAZXIN2G"
  },
  {
    name: "Arnav Deshmukh",
    role: "Chief Technical Convener",
    desc: "Lead architect of intranet judge pipelines, automated check-ins and hackathon logistics.",
    tag: "STUDENT CHAIR",
    jurisdiction: "Room 412, Block-B",
    email: "techlead@cyfthack.org",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBUftHvl3VM7sCzAefpwNWol6Jfbm2_B6_Pvxc9M4RWfXTwTXE9C1W8VrjyWZkuAsvFIvakishLU7tlwPu3C6kzzU1n39So-fOHKYKXQB0eGMRMLixdLrLvX4O1Pev0Hg87NuqXdHISvd6b5v7--6y1k_mwI8IDct6HxPDHDBAM7BBt5mObUKl6gptyDdu6ps_jD02k9EEuKM64j_dEzTGFumEH9wGn_pvzmZqPXmsla213_TViCiWw"
  },
];

const timelineMilestones = [
  {
    time: "DAY 1 · 09:00",
    title: "Check-in & Team Verification",
    desc: "DSW pass validation & biometrics",
    icon: "badge",
    color: "#38bdf8",
    x: 90,
    y: 470,
    pinDirection: "down"
  },
  {
    time: "DAY 1 · 11:00",
    title: "Problem Statements Released",
    desc: "24-hour hackathon timer starts",
    icon: "rocket_launch",
    color: "#22d3ee",
    x: 295,
    y: 280,
    pinDirection: "up"
  },
  {
    time: "DAY 1 · 17:00",
    title: "Mentorship & Architecture Review",
    desc: "Milestone-1 checkpoint",
    icon: "groups",
    color: "#34d399",
    x: 515,
    y: 470,
    pinDirection: "down"
  },
  {
    time: "DAY 2 · 00:00",
    title: "Midnight Hack & Fuel Refuel",
    desc: "Energy boosters & nocturnal dev",
    icon: "restaurant",
    color: "#a855f7",
    x: 725,
    y: 280,
    pinDirection: "up"
  },
  {
    time: "DAY 2 · 08:00",
    title: "Code Freeze & Intranet Eval",
    desc: "Submissions lock & judging",
    icon: "gavel",
    color: "#f43f5e",
    x: 935,
    y: 470,
    pinDirection: "down"
  },
  {
    time: "DAY 2 · 11:00",
    title: "Valedictory & Cash Awards",
    desc: "Final pitches & prize ceremony",
    icon: "trophy",
    color: "#f59e0b",
    x: 1115,
    y: 280,
    pinDirection: "up"
  },
];



/* ═══════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════ */

/** Live countdown to Target Date */
function useCountdown(target: Date) {
  const calc = useCallback(() => {
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    };
  }, [target]);

  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return t;
}

/** Smooth animated number counter */
function useAnimatedNumber(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  const rafRef = useRef(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    if (target === 0) return;
    fromRef.current = val;
    startRef.current = null;

    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(fromRef.current + (target - fromRef.current) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return val;
}

/* ═══════════════════════════════════════════
   ANIMATION VARIANTS (CASCADE IN, FADE OUT ALL AT ONCE)
   ═══════════════════════════════════════════ */
const staggerContainer: Variants = {
  hidden: {
    transition: {
      duration: 0.35,
      ease: "easeInOut",
      staggerChildren: 0, // When leaving viewport: fade out all at once!
    },
  },
  visible: {
    transition: {
      duration: 0.4,
      staggerChildren: 0.1, // When entering viewport: fade in element by element!
      delayChildren: 0.05,
    },
  },
};

const fadeItem: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    transition: {
      duration: 0.25,
      ease: "easeInOut",
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const popCard: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.88,
    y: 20,
    transition: {
      duration: 0.25,
      ease: "easeInOut",
    },
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      mass: 0.8,
    },
  },
};

/* ═══════════════════════════════════════════
   GDG-STYLE LAYERED OUTLINE TIMER COMPONENT
   ═══════════════════════════════════════════ */
function GDGTimer({ timeLeft }: { timeLeft: { days: number; hours: number; minutes: number; seconds: number } }) {
  const d = String(timeLeft.days).padStart(2, '0');
  const h = String(timeLeft.hours).padStart(2, '0');
  const m = String(timeLeft.minutes).padStart(2, '0');
  const s = String(timeLeft.seconds).padStart(2, '0');

  const timeDisplay = `${d}d : ${h}h : ${m}m : ${s}s`;

  return (
    <div className="w-full flex flex-col items-center justify-center select-none py-2" suppressHydrationWarning>
      <div
        className="gdg-timer-stack w-full flex justify-center text-center tracking-tight"
        style={{
          fontSize: 'clamp(1.85rem, 6.8vw, 7.5rem)',
        }}
        suppressHydrationWarning
      >
        {/* Top 2nd layered outline */}
        <div className="gdg-timer-layer-top2" suppressHydrationWarning>{timeDisplay}</div>
        {/* Top 1st layered outline */}
        <div className="gdg-timer-layer-top1" suppressHydrationWarning>{timeDisplay}</div>
        {/* Center Glowing Main Outline */}
        <div className="gdg-timer-layer-center" suppressHydrationWarning>{timeDisplay}</div>
        {/* Bottom 1st layered outline */}
        <div className="gdg-timer-layer-bot1" suppressHydrationWarning>{timeDisplay}</div>
        {/* Bottom 2nd layered outline */}
        <div className="gdg-timer-layer-bot2" suppressHydrationWarning>{timeDisplay}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export default function Home() {
  const { user } = useAuth();
  const isAdmin = isAdminEmail(user?.email);
  const [targetDate, setTargetDate] = useState(() => new Date('2026-12-01T23:59:59+05:30'));
  const timeLeft = useCountdown(targetDate);

  const [rawCount, setRawCount] = useState(0);
  const participantCount = useAnimatedNumber(rawCount);

  const [scrolled, setScrolled] = useState(false);
  const [activeModalPS, setActiveModalPS] = useState<typeof problemStatements[0] | null>(null);

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModalPS(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync live hackathon timer from system config
  useEffect(() => {
    getSystemSettings().then((res) => {
      if (res?.targetDate) {
        setTargetDate(new Date(res.targetDate));
      }
    });
  }, []);

  // Live participant count
  useEffect(() => {
    const fetch_ = async () => {
      const c = await getParticipantCount();
      setRawCount(c);
    };
    fetch_();
    const id = setInterval(fetch_, 30000);
    return () => clearInterval(id);
  }, []);

  // Navbar scroll background trigger to prevent hero text overlapping
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Support direct section deep-linking via query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sec = params.get('section');
    if (sec) {
      setTimeout(() => {
        document.getElementById(sec)?.scrollIntoView({ behavior: 'instant', block: 'start' });
      }, 50);
    }
  }, []);

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      {/* ── HIGH-DENSITY SOLID/GLASS NAV (PREVENTS OVERLAPPING CLASH) ── */}
      <header className="fixed top-0 w-full z-50 transition-all duration-300">
        <div
          className={`mx-3 sm:mx-6 mt-3 rounded-2xl transition-all duration-300 ${
            scrolled
              ? 'bg-[#030712]/95 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.05)]'
              : 'bg-[#030712]/70 backdrop-blur-xl border border-white/[0.08]'
          }`}
        >
          <div className="h-16 max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center transition-transform group-hover:scale-105"
                style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 15, color: '#030712' }}
              >
                S
              </div>
              <div className="hidden sm:flex flex-col leading-none">
                <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14, color: '#e2e8f0', letterSpacing: '-0.02em' }}>
                  Solve-a-thon
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, fontSize: 10, color: '#64748b', letterSpacing: '0.05em' }}>
                  2026-27
                </span>
              </div>
            </Link>

            <nav className="hidden xl:flex items-center gap-6">
              {[
                { l: 'Problem Statements', id: 'problems' },
                { l: 'Timeline', id: 'timeline' },
                { l: 'Committee', id: 'committee' },
                { l: 'Prizes', id: 'guests-prizes' },
              ].map(n => (
                <a
                  key={n.id}
                  href={`#${n.id}`}
                  onClick={e => scrollTo(e, n.id)}
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 500, color: '#94a3b8', transition: 'color 0.2s', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                >
                  {n.l}
                </a>
              ))}
              <Link href="/rules" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 500, color: '#94a3b8' }} className="hover:!text-slate-100 transition-colors">
                Rules
              </Link>
            </nav>

            <div className="flex items-center gap-3 shrink-0">
              {/* Live registration counter pill */}
              <div
                className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <span className="relative w-[7px] h-[7px] rounded-full bg-emerald-400 live-dot" />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#34d399', letterSpacing: '0.08em' }}>
                  {participantCount} REGISTERED
                </span>
              </div>

              <Link
                href={isAdmin ? "/admin" : user ? "/profile" : "/register"}
                className="inline-flex items-center justify-center px-4 sm:px-5 py-2 rounded-xl font-semibold text-[13px] transition-all hover:scale-[1.03] active:scale-[0.98]"
                style={{
                  background: isAdmin
                    ? 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)'
                    : 'linear-gradient(135deg, #38bdf8 0%, #22d3ee 100%)',
                  color: isAdmin ? '#ffffff' : '#030712',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: isAdmin ? '0 0 24px rgba(168,85,247,0.35)' : '0 0 24px rgba(56,189,248,0.3)',
                }}
              >
                {isAdmin ? "Admin Portal" : user ? "Dashboard" : "Register / Login"}
              </Link>

              <Link
                href={isAdmin ? "/admin" : "/profile"}
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all hover:bg-white/[0.08]"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                title={isAdmin ? "Admin Console" : "Profile / Team"}
              >
                <span className={`material-symbols-outlined ${isAdmin ? 'text-purple-400' : 'text-slate-400'}`} style={{ fontSize: 17 }}>
                  {isAdmin ? 'admin_panel_settings' : 'person'}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="w-full pt-16 sm:pt-20 bg-[#030712] overflow-x-clip">
        <div className="flex flex-col w-full">

          {/* ════════ HERO SECTION (FITS FULLY ON LAPTOP SCREEN, GDG FULL-WIDTH BOTTOM TIMER) ════════ */}
          <section id="hero" className="relative w-full min-h-[calc(100vh-4.5rem)] lg:h-[calc(100vh-4.5rem)] flex flex-col justify-between pt-2 sm:pt-4 pb-3 sm:pb-4 overflow-hidden">
            {/* Ambient lighting orbs */}
            <div className="absolute top-[-100px] left-[20%] w-[550px] h-[350px] rounded-full bg-cyan-500/[0.08] blur-[160px] pointer-events-none ambient-orb" />
            <div className="absolute top-[35%] right-[-5%] w-[450px] h-[450px] rounded-full bg-indigo-500/[0.05] blur-[140px] pointer-events-none ambient-orb-delay" />
            <div className="absolute bottom-[-50px] left-[-10%] w-[350px] h-[350px] rounded-full bg-emerald-500/[0.04] blur-[120px] pointer-events-none ambient-orb" />

            <motion.div 
              variants={staggerContainer}
              initial="hidden" 
              whileInView="visible" 
              viewport={{ once: false, amount: 0.05 }} 
              className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col justify-between h-full flex-1"
            >
              {/* Top Row: Left Side (Text & CTAs) and Right Side (Large Stat Cards) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2 sm:pt-4 my-auto">
                {/* Left Side: Big Bold Text & CTAs shifted upwards */}
                <div className="lg:col-span-7 flex flex-col items-start text-left gap-3.5 sm:gap-4">
                  {/* Pill badge */}
                  <motion.div variants={fadeItem} className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-card" style={{ boxShadow: 'none' }}>
                    <span className="relative w-[6px] h-[6px] rounded-full bg-cyan-400 live-dot" />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#67e8f9', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                      VIT Chennai · Hostellite Hackathon
                    </span>
                  </motion.div>

                  {/* Massive Title */}
                  <motion.div variants={fadeItem} className="flex flex-col">
                    <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.95, fontSize: 'clamp(3.2rem, 5.8vw, 6.4rem)' }} className="flex flex-col">
                      <span className="text-white">SOLVE</span>
                      <div className="flex items-center gap-3">
                        <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400 bg-clip-text" style={{ WebkitTextFillColor: 'transparent' }}>-A-</span>
                        <span className="text-white">THON</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: '#64748b', letterSpacing: '0.15em', marginLeft: 8 }} className="self-center">
                          2026-27
                        </span>
                      </div>
                    </h1>
                  </motion.div>

                  {/* Subtitle (24 hours!) */}
                  <motion.p variants={fadeItem} className="max-w-xl" style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, lineHeight: 1.6, color: '#94a3b8' }}>
                    VIT Chennai&apos;s premier hackathon exclusively for hostellites. 24 hours of nocturnal engineering, distributed systems, and real campus challenges.
                  </motion.p>

                  {/* CTAs */}
                  <motion.div variants={fadeItem} className="flex flex-wrap items-center gap-3.5 pt-1">
                    <Link
                      href={isAdmin ? "/admin" : user ? "/profile" : "/register"}
                      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold transition-all hover:scale-[1.03] active:scale-[0.98] text-sm sm:text-base"
                      style={{
                        background: isAdmin
                          ? 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)'
                          : 'linear-gradient(135deg, #38bdf8 0%, #22d3ee 100%)',
                        color: isAdmin ? '#ffffff' : '#030712',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        boxShadow: isAdmin ? '0 0 30px rgba(168,85,247,0.4)' : '0 0 30px rgba(56,189,248,0.35)',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                        {isAdmin ? 'admin_panel_settings' : 'how_to_reg'}
                      </span>
                      {isAdmin ? "Open Admin Portal" : user ? "Go to Dashboard" : "Register Now"}
                    </Link>
                    <a
                      href="#problems"
                      onClick={(e: any) => { e.preventDefault(); document.getElementById('problems')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl glass-card font-semibold transition-all hover:scale-[1.02] text-sm sm:text-base text-slate-200"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: 'none' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>terminal</span>
                      View Challenges
                    </a>
                  </motion.div>
                </div>

                {/* Right Side: Bigger, More Prominent Stat Cards */}
                <div className="lg:col-span-5 grid grid-cols-2 gap-4 w-full max-w-[480px] mx-auto lg:ml-auto lg:mr-0">
                  {[
                    { icon: 'groups', val: `${participantCount}+`, label: 'Registered' },
                    { icon: 'timer', val: '24h', label: 'Hackathon' },
                    { icon: 'apartment', val: 'VIT', label: 'Chennai' },
                    { icon: 'payments', val: '₹1L', label: 'Prizes' },
                  ].map((s) => (
                    <motion.div
                      variants={popCard}
                      key={s.label}
                      className="glass-card card-pop rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-[#090e1a]/85 group"
                      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.5)' }}
                    >
                      <span className="material-symbols-outlined transition-transform group-hover:scale-110" style={{ fontSize: 32, color: '#38bdf8' }}>{s.icon}</span>
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 32, color: '#f1f5f9', letterSpacing: '-0.03em', lineHeight: 1 }}>{s.val}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{s.label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Bottom Row: Full-Width GDG Live Timer Display */}
              <motion.div 
                variants={fadeItem}
                className="w-full pt-2 sm:pt-3 pb-8 sm:pb-12 mt-auto"
              >
                {/* Centered 'Registration Ends in' header with glowing cyan lines beside it */}
                <div className="w-full flex items-center justify-center gap-3 sm:gap-5 pb-2 px-2">
                  <div className="h-[1px] flex-1 max-w-[280px] sm:max-w-md bg-gradient-to-r from-transparent via-cyan-400/50 to-cyan-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
                  <div className="flex items-center gap-2 shrink-0 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(56,189,248,0.15)]">
                    <span className="relative w-2 h-2 rounded-full bg-cyan-400 live-dot" />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#38bdf8', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                      Registration Ends in
                    </span>
                  </div>
                  <div className="h-[1px] flex-1 max-w-[280px] sm:max-w-md bg-gradient-to-l from-transparent via-cyan-400/50 to-cyan-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
                </div>
                <GDGTimer timeLeft={timeLeft} />
              </motion.div>
            </motion.div>
          </section>

          {/* ════════ PROBLEM STATEMENTS MARQUEE (SEAMLESS INFINITE ROLLER) ════════ */}
          <motion.section 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.05 }}
            className="w-full py-14 sm:py-20 overflow-hidden relative" 
            id="problems"
          >
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-8">
              <div className="flex flex-col items-center text-center gap-2.5">
                <motion.h2 variants={fadeItem} style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', color: '#f1f5f9', letterSpacing: '-0.03em' }}>
                  Problem Statements
                </motion.h2>
              </div>
            </div>

            {/* Continuous Marquee Track (Smooth Continuous Infinite Roller, Right to Left) */}
            <motion.div variants={fadeItem} className="relative w-full overflow-hidden py-4">
              {/* Fade gradients at edges */}
              <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-48 z-10 pointer-events-none" style={{ background: 'linear-gradient(90deg, #030712, transparent)' }} />
              <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-48 z-10 pointer-events-none" style={{ background: 'linear-gradient(270deg, #030712, transparent)' }} />

              <div className="ps-marquee-track">
                {/* Track Group 1 */}
                <div className="flex gap-6 pr-6 shrink-0">
                  {[...problemStatements, ...problemStatements].map((ps, i) => (
                    <div 
                      key={`track1-${ps.id}-${i}`} 
                      className="ps-banner group cursor-pointer"
                      onClick={() => setActiveModalPS(ps)}
                    >
                      {/* Front state: Themed Large Icon + Title (Clean, Greyed-out square banner) */}
                      <div className="ps-front">
                        <div
                          className="w-20 h-20 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 mb-3"
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                          }}
                        >
                          <span className="material-symbols-outlined text-5xl text-slate-400 group-hover:text-cyan-300 transition-colors">
                            {ps.icon}
                          </span>
                        </div>
                        <h3
                          style={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontWeight: 800,
                            fontSize: 18,
                            lineHeight: 1.35,
                            color: '#e2e8f0',
                          }}
                          className="px-2 line-clamp-3 text-center"
                        >
                          {ps.title}
                        </h3>
                      </div>

                      {/* Hover state: Clean Centered Title + Short Description (No tag pills) */}
                      <div className="ps-desc-container">
                        <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 16, lineHeight: 1.35, color: '#f8fafc', marginBottom: '0.65rem' }}>
                          {ps.title}
                        </h3>
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, lineHeight: 1.6, color: '#94a3b8' }}>
                          {ps.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Track Group 2 (Identical Clone for 100% Seamless Continuous Roller Loop) */}
                <div className="flex gap-6 pr-6 shrink-0" aria-hidden="true">
                  {[...problemStatements, ...problemStatements].map((ps, i) => (
                    <div 
                      key={`track2-${ps.id}-${i}`} 
                      className="ps-banner group cursor-pointer"
                      onClick={() => setActiveModalPS(ps)}
                    >
                      {/* Front state: Themed Large Icon + Title (Clean, Greyed-out square banner) */}
                      <div className="ps-front">
                        <div
                          className="w-20 h-20 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 mb-3"
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                          }}
                        >
                          <span className="material-symbols-outlined text-5xl text-slate-400 group-hover:text-cyan-300 transition-colors">
                            {ps.icon}
                          </span>
                        </div>
                        <h3
                          style={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontWeight: 800,
                            fontSize: 18,
                            lineHeight: 1.35,
                            color: '#e2e8f0',
                          }}
                          className="px-2 line-clamp-3 text-center"
                        >
                          {ps.title}
                        </h3>
                      </div>

                      {/* Hover state: Clean Centered Title + Short Description (No tag pills) */}
                      <div className="ps-desc-container">
                        <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 16, lineHeight: 1.35, color: '#f8fafc', marginBottom: '0.65rem' }}>
                          {ps.title}
                        </h3>
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, lineHeight: 1.6, color: '#94a3b8' }}>
                          {ps.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.section>

          {/* ════════ 3D ROAD TIMELINE (GDG DEVFEST STYLE) ════════ */}
          <motion.section
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.05 }}
            className="w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative overflow-hidden"
            id="timeline"
          >
            <div className="max-w-[1400px] mx-auto flex flex-col gap-10 sm:gap-14">
              <div className="flex flex-col items-center text-center gap-2">
                <motion.h2 variants={fadeItem} style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', color: '#f1f5f9', letterSpacing: '-0.03em' }}>
                  24-Hour Hackathon Timeline
                </motion.h2>
              </div>

              {/* ── Desktop Isometric 3D Road (Scales via SVG viewBox) ── */}
              <motion.div variants={fadeItem} className="hidden lg:block relative w-full" style={{ height: 640 }}>
                <svg
                  viewBox="0 0 1200 680"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full select-none"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    {/* Road Gradient — Cyan → Emerald → Violet → Pink → Amber */}
                    <linearGradient id="cyberRoadGrad" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="22%" stopColor="#22d3ee" />
                      <stop offset="44%" stopColor="#34d399" />
                      <stop offset="66%" stopColor="#a855f7" />
                      <stop offset="85%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>

                    {/* Dark 3D Extrusion Side-Bevel */}
                    <linearGradient id="cyberRoadExtrusion" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#0284c7" />
                      <stop offset="22%" stopColor="#0891b2" />
                      <stop offset="44%" stopColor="#059669" />
                      <stop offset="66%" stopColor="#7e22ce" />
                      <stop offset="85%" stopColor="#be123c" />
                      <stop offset="100%" stopColor="#b45309" />
                    </linearGradient>

                    {/* Faint Road Ambient Glow */}
                    <filter id="roadNeonGlow" x="-10%" y="-10%" width="120%" height="120%">
                      <feGaussianBlur stdDeviation="20" result="blur" />
                    </filter>
                  </defs>

                  {/* 1. Topographic Elevation Background Lines */}
                  <path
                    d="M 50 380 C 150 210, 280 230, 360 290 C 440 350, 600 250, 720 310 C 840 370, 1000 190, 1150 280"
                    stroke="rgba(56, 189, 248, 0.05)"
                    strokeWidth="1"
                    fill="none"
                  />
                  <path
                    d="M 20 480 C 200 330, 340 370, 480 430 C 620 490, 780 370, 920 440 C 1020 490, 1100 380, 1180 410"
                    stroke="rgba(168, 85, 247, 0.04)"
                    strokeWidth="1"
                    fill="none"
                  />
                  <path
                    d="M 80 190 C 220 110, 380 120, 520 180 C 660 240, 800 130, 950 170 C 1050 200, 1120 140, 1180 160"
                    stroke="rgba(52, 211, 153, 0.04)"
                    strokeWidth="1"
                    fill="none"
                  />

                  {/* 2. Soft Ambient Blur Aura Behind Road */}
                  <path
                    d="M 50 470 C 130 470, 195 280, 295 280 C 395 280, 415 470, 515 470 C 615 470, 625 280, 725 280 C 825 280, 835 470, 935 470 C 1035 470, 1025 280, 1115 280"
                    stroke="url(#cyberRoadGrad)"
                    strokeWidth="56"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.18"
                    filter="url(#roadNeonGlow)"
                  />

                  {/* 3. 3D Isometric Extrusion (Bottom Bevel) */}
                  <path
                    d="M 50 482 C 130 482, 195 292, 295 292 C 395 292, 415 482, 515 482 C 615 482, 625 292, 725 292 C 825 292, 835 482, 935 482 C 1035 482, 1025 292, 1115 292"
                    stroke="url(#cyberRoadExtrusion)"
                    strokeWidth="32"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* 4. Main 3D Road Ribbon (Top Surface) */}
                  <path
                    d="M 50 470 C 130 470, 195 280, 295 280 C 395 280, 415 470, 515 470 C 615 470, 625 280, 725 280 C 825 280, 835 470, 935 470 C 1035 470, 1025 280, 1115 280"
                    stroke="url(#cyberRoadGrad)"
                    strokeWidth="30"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* 5. Center Road Dashed Guideline */}
                  <path
                    d="M 50 470 C 130 470, 195 280, 295 280 C 395 280, 415 470, 515 470 C 615 470, 625 280, 725 280 C 825 280, 835 470, 935 470 C 1035 470, 1025 280, 1115 280"
                    stroke="rgba(255, 255, 255, 0.28)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="8 12"
                    fill="none"
                  />

                  {/* 6. Milestone Nodes & Pinposts */}
                  {timelineMilestones.map((m, idx) => {
                    const isUp = m.pinDirection === "up";
                    const pinTargetY = isUp ? m.y - 65 : m.y + 65;

                    return (
                      <g key={idx}>
                        {/* Anchor Dot on the Road */}
                        <circle cx={m.x} cy={m.y} r="7" fill="#030712" stroke={m.color} strokeWidth="3" />
                        <circle cx={m.x} cy={m.y} r="2.5" fill="#ffffff" />

                        {/* Vertical White/Color Pin Line */}
                        <line
                          x1={m.x}
                          y1={isUp ? m.y - 8 : m.y + 8}
                          x2={m.x}
                          y2={pinTargetY}
                          stroke={m.color}
                          strokeWidth="2"
                          strokeDasharray="3 3"
                          opacity="0.8"
                        />

                        {/* Top/Bottom Terminal Node Circle */}
                        <circle cx={m.x} cy={pinTargetY} r="4" fill={m.color} />

                        {/* Milestone Card (Embedded via foreignObject for pixel-perfect responsiveness) */}
                        <foreignObject
                          x={m.x - 95}
                          y={isUp ? pinTargetY - 118 : pinTargetY + 14}
                          width="190"
                          height="115"
                        >
                          <div
                            className="w-full flex flex-col items-center text-center p-2.5 rounded-xl card-pop cursor-pointer transition-all"
                            style={{
                              background: 'rgba(8, 12, 24, 0.92)',
                              border: `1px solid ${m.color}45`,
                              backdropFilter: 'blur(16px)',
                              boxShadow: `0 8px 30px rgba(0,0,0,0.7), 0 0 20px ${m.color}25`,
                            }}
                          >
                            {/* Icon Badge */}
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center mb-1 shrink-0"
                              style={{ background: `${m.color}25`, border: `1px solid ${m.color}60` }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16, color: m.color }}>
                                {m.icon}
                              </span>
                            </div>

                            {/* Date Badge */}
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 700, color: m.color, letterSpacing: '0.06em' }}>
                              {m.time}
                            </span>

                            {/* Milestone Title */}
                            <span
                              className="font-bold text-slate-100 text-[12px] leading-tight mt-0.5 line-clamp-2"
                              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                            >
                              {m.title}
                            </span>
                          </div>
                        </foreignObject>
                      </g>
                    );
                  })}
                </svg>
              </motion.div>

              {/* ── Mobile Vertical Circuit Timeline (Clean, readable fallback) ── */}
              <motion.div variants={fadeItem} className="lg:hidden relative pl-8">
                {/* Vertical gradient circuit line */}
                <div
                  className="absolute left-3 top-0 bottom-0 w-[3px] rounded-full"
                  style={{ background: 'linear-gradient(180deg, #38bdf8, #22d3ee, #34d399, #a855f7, #f43f5e, #f59e0b)' }}
                />

                <div className="flex flex-col gap-8">
                  {timelineMilestones.map((item, i) => (
                    <div key={i} className="relative flex flex-col gap-1.5 glass-card card-pop p-4 rounded-xl cursor-pointer">
                      {/* Node circle on the line */}
                      <div
                        className="absolute -left-[30px] top-4 w-[24px] h-[24px] rounded-full flex items-center justify-center"
                        style={{
                          background: '#030712',
                          border: `2px solid ${item.color}`,
                          boxShadow: `0 0 12px ${item.color}60`,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 13, color: item.color }}>
                          {item.icon}
                        </span>
                      </div>

                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: item.color }}>
                        {item.time}
                      </span>
                      <span
                        className="font-extrabold text-base text-slate-100"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {item.title}
                      </span>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#94a3b8' }}>
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.section>

          {/* ════════ COMMITTEE & DIRECTORS ════════ */}
          <motion.section
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.05 }}
            className="w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative"
            id="committee"
          >
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 30% at 50% 20%, rgba(56,189,248,0.02) 0%, transparent 70%)' }} />
            <div className="max-w-[1400px] mx-auto flex flex-col gap-10 sm:gap-14 relative z-10">
              <div className="flex flex-col items-center text-center gap-3">
                <motion.span variants={fadeItem} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#38bdf8', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                  Governance
                </motion.span>
                <motion.h2 variants={fadeItem} style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: '#f1f5f9', letterSpacing: '-0.03em' }}>
                  Committee & Directors
                </motion.h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {committeeMembers.map(p => (
                  <motion.div variants={popCard} key={p.name} className="glass-card card-pop rounded-2xl overflow-hidden flex flex-col cursor-pointer">
                    <div className="w-full h-48 overflow-hidden relative" style={{ background: '#0f172a' }}>
                      <img className="w-full h-full object-cover" src={p.img} alt={p.name} />
                      <div
                        className="absolute top-2 right-2 px-2 py-[3px] rounded-md"
                        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: '#38bdf8', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        {p.tag}
                      </div>
                    </div>
                    <div className="p-4 sm:p-5 flex flex-col gap-1.5 flex-1">
                      <h4 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>{p.name}</h4>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, color: '#38bdf8' }}>{p.role}</span>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#94a3b8', lineHeight: 1.6, flex: 1 }}>{p.desc}</p>
                      <div className="mt-auto pt-3 flex flex-col gap-1" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#475569' }}>
                        <span>{p.jurisdiction}</span>
                        <span style={{ color: '#64748b' }}>{p.email}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* ════════ CHIEF GUEST + PRIZES ════════ */}
          <motion.section
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.05 }}
            className="w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative"
            id="guests-prizes"
          >
            <div className="max-w-[1400px] mx-auto flex flex-col gap-12 sm:gap-16">

              {/* Distinguished Chief Guest */}
              <motion.div
                variants={popCard}
                className="glass-card card-pop rounded-3xl p-6 sm:p-8 lg:p-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12 cursor-pointer"
                style={{ boxShadow: '0 0 60px rgba(56,189,248,0.06), 0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)' }}
              >
                <div className="w-full lg:w-1/3 aspect-square max-w-[280px] rounded-2xl overflow-hidden relative shadow-2xl shrink-0" style={{ background: '#0f172a' }}>
                  <img
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKsMK2gO37tRi6vz-xV5zP992AbGuqGODzPjjoIYUOO87QT8Wq3yQnrMFtwOE9B1wu65BP5Azla_wO8U_7dbbnHZgFhYJCf3l8Jyds88PyMA9HNknXVqWhp3M3lGKEWrjgv7jD032rdjp52X5Td76OjYqm1mqWGcU8gSilqPfazr0p6I-1P3mBwHQzOp8tB9MjWrqbTmZIIF8Jszr6xbUIeI39dGFRCgHLvihSdPsy8vXaClRQ7Kzy"
                    alt="Chief Guest"
                  />
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg glass" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#38bdf8' }}>
                    KEYNOTE GUEST
                  </div>
                </div>
                <div className="flex flex-col gap-3 flex-1">
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#34d399', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                    Distinguished Chief Guest
                  </span>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', color: '#f1f5f9', letterSpacing: '-0.03em' }}>
                    Dr. Vikramaditya Sen
                  </h3>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: '#38bdf8' }}>
                    VP & Global AI Research Director · Ex-DeepMind Pioneer
                  </p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#94a3b8', lineHeight: 1.7 }}>
                    Leading international frontiers in decentralized autonomy and embodied machine agents. Dr. Sen will conduct live architectural evaluations during the final round.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    {[
                      { icon: 'verified', text: 'In-Person Judging', c: '#38bdf8' },
                      { icon: 'rocket_launch', text: 'Fast-Track Incubation', c: '#34d399' }
                    ].map(b => (
                      <div key={b.text} className="flex items-center gap-1.5" style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#e2e8f0' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 17, color: b.c }}>{b.icon}</span>
                        {b.text}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Cash Prizes */}
              <div className="flex flex-col gap-8">
                <div className="flex flex-col items-center text-center gap-2">
                  <motion.span variants={fadeItem} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#38bdf8', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                    Bounties & Recognition
                  </motion.span>
                  <motion.h3 variants={fadeItem} style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: '#f1f5f9', letterSpacing: '-0.03em' }}>
                    ₹1,00,000 Prize Pool
                  </motion.h3>
                  <motion.p variants={fadeItem} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#475569', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    Disbursed via instant direct bank transfer
                  </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Champion */}
                  <motion.div
                    variants={popCard}
                    className="glass-card card-pop rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-4 relative overflow-hidden order-1 md:order-2 border-cyan-400/30 cursor-pointer"
                    style={{ boxShadow: '0 0 60px rgba(56,189,248,0.12), 0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)' }}
                  >
                    <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-cyan-400/10 blur-2xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#38bdf8' }}>1ST · CHAMPION</span>
                        <span className="material-symbols-outlined" style={{ fontSize: 26, color: '#38bdf8' }}>trophy</span>
                      </div>
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 44, color: '#f1f5f9', letterSpacing: '-0.04em' }}>₹50,000</div>
                    </div>
                  </motion.div>

                  {/* Runner up */}
                  <motion.div variants={popCard} className="glass-card card-pop rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-3 order-2 md:order-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#cbd5e1' }}>2ND · RUNNER UP</span>
                      <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#cbd5e1' }}>military_tech</span>
                    </div>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 36, color: '#f1f5f9', letterSpacing: '-0.04em' }}>₹30,000</div>
                  </motion.div>

                  {/* Third */}
                  <motion.div variants={popCard} className="glass-card card-pop rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-3 order-3 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#fbbf24' }}>3RD · THIRD PLACE</span>
                      <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#fbbf24' }}>workspace_premium</span>
                    </div>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 36, color: '#f1f5f9', letterSpacing: '-0.04em' }}>₹20,000</div>
                  </motion.div>
                </div>

                {/* Certificate & Resume Enhancement Card */}
                <motion.div
                  variants={popCard}
                  className="glass-card card-pop rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-cyan-500/25 cursor-pointer relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.06) 0%, rgba(10, 15, 26, 0.8) 100%)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="absolute top-0 right-0 w-64 h-full bg-cyan-400/5 blur-3xl pointer-events-none" />
                  <div className="flex items-center gap-4 relative z-10 w-full sm:w-auto">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                      <span className="material-symbols-outlined text-2xl">workspace_premium</span>
                    </div>
                    <div className="flex flex-col gap-0.5 text-center sm:text-left">
                      <span
                        style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontWeight: 700,
                          fontSize: 'clamp(0.95rem, 1.8vw, 1.12rem)',
                          color: '#f8fafc',
                          lineHeight: 1.45,
                        }}
                      >
                        Enhance your resume by getting the winners&apos; and participation certificate from <span className="text-cyan-400 font-extrabold">VIT CHENNAI HOSTEL OFFICE</span>.
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 relative z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30">
                    <span className="relative w-2 h-2 rounded-full bg-emerald-400 live-dot" />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#38bdf8', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      OFFICIAL CERTIFICATE
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.section>

        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="w-full" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center"
                style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 12, color: '#030712' }}
              >
                S
              </div>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 13, color: '#64748b' }}>
                Solve-a-thon 2026-27 · VIT Chennai
              </span>
            </div>
            <div className="flex items-center gap-2" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#34d399' }}>
              <span className="w-[5px] h-[5px] rounded-full bg-emerald-400" />
              SYSTEMS OPERATIONAL
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex flex-col gap-1">
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: '#94a3b8' }}>
                Organized by Solve-a-thon Technical Committee & Student Guild
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#475569' }}>
                Direct Enquiries: operations@solvathon.org
              </p>
            </div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#334155' }}>
              © 2026 SOLVE-A-THON. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </footer>

      {/* ════════ PROBLEM STATEMENT DETAIL MODAL (SAME SIZE FOR ALL CARDS) ════════ */}
      {activeModalPS && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md transition-all duration-200"
          onClick={() => setActiveModalPS(null)}
        >
          {/* Bigger card: consistent uniform size for all cards */}
          <div 
            className="relative w-full max-w-[680px] h-[480px] sm:h-[500px] glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-cyan-500/35 shadow-[0_0_60px_rgba(56,189,248,0.2)] bg-[#0a0f1d]/95 backdrop-blur-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 45px rgba(56, 189, 248, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.12)' }}
          >
            {/* Top ambient aura */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-28 bg-cyan-500/10 blur-3xl pointer-events-none" />

            {/* Top Bar: Track Badge */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10 shrink-0">
              <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30">
                <span className="material-symbols-outlined text-cyan-400 text-lg">{activeModalPS.icon}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#38bdf8', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  {activeModalPS.track}
                </span>
              </div>
            </div>

            {/* Problem Statement Title at the Top */}
            <div className="pt-5 pb-3 relative z-10 shrink-0">
              <h3 
                style={{ 
                  fontFamily: "'Outfit', sans-serif", 
                  fontWeight: 800, 
                  fontSize: 'clamp(1.35rem, 2.5vw, 1.85rem)', 
                  lineHeight: 1.25,
                  color: '#f8fafc',
                  letterSpacing: '-0.02em'
                }}
              >
                {activeModalPS.title}
              </h3>
            </div>

            {/* Detailed Description Below It */}
            <div className="flex-1 overflow-y-auto pr-2 relative z-10 custom-scrollbar">
              <p 
                style={{ 
                  fontFamily: "'Inter', sans-serif", 
                  fontSize: 15, 
                  lineHeight: 1.75, 
                  color: '#cbd5e1' 
                }}
              >
                {activeModalPS.detailedDescription || activeModalPS.description}
              </p>
            </div>

            {/* Footer Row */}
            <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between relative z-10 shrink-0">
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#64748b', letterSpacing: '0.1em' }}>
                SOLVE-A-THON · VIT CHENNAI
              </span>
              <button
                type="button"
                onClick={() => setActiveModalPS(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400/50 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
