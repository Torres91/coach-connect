'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { SA_PROVINCES } from '@/types';

const SORT_OPTIONS = [
  { value: 'exp',  label: 'Experience' },
  { value: 'rate', label: 'Rate (low)'  },
  { value: 'name', label: 'Name'        },
] as const;

const sel = 'text-xs font-bold px-3 py-2 border-2 border-gray-100 rounded-xl bg-white focus:outline-none focus:border-blue-400 appearance-none';

export default function CoachFilters({
  province, sort,
}: {
  province?: string;
  sort?: string;
}) {
  const router      = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value); else next.delete(key);
    router.push(`/coaches?${next.toString()}`);
  }

  return (
    <div className="flex gap-2 mb-4 items-center">
      <div className="relative flex-1">
        <select
          value={province ?? ''}
          onChange={e => update('province', e.target.value)}
          className={`w-full ${sel}`}
        >
          <option value="">All provinces</option>
          {SA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[10px]">▼</span>
      </div>

      <div className="relative">
        <select
          value={sort ?? 'exp'}
          onChange={e => update('sort', e.target.value)}
          className={`${sel} pr-7`}
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>Sort: {o.label}</option>
          ))}
        </select>
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[10px]">▼</span>
      </div>
    </div>
  );
}
