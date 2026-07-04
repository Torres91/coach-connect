'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ApplyButton({ jobId, coachId, hasApplied }: {
  jobId: string;
  coachId: string;
  hasApplied: boolean;
}) {
  const router = useRouter();
  const [applied,  setApplied]  = useState(hasApplied);
  const [loading,  setLoading]  = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message,  setMessage]  = useState('');

  async function apply() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from('applications').insert({
      job_id:   jobId,
      coach_id: coachId,
      message:  message.trim() || null,
      status:   'pending',
    });
    if (!error) {
      setApplied(true);
      setShowForm(false);
      router.refresh();
    }
    setLoading(false);
  }

  if (applied) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-bold text-green-700">
        <span className="bg-green-100 px-3 py-1.5 rounded-lg">✅ Applied</span>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="space-y-2">
        <textarea
          className="w-full text-sm px-3 py-2 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-green-400 font-semibold resize-none"
          rows={2}
          placeholder="Optional: introduce yourself or ask a question…"
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <div className="flex gap-2">
          <button onClick={apply} disabled={loading}
            className="text-xs font-bold bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl disabled:opacity-40 transition-colors">
            {loading ? 'Applying…' : 'Submit application →'}
          </button>
          <button onClick={() => setShowForm(false)}
            className="text-xs font-bold text-gray-500 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className="text-xs font-bold bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors"
    >
      Apply →
    </button>
  );
}
