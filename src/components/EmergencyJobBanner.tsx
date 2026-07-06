'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Job } from '@/types';

type EJob = Job & { school?: { name: string | null; location: string | null } };

function expiresIn(expiresAt: string, now: number): string {
  const diff = new Date(expiresAt).getTime() - now;
  if (diff <= 0) return 'expired';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m`;
}

export default function EmergencyJobBanner({
  initialJobs,
  coachProfileId,
}: {
  initialJobs: EJob[];
  coachProfileId: string;
}) {
  const [jobs,      setJobs]      = useState<EJob[]>(initialJobs);
  const [now,       setNow]       = useState(Date.now());
  const [accepting, setAccepting] = useState<string | null>(null);
  const [accepted,  setAccepted]  = useState<{ jobId: string; coachName: string } | null>(null);
  const [takenIds,  setTakenIds]  = useState<Set<string>>(new Set());

  // Countdown tick
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Realtime: new emergency jobs, jobs being filled
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel('emergency-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'jobs' },
        async (payload) => {
          const j = payload.new as EJob;
          if (!j.is_emergency || j.status !== 'open') return;
          // Fetch with school join
          const { data } = await supabase
            .from('jobs').select('*, school:schools(name, location)')
            .eq('id', j.id).single();
          if (data) setJobs(prev => [data as EJob, ...prev]);
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'jobs' },
        (payload) => {
          const j = payload.new as EJob;
          if (!j.is_emergency) return;
          if (j.status === 'filled') {
            setJobs(prev => prev.filter(x => x.id !== j.id));
          }
        })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  // Filter out expired jobs client-side
  const visible = jobs.filter(j => {
    if (!j.expires_at) return true;
    return new Date(j.expires_at).getTime() > now;
  });

  if (visible.length === 0) return null;

  async function accept(jobId: string) {
    setAccepting(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}/accept-emergency`, { method: 'POST' });
      const data = await res.json();
      if (res.status === 409) {
        // Already taken — remove from list
        setJobs(prev => prev.filter(j => j.id !== jobId));
        setTakenIds(prev => new Set(Array.from(prev).concat(jobId)));
      } else if (res.ok) {
        setAccepted({ jobId, coachName: data.coachName });
        setJobs(prev => prev.filter(j => j.id !== jobId));
      }
    } finally {
      setAccepting(null);
    }
  }

  return (
    <div className="mb-5">
      {/* Just-accepted confirmation */}
      {accepted && (
        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-4 mb-3">
          <p className="text-sm font-extrabold text-green-800">✅ You&apos;re confirmed!</p>
          <p className="text-xs text-green-700 mt-0.5">
            The school has been notified you&apos;re on your way.
          </p>
          <Link href="/messages"
            className="inline-block mt-2 text-xs font-bold bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors">
            💬 Message school
          </Link>
        </div>
      )}

      {visible.map(job => {
        const exp     = job.expires_at ? expiresIn(job.expires_at, now) : null;
        const isMe    = accepting === job.id;
        const taken   = takenIds.has(job.id);

        return (
          <div key={job.id}
            className="bg-red-600 text-white rounded-2xl p-5 shadow-xl shadow-red-200 mb-3">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-extrabold bg-white/20 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                    🚨 Urgent cover needed
                  </span>
                </div>
                <h3 className="text-base font-extrabold leading-tight">
                  {job.sport} {job.role ?? 'Coach'}
                </h3>
                {job.school?.name && (
                  <p className="text-xs text-red-200 mt-0.5">
                    🏫 {job.school.name}{job.school.location ? ` · ${job.school.location}` : ''}
                  </p>
                )}
              </div>
              {exp && exp !== 'expired' && (
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-red-200 font-bold uppercase">Expires in</p>
                  <p className="text-lg font-extrabold">{exp}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {job.time_start && (
                <span className="text-xs font-bold bg-white/15 px-2.5 py-1 rounded-lg">
                  🕐 Starts {job.time_start} today
                </span>
              )}
              {job.pay && (
                <span className="text-xs font-bold bg-white/15 px-2.5 py-1 rounded-lg">
                  💰 R{job.pay}
                </span>
              )}
              {job.notes && (
                <span className="text-xs text-red-200">{job.notes}</span>
              )}
            </div>

            {taken ? (
              <p className="text-xs font-bold text-red-200">Just taken by another coach.</p>
            ) : (
              <button
                onClick={() => accept(job.id)}
                disabled={isMe}
                className="w-full py-3.5 bg-white text-red-600 font-extrabold text-sm rounded-xl hover:bg-red-50 transition-colors disabled:opacity-60 shadow-md"
              >
                {isMe ? 'Confirming…' : "✋ Accept — I'll be there"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
