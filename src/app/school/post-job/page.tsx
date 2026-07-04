'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { SPORTS, AGE_GROUPS } from '@/types';

const input = 'w-full text-sm px-3 py-2.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-blue-400 font-semibold';

export default function PostJobPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [form, setForm] = useState({
    title:          '',
    sport:          '',
    date:           '',
    time:           '',
    duration_hours: '',
    age_group:      '',
    pay:            '',
    notes:          '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.sport) { setError('Title and sport are required.'); return; }
    setSaving(true);
    setError('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: school } = await supabase
      .from('schools').select('id').eq('user_id', user.id).single();

    if (!school) { setError('School profile not found. Please contact support.'); setSaving(false); return; }

    const { error: err } = await supabase.from('jobs').insert({
      school_id:      school.id,
      title:          form.title,
      sport:          form.sport,
      date:           form.date     || null,
      time:           form.time     || null,
      duration_hours: form.duration_hours ? parseFloat(form.duration_hours) : null,
      age_group:      form.age_group || null,
      pay:            form.pay      ? parseInt(form.pay)   : null,
      notes:          form.notes    || null,
      status:         'open',
    });

    if (err) { setError(err.message); setSaving(false); return; }
    router.push('/school/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/school/dashboard" className="text-gray-400 hover:text-gray-700 text-sm font-bold">← Back</Link>
        <span className="font-extrabold text-base text-gray-900">Post a job</span>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Core details */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h2 className="text-sm font-extrabold text-gray-800 mb-4">Job details</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Job title *</label>
                <input className={input} placeholder="e.g. U10 Soccer Coach — Saturday Fixture"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Sport *</label>
                  <select className={`${input} bg-white`} value={form.sport}
                    onChange={e => setForm(f => ({ ...f, sport: e.target.value }))} required>
                    <option value="">Select sport…</option>
                    {SPORTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Age group</label>
                  <select className={`${input} bg-white`} value={form.age_group}
                    onChange={e => setForm(f => ({ ...f, age_group: e.target.value }))}>
                    <option value="">Any</option>
                    {AGE_GROUPS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h2 className="text-sm font-extrabold text-gray-800 mb-4">Schedule</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Date</label>
                <input type="date" className={input} value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Start time</label>
                <input type="time" className={input} value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Duration (hours)</label>
                <input type="number" min={0.5} max={8} step={0.5} className={input}
                  placeholder="e.g. 2"
                  value={form.duration_hours}
                  onChange={e => setForm(f => ({ ...f, duration_hours: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Pay (R)</label>
                <input type="number" min={0} className={input} placeholder="e.g. 500"
                  value={form.pay}
                  onChange={e => setForm(f => ({ ...f, pay: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Additional notes (optional)</label>
            <textarea
              className={`${input} resize-none min-h-[80px]`}
              placeholder="Qualifications required, transport, equipment, special instructions…"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl disabled:opacity-40 transition-colors shadow-md shadow-blue-200"
          >
            {saving ? 'Posting…' : 'Post job →'}
          </button>
        </form>
      </div>
    </div>
  );
}
