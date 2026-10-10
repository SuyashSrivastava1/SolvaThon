const fs = require('fs');
const content = fs.readFileSync('src/app/page.tsx', 'utf8');
const lines = content.split('\n');
let depth = 0;
for (let i = 9; i < 140; i++) {
  const line = lines[i];
  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  depth += opens - closes;
  console.log(`${i+1}: ${depth} ${line}`);
  if (line && line.includes('</section>')) break;
}
