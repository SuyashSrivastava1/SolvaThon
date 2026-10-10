const fs = require('fs');

let pageContent = fs.readFileSync('src/app/page.tsx', 'utf8');

// The block to remove (Hackathon Clock)
const oldTimerRegex = /<div className="bg-surface-container\/70 backdrop-blur-md p-space-md rounded-xl flex flex-col gap-space-sm">[\s\S]*?<\/div>\n<\/div>\n<\/div>/;

pageContent = pageContent.replace(oldTimerRegex, '');

// The block to insert the new Huge Timer
const buttonsEnd = 'Explore Problem Statements\n            </a>\n</div>';
const newTimerHtml = `
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
`;

pageContent = pageContent.replace(buttonsEnd, buttonsEnd + '\n' + newTimerHtml);

fs.writeFileSync('src/app/page.tsx', pageContent);
console.log('Timer updated.');
