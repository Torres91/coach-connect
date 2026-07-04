'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { JobStatus } from '@/types';

export default function JobStatusActions({ jobId, currentStatus }: { jobId: string; currentStatus: JobStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function update(status: JobStatus) {
    setLoading(true);
    const supabase = createClient();
    await supabase.from('jobs').update({ status }).eq('id', jobId);
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="mt-3 flex gap-2 pt-3 border-t border-gray-100">
      {currentStatus === 'open' && (
        <button onClick={() => update('cancelled')} disabled={loading}
          className="text-xs font-bold text-red-500 hover:text-red-700 border border-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40">
          Cancel job
        </button>
      )}
      {currentStatus === 'filled' && (
        <button onClick={() => update('open')} disabled={loading}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 border border-blue-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40">
          Re-open
        </button>
      )}
    </div>
  );
}
