'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { SPORTS, AGE_GROUPS } from '@/types';
import { formatZAR, generateSessionDates } from '@/lib/utils';

const inp = 'w-full text-sm px-3 py-2.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-blue-400 font-semibold bg-white';

const ROLES   = ['Coach', 'Referee', 'Official', 'Trainer'];
const DAYS    = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const PERIODS = ['session','hour','week','month'] as const;

const SA_TERMS: Record<number, { start: string; end: string; label: string }> = {
  1: { start: '2026-01-14', end: '2026-03-27', label: 'Term 1 — Jan to Mar 2026' },
  2: { start: '2026-04-14', end: '2026-06-26', label: 'Term 2 — Apr to Jun 2026' },
  3: { start: '2026-07-14', end: '2026-09-18', label: 'Term 3 — Jul to Sep 2026' },
  4: { start: '2026-10-05', end: '2026-11-27', label: 'Term 4 — Oct to Nov 2026' },
};

type BookingType = 'single' | 'recurring' | 'term';
type Period = typeof PERIODS[number];

interface Draft {
  // Step 1
  sport: string;
  role: string;
  age_group: string;
  num_required: number;
  // Step 2
  booking_type: BookingType;
  single_date: string;
  start_date: string;
  end_date: string;
  term_number: number;
  days_of_week: string[];
  time_start: string;
  time_end: string;
  // Step 3
  req_first_aid: boolean;
  req_police_clearance: boolean;
  req_transport: boolean;
  req_coaching_badge: boolean;
  req_experience_years: number;
  // Step 4
  budget_amount: string;
  budget_period: Period;
  notes: string;
}

const INIT: Draft = {
  sport: '', role: 'Coach', age_group: '', num_required: 1,
  booking_type: 'single', single_date: '', start_date: '', end_date: '',
  term_number: 3, days_of_week: [], time_start: '', time_end: '',
  req_first_aid: false, req_police_clearance: false,
  req_transport: false, req_coaching_badge: false, req_experience_years: 0,
  budget_amount: '', budget_period: 'session', notes: '',
};

function buildTitle(d: Draft): string {
  const role = d.role !== 'Coach' ? d.role : 'Coach';
  const age  = d.age_group ? ` ${d.age_group}` : '';
  if (d.booking_type === 'single')    return `${d.sport}${age} ${role} — ${d.single_date || 'One-off'}`;
  if (d.booking_type === 'term')      return `${d.sport}${age} ${role} — ${SA_TERMS[d.term_number]?.label ?? 'Term'}`;
  const days = d.days_of_week.slice(0, 2).join(' & ');
  return `${d.sport}${age} ${role} — ${days || 'Recurring'}`;
}

function previewSessions(d: Draft): string[] {
  if (d.booking_type === 'single') return d.single_date ? [d.single_date] : [];
  const term = SA_TERMS[d.term_number];
  const start = d.booking_type === 'term' ? (d.start_date || term.start) : d.start_date;
  const end   = d.booking_type === 'term' ? (d.end_date   || term.end)   : d.end_date;
  if (!start || !end || d.days_of_week.length === 0) return [];
  return generateSessionDates(start, end, d.days_of_week);
}

