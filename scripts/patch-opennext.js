const fs = require('fs');
const path = require('path');

const targetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  '@opennextjs',
  'cloudflare',
  'dist',
  'cli',
  'build',
  'patches',
  'plugins',
  'load-manifest.js'
);

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  const needle = 'throw new Error(\\`Unexpected loadManifest(\\${$PATH}) call!\\`);';
  if (content.includes(needle)) {
    content = content.replace(needle, 'return {};');
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('✓ Successfully patched @opennextjs/cloudflare load-manifest for Next.js 16');
  } else {
    console.log('• @opennextjs/cloudflare already patched or string not found.');
  }
} else {
  console.log('• target file not found, skipping patch.');
}
