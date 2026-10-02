import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import NavigationProgressBar from '@/components/ui/NavigationProgressBar';
import { ThemeProvider } from '@/components/theme-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FitAI - Sports & Fitness Intelligence',
  description:
    'Modern minimalist fitness dashboard with Strava integration, manual workout logging, and Gemini AI performance analysis.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col items-center bg-zinc-200/70 dark:bg-[#050507] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-[#FC5200] selection:text-white transition-colors duration-200">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NavigationProgressBar />
          {/* Centered Mobile-First App Shell (Linear & Strava inspired) */}
          <div className="w-full max-w-md min-h-dvh flex flex-col bg-white dark:bg-[#0c0c0e] sm:border-x sm:border-zinc-200/90 sm:dark:border-zinc-800/80 sm:shadow-2xl relative">
            <Navbar />
            <main className="flex-1 w-full pb-[calc(5rem+env(safe-area-inset-bottom))]">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
