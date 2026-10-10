import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CYFT Hackathon 2025',
  description: 'The premier residential engineering hackathon.',
};

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body className="bg-background text-on-background min-h-screen selection:bg-primary-container selection:text-on-primary-container">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
