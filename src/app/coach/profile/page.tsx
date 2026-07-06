'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SPORTS, SA_PROVINCES } from '@/types';
import type { CoachProfile } from '@/types';

const input = 'w-full text-sm px-3 py-2.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-green-400 font-semibold';
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

export default function CoachProfilePage() {
  const router  = useRouter();
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [profile,  setProfile]  = useState<Partial<CoachProfile>>({
    full_name:        '',
    bio:              '',
    location:         '',
    province:         '',
    sports:           [],
    experience_years: 0,
    hourly_rate:      null,
    available:        true,
    available_days:   [],
  });

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data } = await supabase.from('coach_profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (data) {
        setProfile(data);
      } else {
        const meta = user.user_metadata;
        setProfile(p => ({ ...p, full_name: meta?.full_name ?? '' }));
      }
      setLoading(false);
    })();
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile.full_name?.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const upsertData = {
      user_id:          user.id,
      full_name:        profile.full_name,
      bio:              profile.bio || null,
      location:         profile.location || null,
      province:         profile.province || null,
      sports:           profile.sports ?? [],
      experience_years: profile.experience_years ?? 0,
      hourly_rate:      profile.hourly_rate ?? null,
      available:        profile.available ?? true,
      available_days:   profile.available_days ?? [],
    };

    const { error } = await supabase
      .from('coach_profiles')
      .upsert(upsertData, { onConflict: 'user_id' });

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => router.push('/coach/dashboard'), 800);
    }
  }

  function toggleDay(day: string) {
    setProfile(p => ({
      ...p,
      available_days: (p.available_days ?? []).includes(day)
        ? (p.available_days ?? []).filter(d => d !== day)
        : [...(p.available_days ?? []), day],
    }));
  }

  function toggleSport(sport: string) {
    setProfile(p => ({
      ...p,
      sports: (p.sports ?? []).includes(sport)
        ? (p.sports ?? []).filter(s => s !== sport)
        : [...(p.sports ?? []), sport],
    }));
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3 sticky top-0 z-10">
        <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center text-white font-extrabold text-xs">C</div>
        <span className="font-extrabold text-base text-gray-900">CoachConnect</span>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">Set up your coach profile</h1>
          <p className="text-sm text-gray-500 mt-1">Schools will see this when browsing for coaches.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Basic info */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h2 className="text-sm font-extrabold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center text-sm">👤</span>
              About you
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Full name *</label>
                <input className={input} value={profile.full_name ?? ''}
                  onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Short bio</label>
                <textarea
                  className={`${input} resize-none min-h-[80px]`}
                  placeholder="e.g. Qualified soccer coach with 8 years experience coaching U8–U12…"
                  value={profile.bio ?? ''}
                  onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">City / Area</label>
                  <input className={input} placeholder="e.g. Umhlanga"
                    value={profile.location ?? ''}
                    onChange={e => setProfile(p => ({ ...p, location: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Province</label>
                  <select className={`${input} bg-white`} value={profile.province ?? ''}
                    onChange={e => setProfile(p => ({ ...p, province: e.target.value }))}>
                    <option value="">Select…</option>
                    {SA_PROVINCES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Years experience</label>
                  <input type="number" min={0} max={40} className={input}
                    value={profile.experience_years ?? 0}
                    onChange={e => setProfile(p => ({ ...p, experience_years: parseInt(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Hourly rate (R)</label>
                  <input type="number" min={0} className={input} placeholder="e.g. 200"
                    value={profile.hourly_rate ?? ''}
                    onChange={e => setProfile(p => ({ ...p, hourly_rate: e.target.value ? parseInt(e.target.value) : null }))} />
                </div>
              </div>
            </div>
          </div>

          {/* Sports */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h2 className="text-sm font-extrabold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center text-sm">⚽</span>
              Sports you coach *
            </h2>
            <div className="flex flex-wrap gap-2">
              {SPORTS.map(sport => {
                const selected = (profile.sports ?? []).includes(sport);
                return (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => toggleSport(sport)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border-2 transition-all ${
                      selected ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 text-gray-600 hover:border-gray-200'
                    }`}
                  >
                    {selected ? '✓ ' : ''}{sport}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-extrabold text-gray-800">Available for bookings</p>
                <p className="text-xs text-gray-500 mt-0.5">Schools can only see and contact available coaches.</p>
              </div>
              <button
                type="button"
                onClick={() => setProfile(p => ({ ...p, available: !p.available }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${profile.available ? 'bg-green-500' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${profile.available ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Days available</p>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => {
                  const active = (profile.available_days ?? []).includes(day);
                  return (
                    <button key={day} type="button" onClick={() => toggleDay(day)}
                      className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border-2 transition-all ${active ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {saved && (
            <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-sm font-bold text-green-700">
              ✅ Profile saved! Redirecting…
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !profile.full_name?.trim() || (profile.sports ?? []).length === 0}
            className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-extrabold text-sm rounded-xl disabled:opacity-40 transition-colors shadow-md shadow-green-200"
          >
            {saving ? 'Saving…' : 'Save profile & continue →'}
          </button>
        </form>
      </div>
    </div>
  );
}
