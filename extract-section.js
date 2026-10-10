const fs = require('fs');

let pageContent = fs.readFileSync('src/app/page.tsx', 'utf8');

// Find the section by ID
const startString = '<section className="w-full px-gutter-mobile lg:px-gutter py-space-xl bg-surface-container-lowest/80" id="rules">';
const endString = '</section>';

const startIndex = pageContent.indexOf(startString);
if (startIndex !== -1) {
  // Find the matching end tag. Since there are no nested <section>s in this block, the next </section> is fine.
  const endIndex = pageContent.indexOf(endString, startIndex) + endString.length;
  
  const sectionContent = pageContent.substring(startIndex, endIndex);
  
  // Remove from pageContent
  pageContent = pageContent.substring(0, startIndex) + pageContent.substring(endIndex);
  
  // Change link in sticky footer from #register to /rules
  pageContent = pageContent.replace(/href="#register"/g, 'href="/rules"');
  
  fs.writeFileSync('src/app/page.tsx', pageContent);
  
  // Apply glassmorphism to sectionContent
  let glassSection = sectionContent;
  
  // Rules cards: bg-surface-container-low -> bg-surface-container-low/40 backdrop-blur-md border border-white/5
  glassSection = glassSection.replace(
    /bg-surface-container-low p-space-md/g, 
    'bg-surface-container-low/40 backdrop-blur-md border border-white/5 p-space-md'
  );
  
  // Registration card: bg-surface-container-low p-space-xl rounded-2xl shadow-2xl -> bg-surface-container-low/30 backdrop-blur-xl border border-white/10 p-space-xl rounded-2xl shadow-2xl
  glassSection = glassSection.replace(
    /bg-surface-container-low p-space-xl rounded-2xl shadow-2xl/g,
    'bg-surface-container-low/30 backdrop-blur-xl border border-white/10 p-space-xl rounded-2xl shadow-2xl'
  );

  // For the main section background: change from bg-surface-container-lowest/80 to maybe just add a min-height and proper padding for a standalone page
  glassSection = glassSection.replace(
    /<section className="w-full px-gutter-mobile lg:px-gutter py-space-xl bg-surface-container-lowest\/80" id="rules">/,
    '<div className="w-full min-h-screen px-gutter-mobile lg:px-gutter py-space-xl bg-surface-container-lowest flex items-center justify-center pt-32">'
  );
  glassSection = glassSection.replace(/<\/section>$/, '</div>');

  const rulesPageCode = `
import React from 'react';
import Link from 'next/link';

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
      ${glassSection}
    </>
  );
}
`;

  fs.mkdirSync('src/app/rules', { recursive: true });
  fs.writeFileSync('src/app/rules/page.tsx', rulesPageCode);
  console.log('Section extracted and glassmorphism applied.');
} else {
  console.log('Section not found.');
}
