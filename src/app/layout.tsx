import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CYFT Hackathon 2025',
  description: 'The premier residential engineering hackathon.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-on-background min-h-screen selection:bg-primary-container selection:text-on-primary-container">
        {children}
      </body>
    </html>
  );
}
