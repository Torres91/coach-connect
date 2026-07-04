'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/types';

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const preRole = (params.get('role') as UserRole) ?? null;

  const [role, setRole]         = useState<UserRole | null>(preRole);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) { setError('Please choose an account type.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    // Auto-login then go to profile setup
    await supabase.auth.signInWithPassword({ email, password });
    router.push(role === 'coach' ? '/coach/profile' : '/school/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm">C</div>
        <span className="font-extrabold text-lg text-gray-900">CoachConnect</span>
      </Link>

      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-gray-200/60 p-8">
        <h1 className="text-xl font-extrabold text-gray-900 mb-1">Create your account</h1>
        <p className="text-sm text-gray-500 mb-6">Free to start · No credit card</p>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {([
            { value: 'school', label: 'Head of Sport', icon: '🏫', sub: 'Post jobs & hire' },
            { value: 'coach',  label: 'Coach',         icon: '🏅', sub: 'Find coaching work' },
          ] as { value: UserRole; label: string; icon: string; sub: string }[]).map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`p-3 rounded-2xl border-2 text-left transition-all ${
                role === r.value
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="text-2xl mb-1">{r.icon}</div>
              <p className="text-xs font-extrabold text-gray-900">{r.label}</p>
              <p className="text-[10px] text-gray-500 font-medium">{r.sub}</p>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              {role === 'school' ? 'Your name' : 'Full name'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-sm px-3 py-2.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-green-400 font-semibold"
              placeholder={role === 'school' ? 'John Smith' : 'Jason Adams'}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full text-sm px-3 py-2.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-green-400 font-semibold"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Password</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full text-sm px-3 py-2.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-green-400 font-semibold"
              placeholder="8+ characters"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-xs font-semibold text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !role}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-extrabold text-sm rounded-xl disabled:opacity-40 transition-colors mt-2"
          >
            {loading ? 'Creating account…' : 'Create account →'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-green-600 font-bold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
