import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Book Illustration Studio — Gradion Assessment',
  description: 'Turn a book text into character portraits and chapter illustrations using Gemini API',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
