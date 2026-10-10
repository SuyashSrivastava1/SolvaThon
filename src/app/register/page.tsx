
"use client";
import React, { useState } from 'react';
import Link from 'next/link';

export default function Register() {
  return (
    <>
<main className="w-full min-h-screen bg-background flex flex-col items-center justify-center"><div className="flex flex-col w-full">
<div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 overflow-hidden">

<div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>
<div className="absolute top-1/2 -right-48 w-[32rem] h-[32rem] bg-secondary-container/10 rounded-full blur-3xl pointer-events-none"></div>

<header className="relative mb-10 lg:mb-14">
<div className="flex flex-wrap items-center justify-between gap-4 mb-4">
<div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-surface-container-high">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
<span className="font-label-sm text-label-sm text-primary uppercase tracking-widest">CYFT.HACKATHON // 2025</span>
</div>
<div className="font-label-sm text-label-sm text-outline flex items-center gap-2">
<span>PORTAL_VER</span>
<span className="text-on-surface bg-surface-container-high px-2 py-0.5 rounded">v3.4.9-PROD</span>
</div>
</div>
<div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
<div>
<h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
            NEW PARTICIPANT REGISTRATION
          </h1>
<p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-2xl">
            Step 1 of 2: Individual Authentication &amp; Residential Eligibility Check
          </p>
</div>

<div className="w-full lg:w-72 p-4 rounded-xl bg-surface-container-low shadow-sm">
<div className="flex justify-between items-center mb-2">
<span className="font-label-sm text-label-sm text-outline">STAGE PROTOCOL</span>
<span className="font-label-sm text-label-sm text-primary">50% COMPLETED</span>
</div>
<div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
<div className="w-1/2 h-full bg-primary-container rounded-full transition-all duration-500"></div>
</div>
<div className="flex justify-between text-on-surface-variant mt-2 font-label-sm text-label-sm">
<span className="text-primary font-medium">01 ID AUTH</span>
<span className="text-outline">02 TEAM CONFIG</span>
</div>
</div>
</div>
</header>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

<main className="lg:col-span-8 flex flex-col gap-6">

<form className="p-6 sm:p-8 rounded-xl bg-surface-container-low shadow-xl flex flex-col gap-8" id="regForm" onsubmit="event.preventDefault(); handleRegistrationSubmit();">

<div className="flex flex-col gap-5">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="font-label-sm text-label-sm text-primary px-2 py-0.5 bg-surface-container-high rounded">SEC.01</span>
<span className="font-headline-sm text-headline-sm text-on-surface">Institutional Credentials</span>
</div>
<span className="font-label-sm text-label-sm text-outline tracking-wider">MANDATORY</span>
</div>

<div className="flex flex-col gap-1.5">
<label className="font-label-md text-label-md text-on-surface" htmlFor="studentEmail">
                Student Email Address <span className="text-error">*</span>
</label>
<div className="relative">
<input className="w-full px-4 py-3 bg-surface-container rounded text-on-surface placeholder:text-outline font-body-md text-body-md transition-all outline-none focus:bg-surface-container-high" id="studentEmail" name="email" oninput="validateEmail(this.value)" placeholder="john.doe2023@vitstudent.ac.in" required="" type="email"/>
<span className="material-symbols-outlined absolute right-3 top-3 text-outline transition-colors text-xl pointer-events-none" id="emailStatusIcon">
                  alternate_email
                </span>
</div>
<p className="font-body-sm text-body-sm text-outline flex items-center gap-1.5" id="emailHelper">
<span className="material-symbols-outlined text-sm">info</span>
                Must strictly end with <span className="font-label-sm text-label-sm text-primary">@vitstudent.ac.in</span>
</p>
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

<div className="flex flex-col gap-1.5">
<label className="font-label-md text-label-md text-on-surface" htmlFor="newPass">
                  Create New Password <span className="text-error">*</span>
</label>
<div className="relative">
<input className="w-full px-4 py-3 bg-surface-container rounded text-on-surface placeholder:text-outline font-body-md text-body-md outline-none focus:bg-surface-container-high" id="newPass" minlength="8" oninput="checkPasswordMatch()" placeholder="••••••••••••" required="" type="password"/>
<button className="absolute right-3 top-3 text-outline hover:text-on-surface" onclick="togglePassVisibility('newPass', this)" type="button">
<span className="material-symbols-outlined text-xl">visibility</span>
</button>
</div>
</div>

<div className="flex flex-col gap-1.5">
<label className="font-label-md text-label-md text-on-surface" htmlFor="confirmPass">
                  Confirm New Password <span className="text-error">*</span>
</label>
<div className="relative">
<input className="w-full px-4 py-3 bg-surface-container rounded text-on-surface placeholder:text-outline font-body-md text-body-md outline-none focus:bg-surface-container-high" id="confirmPass" oninput="checkPasswordMatch()" placeholder="••••••••••••" required="" type="password"/>
<button className="absolute right-3 top-3 text-outline hover:text-on-surface" onclick="togglePassVisibility('confirmPass', this)" type="button">
<span className="material-symbols-outlined text-xl">visibility</span>
</button>
</div>
</div>
</div>

<div className="p-3 rounded bg-surface-container hidden items-center justify-between" id="passwordMatchBanner">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-lg" id="matchIcon">check_circle</span>
<span className="font-label-sm text-label-sm" id="matchText">Passwords matched</span>
</div>
<span className="font-label-sm text-label-sm uppercase px-2 py-0.5 rounded" id="matchStatusTag">SYNC OK</span>
</div>
</div>

<div className="flex flex-col gap-4 pt-4">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="font-label-sm text-label-sm text-primary px-2 py-0.5 bg-surface-container-high rounded">SEC.02</span>
<span className="font-headline-sm text-headline-sm text-on-surface">Residential Verification Check</span>
</div>
<span className="font-label-sm text-label-sm text-tertiary">ELIGIBILITY GATE</span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant">
              Are you currently a Hostellite residing on campus?
            </p>

<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

<label className="cursor-pointer flex items-center justify-between p-4 rounded-xl bg-surface-container transition-all hover:bg-surface-container-high" id="optYesLabel">
<div className="flex items-center gap-3">
<input checked="" className="hidden" name="residency" onchange="handleResidencyChange('yes')" type="radio" value="yes"/>
<div className="w-4 h-4 rounded-full bg-primary-container flex items-center justify-center" id="radioYesIndicator">
<div className="w-1.5 h-1.5 rounded-full bg-on-primary-container"></div>
</div>
<div className="flex flex-col">
<span className="font-body-md text-body-md font-medium text-on-surface">Yes, I am a Hostellite</span>
<span className="font-label-sm text-label-sm text-outline">Verified Campus Inhabitant</span>
</div>
</div>
<span className="material-symbols-outlined text-primary text-xl">home_work</span>
</label>

<label className="cursor-pointer flex items-center justify-between p-4 rounded-xl bg-surface-container transition-all hover:bg-surface-container-high" id="optNoLabel">
<div className="flex items-center gap-3">
<input className="hidden" name="residency" onchange="handleResidencyChange('no')" type="radio" value="no"/>
<div className="w-4 h-4 rounded-full bg-surface-container-highest flex items-center justify-center" id="radioNoIndicator">
<div className="w-1.5 h-1.5 rounded-full bg-transparent"></div>
</div>
<div className="flex flex-col">
<span className="font-body-md text-body-md font-medium text-on-surface">No, Day Scholar / Non-Hostellite</span>
<span className="font-label-sm text-label-sm text-outline">Commuter / Outside Residence</span>
</div>
</div>
<span className="material-symbols-outlined text-outline text-xl">commute</span>
</label>
</div>

<div className="hidden p-5 rounded-xl bg-error-container text-on-error-container shadow-lg flex-col gap-3 transition-all animate-fade-in" id="nonHostelliteAlert">
<div className="flex items-start gap-3">
<span className="material-symbols-outlined text-2xl text-error shrink-0">warning</span>
<div className="flex flex-col gap-1">
<span className="font-headline-sm text-headline-sm font-bold text-on-error-container">
                    ⚠️ Access Restricted: Only hostellites are permitted to register for CYFT Hackathon 2025.
                  </span>
<p className="font-body-md text-body-md text-on-error-container opacity-90">
                    Non-hostellites and day scholars are not eligible for this residential hackathon. Due to 36-hour overnight security and physical access policies, participation is strictly limited to active hostel residents.
                  </p>
</div>
</div>
<div className="flex items-center justify-between pt-2">
<span className="font-label-sm text-label-sm text-on-error-container opacity-75">ERR_CODE: RESIDENTIAL_RESTRICTION_403</span>
<button className="px-3 py-1 bg-surface-dim text-error text-label-sm font-label-sm rounded hover:bg-surface-bright transition-colors" onclick="handleResidencyChange('yes')" type="button">
                  Switch to Hostellite
                </button>
</div>
</div>
</div>

<div className="flex flex-col gap-5 pt-4 transition-all" id="hostelliteFieldsContainer">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="font-label-sm text-label-sm text-primary px-2 py-0.5 bg-surface-container-high rounded">SEC.03</span>
<span className="font-headline-sm text-headline-sm text-on-surface">Campus Domicile Particulars</span>
</div>
<span className="font-label-sm text-label-sm text-tertiary">HOSTEL DB VETTING</span>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-5">

<div className="flex flex-col gap-1.5">
<label className="font-label-md text-label-md text-on-surface" htmlFor="hostelBlock">
                  Hostel Block <span className="text-error">*</span>
</label>
<div className="relative">
<select className="w-full px-4 py-3 bg-surface-container rounded text-on-surface font-body-md text-body-md outline-none focus:bg-surface-container-high appearance-none cursor-pointer" id="hostelBlock" onchange="validateFormCompletion()" required="">
<option disabled="" selected="" value="">Select assigned block</option>
<option value="Block A">Block A (Men's Residential)</option>
<option value="Block B">Block B (Men's Residential)</option>
<option value="Block C">Block C (Men's Residential)</option>
<option value="Block D">Block D (Men's Residential)</option>
<option value="Block E">Block E (Men's Residential)</option>
<option value="Block F">Block F (Men's Residential)</option>
<option value="Block G">Block G (Ladies' Residential)</option>
<option value="Block H">Block H (Ladies' Residential)</option>
<option value="Block J">Block J (Ladies' Residential)</option>
<option value="Block K">Block K (Ladies' Residential)</option>
<option value="Block L">Block L (Ladies' Residential)</option>
<option value="Block P">Block P (Executive Tower)</option>
</select>
<span className="material-symbols-outlined absolute right-3 top-3 text-outline pointer-events-none text-xl">
                    expand_more
                  </span>
</div>
</div>

<div className="flex flex-col gap-1.5">
<label className="font-label-md text-label-md text-on-surface" htmlFor="roomNumber">
                  Hostel Room Number <span className="text-error">*</span>
</label>
<div className="relative">
<input className="w-full px-4 py-3 bg-surface-container rounded text-on-surface placeholder:text-outline font-body-md text-body-md outline-none focus:bg-surface-container-high" id="roomNumber" oninput="validateFormCompletion()" placeholder="e.g. Room 412" required="" type="text"/>
<span className="material-symbols-outlined absolute right-3 top-3 text-outline pointer-events-none text-xl">
                    meeting_room
                  </span>
</div>
</div>
</div>

<div className="flex flex-col gap-1.5">
<label className="font-label-md text-label-md text-on-surface" htmlFor="messCaterer">
                Mess Caterer Assignment <span className="text-error">*</span>
</label>
<div className="relative">
<select className="w-full px-4 py-3 bg-surface-container rounded text-on-surface font-body-md text-body-md outline-none focus:bg-surface-container-high appearance-none cursor-pointer" id="messCaterer" onchange="validateFormCompletion()" required="">
<option disabled="" selected="" value="">Select registered mess caterer</option>
<option value="Special Mess - PR Caterers">Special Mess - PR Caterers</option>
<option value="Non-Veg Mess - Darling Caterers">Non-Veg Mess - Darling Caterers</option>
<option value="Veg Mess - CR Caterers">Veg Mess - CR Caterers</option>
<option value="Food Mall / Fusion Mess">Food Mall / Fusion Mess</option>
</select>
<span className="material-symbols-outlined absolute right-3 top-3 text-outline pointer-events-none text-xl">
                  restaurant
                </span>
</div>
<span className="font-body-sm text-body-sm text-outline">
                Mess registration will be cross-referenced with your official biometric meal card.
              </span>
</div>
</div>

<div className="p-4 rounded-xl bg-surface-container flex items-start gap-3.5">
<span className="material-symbols-outlined text-primary text-2xl shrink-0">info</span>
<div className="flex flex-col gap-0.5">
<span className="font-label-sm text-label-sm uppercase text-primary tracking-wide">Next Step Sequence</span>
<p className="font-body-md text-body-md text-on-surface-variant">
                After creating your verified hostellite account, you will proceed to configure your team (1 to 4 members) and select your Problem Statement.
              </p>
</div>
</div>

<div className="flex flex-col gap-3 pt-2">
<button className="w-full py-4 px-6 bg-primary-container text-on-primary-container font-headline-sm text-headline-sm font-semibold rounded-xl transition-all shadow-md hover:bg-primary disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2" id="submitBtn" type="submit">
<span>Verify Hostellite Status &amp; Continue</span>
<span className="material-symbols-outlined text-xl">arrow_forward</span>
</button>

<div className="flex items-center justify-center gap-1.5 pt-2">
<span className="font-body-md text-body-md text-on-surface-variant">Already registered?</span>
<a className="font-body-md text-body-md text-primary hover:underline font-medium" href="#">Sign In instead</a>
</div>
</div>
</form>
</main>

<aside className="lg:col-span-4 flex flex-col gap-6">

<div className="p-6 rounded-xl bg-surface-container-low shadow-md flex flex-col gap-4">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-outline">RESIDENCE PROTOCOL</span>
<span className="px-2 py-0.5 rounded bg-surface-container text-tertiary font-label-sm text-label-sm flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> ACTIVE
            </span>
</div>
<div className="relative w-full h-36 bg-surface-container rounded-lg overflow-hidden flex items-center justify-center">

<svg className="w-full h-full text-primary/20" fill="none" stroke="currentColor" viewBox="0 0 200 120">
<circle cx="100" cy="60" r="50" strokeDasharray="2 2" strokeWidth="0.75" />
<circle cx="100" cy="60" r="30" strokeWidth="0.75" />
<line strokeWidth="0.5" x1="100" x2="100" y1="0" y2="120" />
<line strokeWidth="0.5" x1="0" x2="200" y1="60" y2="60" />
<circle className="text-primary fill-primary" cx="115" cy="45" r="4" />
<circle className="text-tertiary fill-tertiary" cx="85" cy="75" r="3" />
</svg>
<div className="absolute bottom-3 left-3 bg-surface-dim/80 px-2 py-1 rounded font-label-sm text-label-sm text-primary">
              GEO: 12.9692° N, 79.1559° E
            </div>
</div>
<div className="flex flex-col gap-2">
<span className="font-headline-sm text-headline-sm text-on-surface">Vellore Campus Perimeter</span>
<p className="font-body-sm text-body-sm text-on-surface-variant">
              CYFT 2025 is an intensive residential hackathon requiring uninterrupted local physical presence across both days.
            </p>
</div>
</div>

<div className="p-6 rounded-xl bg-surface-container-low shadow-md flex flex-col gap-4">
<span className="font-label-sm text-label-sm text-outline">AUTHENTICATION CRITERIA</span>
<ul className="flex flex-col gap-3 font-body-sm text-body-sm text-on-surface-variant">
<li className="flex items-start gap-2.5">
<span className="material-symbols-outlined text-primary text-base mt-0.5">verified</span>
<span><strong>Email Match:</strong> Must match VIT student domain authentication token.</span>
</li>
<li className="flex items-start gap-2.5">
<span className="material-symbols-outlined text-primary text-base mt-0.5">verified</span>
<span><strong>Hostel Allotment:</strong> Active biometric profile in Block database.</span>
</li>
<li className="flex items-start gap-2.5">
<span className="material-symbols-outlined text-primary text-base mt-0.5">verified</span>
<span><strong>Mess Subscription:</strong> Valid caterer token for hackathon nutritional catering.</span>
</li>
</ul>
<div className="p-3 bg-surface-container rounded flex items-center justify-between">
<span className="font-label-sm text-label-sm text-outline">NEED EXEMPTION?</span>
<a className="font-label-sm text-label-sm text-primary hover:underline" href="#">Contact Warden Office →</a>
</div>
</div>

<div className="p-4 rounded-xl bg-surface-container-low shadow-sm flex items-center justify-between text-outline font-label-sm text-label-sm">
<span>ENCRYPTION: AES-256-GCM</span>
<span className="text-tertiary">SESSION VALID</span>
</div>
</aside>
</div>
</div>
</div>
</main>
</>
  );
}
