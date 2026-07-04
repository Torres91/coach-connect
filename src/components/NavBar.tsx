'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UserRole } from '@/types';

interface Props {
  role: UserRole;
  name: string;
  unreadCount?: number;
}

const COACH_NAV = [
  { href: '/coach/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/jobs',            label: 'Browse Jobs', icon: '📋' },
  { href: '/coach/profile',   label: 'My Profile', icon: '👤' },
  { href: '/messages',        label: 'Messages', icon: '💬' },
];

const SCHOOL_NAV = [
  { href: '/school/dashboard', label: 'Dashboard',    icon: '🏠' },
  { href: '/school/post-job',  label: 'Post Job',     icon: '➕' },
  { href: '/coaches',          label: 'Find Coaches', icon: '🔍' },
  { href: '/messages',         label: 'Messages',     icon: '💬' },
  { href: '/school/profile',   label: 'Settings',     icon: '⚙️' },
];

export default function NavBar({ role, name, unreadCount = 0 }: Props) {
  const pathname = usePathname();
  const nav = role === 'coach' ? COACH_NAV : SCHOOL_NAV;

  return (
    <>
      {/* Desktop top nav */}
      <header className="hidden sm:flex items-center justify-between bg-white border-b border-gray-100 px-6 py-3 sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center text-white font-extrabold text-xs">C</div>
          <span className="font-extrabold text-base text-gray-900">CoachConnect</span>
        </Link>
        <nav className="flex items-center gap-1">
          {nav.map(n => {
            const active = pathname === n.href || pathname.startsWith(n.href + '/');
            const isMsgs = n.href === '/messages';
            return (
              <Link key={n.href} href={n.href}
                className={`relative text-xs font-bold px-3 py-2 rounded-xl transition-colors ${
                  active ? 'bg-green-50 text-green-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}>
                {n.label}
                {isMsgs && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-500 truncate max-w-[140px]">{name}</span>
          <form action="/api/auth/signout" method="POST">
            <button className="text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-40">
        {nav.map(n => {
          const active = pathname === n.href || pathname.startsWith(n.href + '/');
          const isMsgs = n.href === '/messages';
          return (
            <Link key={n.href} href={n.href}
              className={`relative flex-1 flex flex-col items-center justify-center py-2.5 text-[10px] font-bold transition-colors ${
                active ? 'text-green-700' : 'text-gray-400'
              }`}>
              <span className="text-lg leading-none mb-0.5">{n.icon}</span>
              {n.label}
              {isMsgs && unreadCount > 0 && (
                <span className="absolute top-1.5 right-[calc(50%-14px)] bg-red-500 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
