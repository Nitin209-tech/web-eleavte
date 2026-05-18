import React from 'react';
import './globals.css';
import { AppProvider } from '@/components/AppContext';

export const metadata = {
  title: 'Riwaayat | Cyber Gaming Community Hub',
  description: 'Synchronize credentials, invite advocates, and redeem secure premium code packages.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
