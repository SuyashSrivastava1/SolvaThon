const fs = require('fs');

function fixJsx(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove duplicate closing tags for elements that were made self-closing
  content = content.replace(/<\/(path|circle|line|img|input|hr|br)>/g, '');

  // Fix SVG attributes
  content = content.replace(/viewbox=/g, 'viewBox=');
  content = content.replace(/stroke-linecap=/g, 'strokeLinecap=');
  content = content.replace(/stroke-width=/g, 'strokeWidth=');
  content = content.replace(/fill-opacity=/g, 'fillOpacity=');
  content = content.replace(/stroke-dasharray=/g, 'strokeDasharray=');

  fs.writeFileSync(filePath, content);
}

fixJsx('src/app/page.tsx');
fixJsx('src/app/register/page.tsx');
fixJsx('src/app/login/page.tsx');

console.log('JSX fixed.');
