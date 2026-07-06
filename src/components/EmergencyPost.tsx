'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SPORTS } from '@/types';
import type { Job } from '@/types';

type EJob = Job & { school?: { name: string; location: string | null } };

const ROLES = ['Coach', 'Referee', 'Official'];

function expiresIn(expiresAt: string, now: number): string {
  const diff = new Date(expiresAt).getTime() - now;
  if (diff <= 0) return 'expired';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m`;
}

export default function EmergencyPost({
  schoolId,
  initialJobs,
}: {
  schoolId: string;
  initialJobs: EJob[];
}) {
  const [isOpen,      setIsOpen]      = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [jobs,        setJobs]        = useState<EJob[]>(initialJobs);
  const [now,         setNow]         = useState(Date.now());
  const [sport,       setSport]       = useState('');
  const [role,        setRole]        = useState('Coach');
  const [timeStart,   setTimeStart]   = useState('');
  const [pay,         setPay]         = useState('');
  const [notes,       setNotes]       = useState('');
  const [error,       setError]       = useState('');

  // Tick every 30s for countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Realtime: watch for this school's emergency job updates
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel('school-ej')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'jobs',
        filter: `school_id=eq.${schoolId}`,
      }, (payload) => {
        const j = payload.new as EJob;
        if (j.is_emergency) {
          setJobs(prev => prev.map(x => x.id === j.id ? { ...x, ...j } : x));
        }
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [schoolId]);

  const reset = useCallback(() => {
    setSport(''); setRole('Coach'); setTimeStart(''); setPay(''); setNotes(''); setError('');
  }, []);

  async function submit() {
    if (!sport || !timeStart) { setError('Choose a sport and start time.'); return; }
    setSubmitting(true);
    setError('');
    const res = await fetch('/api/jobs/emergency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sport, role, time_start: timeStart, pay, notes }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Failed to post.'); setSubmitting(false); return; }
    setJobs(prev => [data.job as EJob, ...prev]);
    setSubmitting(false);
    setIsOpen(false);
    reset();
  }

  const liveJobs = jobs.filter(j => j.status === 'open' || j.status === 'filled');

  return (
    <>
      {/* Live emergency jobs */}
      {liveJobs.length > 0 && (
        <div className="mb-5 space-y-2">
          {liveJobs.map(job => {
            const filled   = job.status === 'filled';
            const exp      = job.expires_at ? expiresIn(job.expires_at, now) : null;
            const expired  = exp === 'expired';
            return (
              <div key={job.id} className={`rounded-2xl border-2 p-4 ${
                filled  ? 'border-green-300 bg-green-50' :
                expired ? 'border-gray-200 bg-gray-50 opacity-60' :
                          'border-red-300 bg-red-50 animate-pulse-slow'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        filled ? 'bg-green-500 text-white' : expired ? 'bg-gray-300 text-gray-600' : 'bg-red-500 text-white'
                      }`}>
                        {filled ? '✅ FILLED' : expired ? 'EXPIRED' : '🚨 LIVE'}
                      </span>
                      {!filled && !expired && exp && (
                        <span className="text-[10px] font-bold text-red-600">expires in {exp}</span>
                      )}
                    </div>
                    <p className="text-sm font-extrabold text-gray-900">
                      {job.sport} {job.role ?? 'Coach'}
                      {job.time_start && ` — ${job.time_start}`}
                    </p>
                    {job.pay && (
                      <p className="text-xs font-bold text-green-700 mt-0.5">R{job.pay} offered</p>
                    )}
                  </div>
                  {filled && (
                    <span className="text-xs font-bold text-green-700 text-right shrink-0">Coach confirmed</span>
                  )}
                  {!filled && !expired && (
                    <span className="text-xs text-red-500 font-semibold text-right shrink-0">Waiting…</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Emergency button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-red-200 animate-pulse-slow"
      >
        🚨 Emergency cover
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center text-xl shrink-0">🚨</div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900">Emergency cover needed</h2>
                <p className="text-xs text-gray-500">Posted instantly to all available coaches.</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Sport */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Sport *</label>
                <div className="flex flex-wrap gap-1.5">
                  {SPORTS.map(s => (
                    <button key={s} type="button" onClick={() => setSport(s)}
                      className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border-2 transition-all ${
                        sport === s ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Role + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Role</label>
                  <div className="flex flex-col gap-1.5">
                    {ROLES.map(r => (
                      <button key={r} type="button" onClick={() => setRole(r)}
                        className={`text-xs font-extrabold px-3 py-2 rounded-xl border-2 transition-all text-left ${
                          role === r ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-100 text-gray-500'
                        }`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Starts at *</label>
                  <input type="time" value={timeStart} onChange={e => setTimeStart(e.target.value)}
                    className="w-full text-sm px-3 py-2.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-red-400 font-semibold bg-white" />
                  <p className="text-[10px] text-gray-400 mt-1">Today only. Job expires at start time.</p>
                  <div className="mt-3">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Pay (R)</label>
                    <input type="number" placeholder="e.g. 350" value={pay} onChange={e => setPay(e.target.value)}
                      className="w-full text-sm px-3 py-2.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-red-400 font-semibold bg-white" />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Notes (optional)</label>
                <input type="text" placeholder="e.g. U12 group, equipment on site"
                  value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-red-400 font-semibold bg-white" />
              </div>

              {error && <p className="text-xs font-bold text-red-600">{error}</p>}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => { setIsOpen(false); reset(); }}
                className="flex-1 py-3 border-2 border-gray-100 text-sm font-bold text-gray-600 rounded-2xl hover:border-gray-200 transition-colors">
                Cancel
              </button>
              <button onClick={submit} disabled={submitting || !sport || !timeStart}
                className="flex-[2] py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm rounded-2xl disabled:opacity-40 transition-colors shadow-lg shadow-red-200">
                {submitting ? 'Posting…' : '🚨 Post emergency now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
