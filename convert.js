const fs = require('fs');

function htmlToJsx(html) {
  let jsx = html;

  // Replace class= with className=
  jsx = jsx.replace(/class=/g, 'className=');

  // Replace for= with htmlFor=
  jsx = jsx.replace(/for=/g, 'htmlFor=');

  // Close self-closing tags: img, input, hr, br, path, circle, line
  const selfClosingTags = ['img', 'input', 'hr', 'br', 'path', 'circle', 'line'];
  selfClosingTags.forEach(tag => {
    const regex = new RegExp(`<${tag}([^>]*?)(?<!/)>`, 'g');
    jsx = jsx.replace(regex, `<${tag}$1 />`);
  });

  // Remove <!-- comments -->
  jsx = jsx.replace(/<!--[\s\S]*?-->/g, '');

  // Extract body content
  const bodyMatch = jsx.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  if (bodyMatch && bodyMatch[1]) {
    jsx = bodyMatch[1];
  } else {
    // If no body tag, assume it's already a fragment
  }

  // Remove raw scripts
  jsx = jsx.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  return `<>\n${jsx}\n</>`;
}

const landingHtml = fs.readFileSync('stitch_ui/stitch_event_management_ui_platform/cyft_2025_event_portal/code.html', 'utf8');
const landingJsx = htmlToJsx(landingHtml);

const landingCode = `
import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    ${landingJsx}
  );
}
`;

fs.writeFileSync('src/app/page.tsx', landingCode);


const registerHtml = fs.readFileSync('stitch_ui/stitch_event_management_ui_platform/hostellite_registration_sign_up/code.html', 'utf8');
const registerJsx = htmlToJsx(registerHtml);

const registerCode = `
"use client";
import React, { useState } from 'react';
import Link from 'next/link';

export default function Register() {
  return (
    ${registerJsx}
  );
}
`;

fs.mkdirSync('src/app/register', { recursive: true });
fs.writeFileSync('src/app/register/page.tsx', registerCode);


const loginHtml = fs.readFileSync('stitch_ui/stitch_event_management_ui_platform/participant_admin_login/code.html', 'utf8');
const loginJsx = htmlToJsx(loginHtml);

const loginCode = `
import React from 'react';
import Link from 'next/link';

export default function Login() {
  return (
    ${loginJsx}
  );
}
`;

fs.mkdirSync('src/app/login', { recursive: true });
fs.writeFileSync('src/app/login/page.tsx', loginCode);

console.log('Conversion completed.');
