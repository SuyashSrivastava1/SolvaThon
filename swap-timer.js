const fs = require('fs');

let pageContent = fs.readFileSync('src/app/page.tsx', 'utf8');

const containerStart = '<div className="lg:col-span-4 flex flex-col gap-space-md w-full">';

// Split at container start
const parts = pageContent.split(containerStart);

if (parts.length > 1) {
  // We need to parse out the two child divs. 
  // Let's use simple string finding since we know exactly what they look like.
  
  const div1StartStr = '<div className="bg-surface-container-low/90 backdrop-blur-xl p-space-lg rounded-xl shadow-xl flex flex-col gap-space-md">';
  const div2StartStr = '<div className="bg-surface-container/70 backdrop-blur-md p-space-md rounded-xl flex flex-col gap-space-sm">';
  
  const div2EndStr = '</div>\n</div>\n</div>\n\n<div className="grid grid-cols-2 md:grid-cols-4 gap-space-md pt-space-md">';

  // Since it's getting tricky with exact ending, let's just do a string replacement on the block we know.
  // I will just use regex to swap the two blocks.
  
  const block1Regex = /<div className="bg-surface-container-low\/90 backdrop-blur-xl[\s\S]*?<\/svg>\n<\/div>\n<\/div>/;
  const block2Regex = /<div className="bg-surface-container\/70 backdrop-blur-md[\s\S]*?<\/div>\n<\/div>\n<\/div>\n<\/div>/;

  const match1 = pageContent.match(block1Regex);
  const match2 = pageContent.match(block2Regex);

  if (match1 && match2) {
    let newContent = pageContent.replace(match1[0], '%%BLOCK2%%').replace(match2[0], '%%BLOCK1%%');
    newContent = newContent.replace('%%BLOCK2%%', match2[0]).replace('%%BLOCK1%%', match1[0]);
    fs.writeFileSync('src/app/page.tsx', newContent);
    console.log("Swapped successfully.");
  } else {
    console.log("Regex didn't match.");
  }
} else {
  console.log("Container not found.");
}
