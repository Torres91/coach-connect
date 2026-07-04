'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm">C</div>
        <span className="font-extrabold text-lg text-gray-900">CoachConnect</span>
      </Link>

      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-gray-200/60 p-8">
        <h1 className="text-xl font-extrabold text-gray-900 mb-1">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full text-sm px-3 py-2.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-green-400 font-semibold"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-xs font-semibold text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-extrabold text-sm rounded-xl disabled:opacity-40 transition-colors mt-2"
          >
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-5">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-green-600 font-bold hover:underline">Register free</Link>
        </p>
      </div>
    </div>
  );
}
