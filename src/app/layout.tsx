import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { FirebaseProvider } from '@/components/providers/firebase-provider';
import { type FirebaseOptions } from 'firebase/app';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});


export const metadata: Metadata = {
  title: 'RFP CoPilot',
  description: 'An AI-powered assistant for RFP responses.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const firebaseConfig: FirebaseOptions | undefined = process.env.FIREBASE_CONFIG
    ? JSON.parse(process.env.FIREBASE_CONFIG)
    : undefined;

  return (
    <html lang="en" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning={true}>
        <FirebaseProvider firebaseConfig={firebaseConfig}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