export default function PostJobPage() {
  const router = useRouter();
  const [step,   setStep]   = useState(1);
  const [draft,  setDraft]  = useState<Draft>(INIT);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (patch: Partial<Draft>) => setDraft(d => ({ ...d, ...patch }));
  const sessions = previewSessions(draft);

  function toggleDay(day: string) {
    set({ days_of_week: draft.days_of_week.includes(day)
      ? draft.days_of_week.filter(d => d !== day)
      : [...draft.days_of_week, day] });
  }

  function onTermChange(n: number) {
    const t = SA_TERMS[n];
    set({ term_number: n, start_date: t.start, end_date: t.end });
  }

  function canAdvance(): boolean {
    if (step === 1) return !!draft.sport;
    if (step === 2) {
      if (draft.booking_type === 'single')    return !!draft.single_date && !!draft.time_start;
      if (draft.booking_type === 'recurring') return !!draft.start_date && !!draft.end_date && draft.days_of_week.length > 0 && !!draft.time_start;
      if (draft.booking_type === 'term')      return draft.days_of_week.length > 0 && !!draft.time_start;
    }
    if (step === 3) return true;
    if (step === 4) return !!draft.budget_amount;
    return true;
  }

  async function submit() {
    setSaving(true);
    setError('');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data: school } = await supabase.from('schools').select('id').eq('user_id', user.id).single();
    if (!school) { setError('School profile not found.'); setSaving(false); return; }

    const term  = SA_TERMS[draft.term_number];
    const startDate = draft.booking_type === 'term'
      ? (draft.start_date || term.start)
      : (draft.booking_type === 'single' ? draft.single_date : draft.start_date);
    const endDate = draft.booking_type === 'term'
      ? (draft.end_date || term.end)
      : (draft.booking_type === 'single' ? draft.single_date : draft.end_date);

    const totalPay = sessions.length * (parseInt(draft.budget_amount) || 0);

    const { data: job, error: jobErr } = await supabase.from('jobs').insert({
      school_id:            school.id,
      title:                buildTitle(draft),
      sport:                draft.sport,
      age_group:            draft.age_group || null,
      status:               'open',
      booking_type:         draft.booking_type,
      role:                 draft.role,
      num_required:         draft.num_required,
      start_date:           startDate || null,
      end_date:             endDate   || null,
      term_number:          draft.booking_type === 'term' ? draft.term_number : null,
      days_of_week:         draft.booking_type === 'single' ? [] : draft.days_of_week,
      time_start:           draft.time_start || null,
      time_end:             draft.time_end   || null,
      date:                 draft.booking_type === 'single' ? draft.single_date : startDate || null,
      time:                 draft.time_start  || null,
      req_first_aid:        draft.req_first_aid,
      req_police_clearance: draft.req_police_clearance,
      req_transport:        draft.req_transport,
      req_coaching_badge:   draft.req_coaching_badge,
      req_experience_years: draft.req_experience_years,
      budget_amount:        parseInt(draft.budget_amount) || null,
      budget_period:        draft.budget_period,
      pay:                  draft.budget_period === 'session' && sessions.length > 0 ? totalPay : parseInt(draft.budget_amount) || null,
      notes:                draft.notes || null,
    }).select().single();

    if (jobErr || !job) { setError(jobErr?.message ?? 'Failed to post.'); setSaving(false); return; }

    // Generate sessions
    if (sessions.length > 0) {
      await supabase.from('sessions').insert(
        sessions.map(date => ({
          job_id:     job.id,
          date,
          time_start: draft.time_start || null,
          time_end:   draft.time_end   || null,
        }))
      );
    }

    router.push('/school/dashboard');
  }

  const pill    = (active: boolean) => `text-xs font-extrabold px-4 py-2.5 rounded-xl border-2 transition-all ${active ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`;
  const dayPill = (active: boolean) => `text-xs font-extrabold px-3 py-2 rounded-xl border-2 transition-all ${active ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`;
  const reqBox  = (active: boolean) => `flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${active ? 'border-green-400 bg-green-50' : 'border-gray-100 hover:border-gray-200'}`;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/school/dashboard" className="text-gray-400 hover:text-gray-700 text-sm font-bold">← Back</Link>
        <span className="font-extrabold text-base text-gray-900">Post a booking</span>
        <div className="ml-auto flex gap-1">
          {[1,2,3,4,5].map(n => (
            <div key={n} className={`w-6 h-1.5 rounded-full ${n <= step ? 'bg-blue-500' : 'bg-gray-100'}`} />
          ))}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-6 space-y-4">

        {/* ── Step 1: What ── */}
        {step === 1 && (
          <>
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h2 className="text-base font-extrabold text-gray-900 mb-1">What do you need?</h2>
              <p className="text-xs text-gray-400 mb-5">Tell us the sport, role and age group.</p>

              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Sport *</label>
                <div className="flex flex-wrap gap-2">
                  {SPORTS.map(s => (
                    <button key={s} type="button" onClick={() => set({ sport: s })}
                      className={pill(draft.sport === s)}>{s}</button>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Role</label>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map(r => (
                    <button key={r} type="button" onClick={() => set({ role: r })}
                      className={pill(draft.role === r)}>{r}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Age group</label>
                  <select className={inp} value={draft.age_group} onChange={e => set({ age_group: e.target.value })}>
                    <option value="">Any</option>
                    {AGE_GROUPS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Coaches needed</label>
                  <select className={inp} value={draft.num_required} onChange={e => set({ num_required: parseInt(e.target.value) })}>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} {n === 1 ? 'coach' : 'coaches'}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Step 2: When ── */}
        {step === 2 && (
          <>
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h2 className="text-base font-extrabold text-gray-900 mb-1">When?</h2>
              <p className="text-xs text-gray-400 mb-5">Choose how the sessions repeat.</p>

              <div className="grid grid-cols-3 gap-2 mb-6">
                {([
                  { type: 'single',    icon: '📌', label: 'Single Session',     desc: 'One-off fixture or clinic' },
                  { type: 'recurring', icon: '🔁', label: 'Recurring Schedule', desc: 'Weekly until an end date' },
                  { type: 'term',      icon: '📚', label: 'Full Term',          desc: 'Linked to a school term' },
                ] as { type: BookingType; icon: string; label: string; desc: string }[]).map(({ type, icon, label, desc }) => (
                  <button key={type} type="button" onClick={() => set({ booking_type: type })}
                    className={`p-3 rounded-2xl border-2 text-left transition-all ${draft.booking_type === type ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <div className="text-xl mb-1">{icon}</div>
                    <p className={`text-xs font-extrabold ${draft.booking_type === type ? 'text-blue-700' : 'text-gray-700'}`}>{label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{desc}</p>
                  </button>
                ))}
              </div>

              {/* Single */}
              {draft.booking_type === 'single' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Date *</label>
                    <input type="date" className={inp} value={draft.single_date} onChange={e => set({ single_date: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 col-span-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Start time *</label>
                      <input type="time" className={inp} value={draft.time_start} onChange={e => set({ time_start: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">End time</label>
                      <input type="time" className={inp} value={draft.time_end} onChange={e => set({ time_end: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}

              {/* Recurring */}
              {draft.booking_type === 'recurring' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Start *</label>
                      <input type="date" className={inp} value={draft.start_date} onChange={e => set({ start_date: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">End *</label>
                      <input type="date" className={inp} value={draft.end_date} onChange={e => set({ end_date: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Repeat on *</label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map(d => (
                        <button key={d} type="button" onClick={() => toggleDay(d)} className={dayPill(draft.days_of_week.includes(d))}>
                          {d.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Start time *</label>
                      <input type="time" className={inp} value={draft.time_start} onChange={e => set({ time_start: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">End time</label>
                      <input type="time" className={inp} value={draft.time_end} onChange={e => set({ time_end: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}

              {/* Term */}
              {draft.booking_type === 'term' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Term</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(SA_TERMS).map(([n, t]) => (
                        <button key={n} type="button" onClick={() => onTermChange(Number(n))}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${draft.term_number === Number(n) ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                          <p className={`text-xs font-extrabold ${draft.term_number === Number(n) ? 'text-blue-700' : 'text-gray-700'}`}>{t.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Every *</label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map(d => (
                        <button key={d} type="button" onClick={() => toggleDay(d)} className={dayPill(draft.days_of_week.includes(d))}>
                          {d.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Start time *</label>
                      <input type="time" className={inp} value={draft.time_start} onChange={e => set({ time_start: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">End time</label>
                      <input type="time" className={inp} value={draft.time_end} onChange={e => set({ time_end: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Session preview */}
            {sessions.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
                <p className="text-xs font-extrabold text-green-700 mb-1">
                  ✅ {sessions.length} session{sessions.length !== 1 ? 's' : ''} will be created
                </p>
                <p className="text-xs text-green-600">
                  {sessions.slice(0, 3).join(', ')}{sessions.length > 3 ? ` … +${sessions.length - 3} more` : ''}
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Step 3: Requirements ── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h2 className="text-base font-extrabold text-gray-900 mb-1">Requirements</h2>
            <p className="text-xs text-gray-400 mb-5">These are used to filter and score coaches. All optional.</p>

            <div className="space-y-2 mb-5">
              {([
                { key: 'req_first_aid',        label: 'First Aid certificate',    icon: '🩺' },
                { key: 'req_police_clearance', label: 'Police clearance (SAPS)',  icon: '📋' },
                { key: 'req_transport',        label: 'Own transport',            icon: '🚗' },
                { key: 'req_coaching_badge',   label: 'Coaching badge (SAFA etc)', icon: '🏅' },
              ] as { key: keyof Draft; label: string; icon: string }[]).map(({ key, label, icon }) => (
                <label key={key} className={reqBox(draft[key] as boolean)}
                  onClick={() => set({ [key]: !draft[key] } as Partial<Draft>)}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${draft[key] ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                    {draft[key] && <span className="text-white text-[10px] font-extrabold">✓</span>}
                  </div>
                  <span className="text-lg">{icon}</span>
                  <span className="text-sm font-semibold text-gray-700">{label}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Minimum experience</label>
              <select className={inp} value={draft.req_experience_years}
                onChange={e => set({ req_experience_years: parseInt(e.target.value) })}>
                <option value={0}>No minimum</option>
                {[1,2,3,5,8,10].map(y => <option key={y} value={y}>{y}+ years</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ── Step 4: Budget ── */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h2 className="text-base font-extrabold text-gray-900 mb-1">Budget</h2>
              <p className="text-xs text-gray-400 mb-5">What will you pay?</p>

              <div className="flex gap-3 items-end mb-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Amount (R) *</label>
                  <input type="number" min={0} className={inp} placeholder="e.g. 350"
                    value={draft.budget_amount} onChange={e => set({ budget_amount: e.target.value })} />
                </div>
                <div className="shrink-0 pb-0.5 text-sm font-bold text-gray-400">per</div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Per</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {PERIODS.map(p => (
                      <button key={p} type="button" onClick={() => set({ budget_period: p })}
                        className={`text-xs font-extrabold px-3 py-2 rounded-xl border-2 transition-all capitalize ${draft.budget_period === p ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-500'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {draft.budget_period === 'session' && sessions.length > 0 && draft.budget_amount && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex justify-between items-center">
                  <p className="text-xs font-bold text-blue-600">{sessions.length} sessions × {formatZAR(parseInt(draft.budget_amount))}</p>
                  <p className="text-base font-extrabold text-blue-700">{formatZAR(sessions.length * parseInt(draft.budget_amount))}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Additional notes (optional)</label>
              <textarea className={`${inp} resize-none min-h-[80px]`}
                placeholder="Number of learners, equipment provided, uniform required…"
                value={draft.notes} onChange={e => set({ notes: e.target.value })} />
            </div>
          </div>
        )}

        {/* ── Step 5: Review ── */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h2 className="text-base font-extrabold text-gray-900 mb-4">Review & post</h2>
              <div className="space-y-3">
                <ReviewRow label="Booking" value={buildTitle(draft)} />
                <ReviewRow label="Sport"   value={`${draft.sport}${draft.age_group ? ' · ' + draft.age_group : ''}`} />
                <ReviewRow label="Role"    value={`${draft.num_required} × ${draft.role}`} />
                {draft.booking_type !== 'single' && draft.days_of_week.length > 0 && (
                  <ReviewRow label="Schedule" value={`${draft.days_of_week.join(', ')} · ${draft.time_start}${draft.time_end ? ' – ' + draft.time_end : ''}`} />
                )}
                {draft.booking_type === 'single' && (
                  <ReviewRow label="Date" value={`${draft.single_date} · ${draft.time_start}${draft.time_end ? ' – ' + draft.time_end : ''}`} />
                )}
                <ReviewRow label="Sessions" value={sessions.length > 0 ? `${sessions.length} session${sessions.length !== 1 ? 's' : ''}` : '1 session'} />
                <ReviewRow label="Pay" value={`${formatZAR(parseInt(draft.budget_amount) || 0)} per ${draft.budget_period}`} />
                {(draft.req_first_aid || draft.req_police_clearance || draft.req_transport || draft.req_coaching_badge || draft.req_experience_years > 0) && (
                  <ReviewRow label="Requires" value={[
                    draft.req_first_aid        && 'First Aid',
                    draft.req_police_clearance && 'Police Clearance',
                    draft.req_transport        && 'Own Transport',
                    draft.req_coaching_badge   && 'Coaching Badge',
                    draft.req_experience_years > 0 && `${draft.req_experience_years}+ yrs`,
                  ].filter(Boolean).join(', ')} />
                )}
                {sessions.length > 1 && draft.budget_period === 'session' && draft.budget_amount && (
                  <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total payout</span>
                    <span className="text-lg font-extrabold text-green-700">{formatZAR(sessions.length * (parseInt(draft.budget_amount) || 0))}</span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm font-semibold text-red-600">{error}</div>
            )}

            <button onClick={submit} disabled={saving}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl disabled:opacity-40 transition-colors shadow-lg shadow-blue-200">
              {saving ? 'Posting…' : `Post booking${sessions.length > 1 ? ` · ${sessions.length} sessions` : ''} →`}
            </button>
          </div>
        )}

        {/* Navigation */}
        {step < 5 && (
          <div className="flex gap-3">
            {step > 1 && (
              <button onClick={() => setStep(s => (s - 1) as typeof step)}
                className="flex-1 py-3 border-2 border-gray-100 text-sm font-bold text-gray-600 rounded-2xl hover:border-gray-200 transition-colors">
                ← Back
              </button>
            )}
            <button
              onClick={() => { if (canAdvance()) setStep(s => (s + 1) as typeof step); }}
              disabled={!canAdvance()}
              className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl disabled:opacity-40 transition-colors">
              Continue →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide shrink-0">{label}</span>
      <span className="text-sm font-semibold text-gray-700 text-right">{value}</span>
    </div>
  );
}
