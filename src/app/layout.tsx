import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';

const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' });

export const metadata: Metadata = {
  title: 'CoachConnect — Sports Staffing for Schools',
  description: 'Connect qualified sports coaches, referees and officials with schools across South Africa.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="font-[family-name:var(--font-nunito)] bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
