import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/NavBar';
import { formatZAR } from '@/lib/utils';
import type { CoachProfile } from '@/types';
import { SPORTS, SA_PROVINCES } from '@/types';
import InviteButton from './InviteButton';
import FavouriteButton from '@/components/FavouriteButton';

export const dynamic = 'force-dynamic';

const SORT_OPTIONS = [
  { value: 'exp',  label: 'Experience' },
  { value: 'rate', label: 'Rate (low)' },
  { value: 'name', label: 'Name' },
] as const;

export default async function BrowseCoachesPage({
  searchParams,
}: {
  searchParams: { sport?: string; province?: string; sort?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: school }, { count: unreadRaw }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('schools').select('id, name, contact_name, user_id').eq('user_id', user.id).maybeSingle(),
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('recipient_id', user.id).eq('read', false),
  ]);

  // Fetch school's saved coaches (if school user)
  let favouriteIds = new Set<string>();
  if (school) {
    const { data: favs } = await supabase
      .from('favourite_coaches').select('coach_id').eq('school_id', school.id);
    favouriteIds = new Set((favs ?? []).map((f: { coach_id: string }) => f.coach_id));
  }
  const unreadCount = unreadRaw ?? 0;

  const { sport, province, sort = 'exp' } = searchParams;

  let query = supabase
    .from('coach_profiles')
    .select('*')
    .eq('available', true);

  if (sport)    query = query.contains('sports', [sport]);
  if (province) query = query.eq('province', province);

  // Sort
  if (sort === 'rate') {
    query = query.order('hourly_rate', { ascending: true, nullsFirst: false });
  } else if (sort === 'name') {
    query = query.order('full_name', { ascending: true });
  } else {
    query = query.order('experience_years', { ascending: false });
  }

  const { data: coaches } = await query;
  const coachList = (coaches ?? []) as CoachProfile[];

  const name = school?.contact_name ?? school?.name ?? '';
  const isSchool = profile?.role === 'school';

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-8">
      <NavBar role={profile?.role ?? 'school'} name={name} unreadCount={unreadCount} />

      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-extrabold text-gray-900">Find coaches</h1>
          <span className="text-xs text-gray-400 font-medium">{coachList.length} available</span>
        </div>

        {/* Sport filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-4 px-4 scrollbar-none">
          <Link href={{ pathname: '/coaches', query: { ...(province ? { province } : {}), ...(sort !== 'exp' ? { sort } : {}) } }}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border-2 whitespace-nowrap transition-all ${
              !sport ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 text-gray-600 hover:border-gray-200'
            }`}>
            All sports
          </Link>
          {SPORTS.map(s => (
            <Link key={s}
              href={{ pathname: '/coaches', query: { sport: s, ...(province ? { province } : {}), ...(sort !== 'exp' ? { sort } : {}) } }}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border-2 whitespace-nowrap transition-all ${
                sport === s ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 text-gray-600 hover:border-gray-200'
              }`}>
              {s}
            </Link>
          ))}
        </div>

        {/* Province + sort row */}
        <div className="flex gap-2 mb-4 items-center">
          <div className="relative flex-1">
            <select
              value={province ?? ''}
              onChange={e => {
                const p = e.target.value;
                const url = new URL(window.location.href);
                if (p) url.searchParams.set('province', p); else url.searchParams.delete('province');
                window.location.href = url.toString();
              }}
              className="w-full text-xs font-bold px-3 py-2 border-2 border-gray-100 rounded-xl bg-white focus:outline-none focus:border-blue-400 appearance-none"
            >
              <option value="">All provinces</option>
              {SA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[10px]">▼</span>
          </div>

          <div className="relative">
            <select
              value={sort}
              onChange={e => {
                const s = e.target.value;
                const url = new URL(window.location.href);
                if (s !== 'exp') url.searchParams.set('sort', s); else url.searchParams.delete('sort');
                window.location.href = url.toString();
              }}
              className="text-xs font-bold px-3 py-2 border-2 border-gray-100 rounded-xl bg-white focus:outline-none focus:border-blue-400 appearance-none pr-7"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>Sort: {o.label}</option>)}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[10px]">▼</span>
          </div>
        </div>

        {/* Active filters */}
        {(sport || province) && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs text-gray-400 font-semibold">Filtering by:</span>
            {sport && (
              <Link href={{ pathname: '/coaches', query: { ...(province ? { province } : {}), ...(sort !== 'exp' ? { sort } : {}) } }}
                className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-lg flex items-center gap-1">
                ⚽ {sport} ×
              </Link>
            )}
            {province && (
              <Link href={{ pathname: '/coaches', query: { ...(sport ? { sport } : {}), ...(sort !== 'exp' ? { sort } : {}) } }}
                className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg flex items-center gap-1">
                📍 {province} ×
              </Link>
            )}
            <Link href="/coaches" className="text-xs text-gray-400 hover:text-gray-700 font-semibold underline">
              Clear all
            </Link>
          </div>
        )}

        {coachList.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm font-extrabold text-gray-500">No coaches found</p>
            <p className="text-xs text-gray-400 mt-1">Try a different sport or province.</p>
            <Link href="/coaches" className="inline-block mt-3 text-xs font-bold text-blue-600 hover:underline">
              Clear filters →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {coachList.map(coach => (
              <div key={coach.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center font-extrabold text-white text-base shrink-0">
                    {coach.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-gray-900">{coach.full_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {coach.experience_years > 0 ? `${coach.experience_years} yr${coach.experience_years !== 1 ? 's' : ''} experience` : 'New coach'}
                      {coach.location ? ` · ${coach.location}` : ''}
                      {coach.province ? `, ${coach.province}` : ''}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {coach.sports.slice(0, 5).map(s => (
                        <span key={s} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          sport === s ? 'bg-green-200 text-green-800' : 'bg-green-50 text-green-700'
                        }`}>{s}</span>
                      ))}
                      {coach.sports.length > 5 && (
                        <span className="text-[10px] font-bold bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md">+{coach.sports.length - 5}</span>
                      )}
                    </div>
                    {coach.bio && (
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">{coach.bio}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {coach.hourly_rate && (
                      <p className="text-sm font-extrabold text-green-700">
                        {formatZAR(coach.hourly_rate)}<span className="text-xs font-normal text-gray-400">/hr</span>
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      {isSchool && (
                        <FavouriteButton coachId={coach.id} isFavourite={favouriteIds.has(coach.id)} />
                      )}
                      <Link href={`/messages?with=${coach.user_id}`}
                        className="text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors">
                        Message
                      </Link>
                    </div>
                    {isSchool && school && (
                      <InviteButton
                        coachUserId={coach.user_id}
                        coachName={coach.full_name}
                        schoolUserId={school.user_id}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
