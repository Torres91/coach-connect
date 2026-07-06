'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { SA_PROVINCES } from '@/types';

const input = 'w-full text-sm px-3 py-2.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-blue-400 font-semibold text-gray-900';

export default function SchoolProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');
  const [form, setForm] = useState({
    name:         '',
    contact_name: '',
    phone:        '',
    location:     '',
    province:     '',
  });

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: school } = await supabase
        .from('schools')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (school) {
        setForm({
          name:         school.name        ?? '',
          contact_name: school.contact_name ?? '',
          phone:        school.phone        ?? '',
          location:     school.location     ?? '',
          province:     school.province     ?? '',
        });
      }
      setLoading(false);
    })();
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('School name is required.'); return; }
    setSaving(true);
    setError('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: err } = await supabase
      .from('schools')
      .upsert({
        user_id:      user.id,
        name:         form.name,
        contact_name: form.contact_name || null,
        phone:        form.phone        || null,
        location:     form.location     || null,
        province:     form.province     || null,
      }, { onConflict: 'user_id' });

    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true);
    setTimeout(() => { setSaved(false); router.push('/school/dashboard'); }, 1000);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/school/dashboard" className="text-gray-400 hover:text-gray-700 text-sm font-bold">← Dashboard</Link>
        <span className="font-extrabold text-base text-gray-900">School profile</span>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-8">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h2 className="text-sm font-extrabold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center text-sm">🏫</span>
              School details
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">School name *</label>
                <input
                  className={input}
                  placeholder="e.g. Umhlanga Ridge Primary School"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Head of Sport / Contact name</label>
                <input
                  className={input}
                  placeholder="e.g. John Smith"
                  value={form.contact_name}
                  onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Contact number</label>
                <input
                  type="tel"
                  className={input}
                  placeholder="e.g. 071 234 5678"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h2 className="text-sm font-extrabold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center text-sm">📍</span>
              Location
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">City / Area</label>
                <input
                  className={input}
                  placeholder="e.g. Umhlanga"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Province</label>
                <select
                  className={`${input} bg-white`}
                  value={form.province}
                  onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
                >
                  <option value="">Select…</option>
                  {SA_PROVINCES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}
          {saved && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm font-bold text-green-700">
              ✅ Profile saved! Redirecting…
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !form.name.trim()}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl disabled:opacity-40 transition-colors shadow-md shadow-blue-200"
          >
            {saving ? 'Saving…' : 'Save profile →'}
          </button>
        </form>
      </div>
    </div>
  );
}
