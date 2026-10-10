const fs = require('fs');

let pageContent = fs.readFileSync('src/app/page.tsx', 'utf8');

// I will just locate the exact boundaries and replace the whole block to be 100% sure.
const startBoundary = '<div className="flex flex-col items-start mt-12 w-full select-none">';
const endBoundary = '</section>\n\n<section className="w-full px-gutter-mobile lg:px-gutter py-space-xl bg-surface-container-lowest/50" id="problems">';

// We know what the content inside SHOULD be.
const replacement = `
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

<section className="w-full px-gutter-mobile lg:px-gutter py-space-xl bg-surface-container-lowest/50" id="problems">`;

const startIdx = pageContent.indexOf(startBoundary);
const endIdx = pageContent.indexOf(endBoundary) + endBoundary.length;

if (startIdx !== -1 && endIdx > startIdx) {
  const newContent = pageContent.substring(0, startIdx) + replacement + pageContent.substring(endIdx);
  fs.writeFileSync('src/app/page.tsx', newContent);
  console.log('Fixed JSX structure completely.');
} else {
  console.log('Boundaries not found.');
}
