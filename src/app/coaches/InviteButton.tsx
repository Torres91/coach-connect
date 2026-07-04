'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface OpenJob { id: string; title: string; sport: string }

export default function InviteButton({
  coachUserId,
  coachName,
  schoolUserId,
}: {
  coachUserId: string;
  coachName: string;
  schoolUserId: string;
}) {
  const [open,   setOpen]   = useState(false);
  const [jobs,   setJobs]   = useState<OpenJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [sent,   setSent]   = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function openMenu() {
    if (sent) return;
    setOpen(o => !o);
    if (jobs.length > 0) return;
    setLoading(true);
    const supabase = createClient();
    const { data: school } = await supabase.from('schools').select('id').eq('user_id', schoolUserId).single();
    if (school) {
      const { data } = await supabase.from('jobs').select('id, title, sport').eq('school_id', school.id).eq('status', 'open').order('created_at', { ascending: false }).limit(10);
      setJobs(data ?? []);
    }
    setLoading(false);
  }

  async function invite(job: OpenJob) {
    const supabase = createClient();
    await supabase.from('messages').insert({
      sender_id:    schoolUserId,
      recipient_id: coachUserId,
      job_id:       job.id,
      content:      `Hi ${coachName.split(' ')[0]}, we'd love to have you coach our ${job.sport} session (${job.title}). Are you available and interested?`,
    });
    setSent(true);
    setOpen(false);
  }

  if (sent) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-lg">
        ✅ Invited
      </span>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={openMenu}
        className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
      >
        Invite to job
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 overflow-hidden">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-3 pb-1">Your open jobs</p>
          {loading ? (
            <div className="px-3 py-4 text-center">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : jobs.length === 0 ? (
            <p className="text-xs text-gray-500 px-3 py-3 font-semibold">No open jobs. Post one first.</p>
          ) : (
            jobs.map(job => (
              <button
                key={job.id}
                onClick={() => invite(job)}
                className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors border-t border-gray-50 first:border-0"
              >
                <p className="text-xs font-extrabold text-gray-900 truncate">{job.title}</p>
                <p className="text-[10px] text-gray-500 font-semibold">⚽ {job.sport}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
