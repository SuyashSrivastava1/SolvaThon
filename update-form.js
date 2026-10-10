const fs = require('fs');

let rulesContent = fs.readFileSync('src/app/rules/page.tsx', 'utf8');

const oldFormStart = '<form className="flex flex-col gap-space-md"';
const oldFormEnd = '</form>';

const startIdx = rulesContent.indexOf(oldFormStart);
let endIdx = rulesContent.indexOf(oldFormEnd, startIdx);
if (endIdx !== -1) {
  endIdx += oldFormEnd.length;
}

const newForm = `
<form className="flex flex-col gap-space-md" onSubmit={(e) => { e.preventDefault(); alert('Individual Registration submitted successfully.'); }}>
  <div className="flex flex-col gap-1">
    <label className="font-label-sm text-label-sm text-on-surface-variant">FULL NAME</label>
    <input className="w-full bg-surface-container-lowest px-space-md py-2.5 rounded-lg text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. John Doe" required type="text"/>
  </div>
  
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
    <div className="flex flex-col gap-1">
      <label className="font-label-sm text-label-sm text-on-surface-variant">EMAIL ID (@vitstudent.ac.in)</label>
      <input className="w-full bg-surface-container-lowest px-space-md py-2.5 rounded-lg text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="name.regno@vitstudent.ac.in" required type="email" pattern=".*@vitstudent\\.ac\\.in$" title="Must be a valid @vitstudent.ac.in email"/>
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
        <option>Men's Block A</option>
        <option>Men's Block B</option>
        <option>Men's Block C</option>
        <option>Men's Block D</option>
        <option>Ladies' Block E</option>
        <option>Ladies' Block F</option>
        <option>Ladies' Block G</option>
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
        <option>PR Food</option>
        <option>Darling</option>
        <option>Zenith</option>
        <option>CRCL</option>
        <option>Foody's</option>
      </select>
    </div>
    <div className="flex flex-col gap-1">
      <label className="font-label-sm text-label-sm text-on-surface-variant">MESS TYPE</label>
      <select className="w-full bg-surface-container-lowest px-space-md py-2.5 rounded-lg text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary" required>
        <option value="">Select Mess Type</option>
        <option>Veg</option>
        <option>Non-Veg</option>
        <option>Special</option>
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
`;

if (startIdx !== -1 && endIdx > startIdx) {
  let newContent = rulesContent.substring(0, startIdx) + newForm + rulesContent.substring(endIdx);
  // Also change "Team Leader Intake • Slots Remaining: 52 / 200" to "Individual Intake"
  newContent = newContent.replace('Team Leader Intake • Slots Remaining: 52 / 200', 'Individual Intake • Slots Remaining: 148 / 200');
  
  // Fix the generic React DOM onsubmit error by making it onSubmit correctly if any was left
  newContent = newContent.replace(/onsubmit=/g, 'onSubmit=');
  
  fs.writeFileSync('src/app/rules/page.tsx', newContent);
  console.log('Form updated successfully.');
} else {
  console.log('Form not found.');
}
