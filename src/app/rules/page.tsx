"use client";
import React from 'react';
import Link from 'next/link';
import blocksData from '@/data/blocks.json';
import caterersData from '@/data/caterers.json';
import messTypesData from '@/data/messTypes.json';

export default function RulesPage() {
  return (
    <>
      <header className="w-full border-b border-surface-container-low bg-surface-container-lowest/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-gutter-mobile lg:px-gutter h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-space-xs">
            <span className="font-headline-sm text-body-lg font-bold text-on-surface tracking-tight">CYFT // <span className="text-primary">HACK 2025</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-space-lg">
            <Link className="font-label-md text-label-md text-outline hover:text-on-surface transition-colors" href="/">Home</Link>
          </nav>
        </div>
      </header>
      <div className="w-full min-h-screen px-gutter-mobile lg:px-gutter py-space-xl bg-surface-container-lowest flex items-center justify-center pt-32">
<div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center">

<div className="w-full bg-surface-container-low/30 backdrop-blur-xl border border-white/10 p-space-xl rounded-2xl shadow-2xl flex flex-col gap-space-lg relative" id="register">
<div className="flex items-center justify-between pb-space-xs">
<div>
<h3 className="font-headline-md text-headline-md text-on-surface">Hostellite Registration</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant">Individual Intake • Slots Remaining: 148 / 200</p>
</div>
<span className="px-space-xs py-1 rounded bg-tertiary/10 text-tertiary font-label-sm text-label-sm font-semibold">GATEWAY ACTIVE</span>
</div>

<form className="flex flex-col gap-space-md" onSubmit={(e) => { e.preventDefault(); alert('Individual Registration submitted successfully.'); }}>
  <div className="flex flex-col gap-1">
    <label className="font-label-sm text-label-sm text-on-surface-variant">FULL NAME</label>
    <input className="w-full bg-surface-container-lowest px-space-md py-2.5 rounded-lg text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. John Doe" required type="text"/>
  </div>
  
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
    <div className="flex flex-col gap-1">
      <label className="font-label-sm text-label-sm text-on-surface-variant">EMAIL ID (@vitstudent.ac.in)</label>
      <input className="w-full bg-surface-container-lowest px-space-md py-2.5 rounded-lg text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="name.regno@vitstudent.ac.in" required type="email" pattern=".*@vitstudent\.ac\.in$" title="Must be a valid @vitstudent.ac.in email"/>
    </div>
    <div className="flex flex-col gap-1">
      <label className="font-label-sm text-label-sm text-on-surface-variant">MOBILE NUMBER</label>
      <input className="w-full bg-surface-container-lowest px-space-md py-2.5 rounded-lg text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. 9876543210" required type="tel"/>
    </div>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
    <div className="flex flex-col gap-1">
      <label className="font-label-sm text-label-sm text-on-surface-variant">RESIDENTIAL HOSTEL BLOCK</label>
      <select className="w-full bg-surface-container-lowest px-space-md py-2.5 rounded-lg text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary" required>
        <option value="">Select Block</option>
        {blocksData.map((block) => (
          <option key={block.id} value={block.label}>{block.label}</option>
        ))}
      </select>
    </div>
    <div className="flex flex-col gap-1">
      <label className="font-label-sm text-label-sm text-on-surface-variant">ROOM NUMBER</label>
      <input className="w-full bg-surface-container-lowest px-space-md py-2.5 rounded-lg text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. 412" required type="text"/>
    </div>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
    <div className="flex flex-col gap-1">
      <label className="font-label-sm text-label-sm text-on-surface-variant">MESS CATERER</label>
      <select className="w-full bg-surface-container-lowest px-space-md py-2.5 rounded-lg text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary" required>
        <option value="">Select Caterer</option>
        {caterersData.map((caterer) => (
          <option key={caterer.id} value={caterer.label}>{caterer.label}</option>
        ))}
      </select>
    </div>
    <div className="flex flex-col gap-1">
      <label className="font-label-sm text-label-sm text-on-surface-variant">MESS TYPE</label>
      <select className="w-full bg-surface-container-lowest px-space-md py-2.5 rounded-lg text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary" required>
        <option value="">Select Mess Type</option>
        {messTypesData.map((type) => (
          <option key={type.id} value={type.label}>{type.label}</option>
        ))}
      </select>
    </div>
  </div>

  <div className="flex items-start gap-space-xs pt-space-xs">
    <input className="mt-1" id="rules-agree" required type="checkbox"/>
    <label className="font-body-sm text-body-sm text-outline" htmlFor="rules-agree">
      I certify that I am an active VIT hostel resident and will comply with night-time biometric reporting directives.
    </label>
  </div>
  
  <button className="w-full mt-space-sm py-3.5 rounded-lg bg-primary-container text-on-primary-container font-headline-sm text-body-md font-bold shadow-[0_0_24px_rgba(56,189,248,0.25)] hover:bg-secondary-container hover:text-on-secondary transition-all" type="submit">
    Submit Individual Registration
  </button>
</form>

</div>
</div>
</div>
    </>
  );
}
