import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/NavBar';
import { formatZAR } from '@/lib/utils';
import type { CoachProfile } from '@/types';
import { SPORTS } from '@/types';

export const dynamic = 'force-dynamic';

export default async function BrowseCoachesPage({
  searchParams,
}: {
  searchParams: { sport?: string; province?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: school } = await supabase.from('schools').select('*').eq('user_id', user.id).maybeSingle();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

  const { sport, province } = searchParams;

  let query = supabase
    .from('coach_profiles')
    .select('*')
    .eq('available', true)
    .order('experience_years', { ascending: false });

  if (sport)    query = query.contains('sports', [sport]);
  if (province) query = query.eq('province', province);

  const { data: coaches } = await query;
  const coachList = (coaches ?? []) as CoachProfile[];

  const name = school?.contact_name ?? school?.name ?? '';

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-8">
      <NavBar role={profile?.role ?? 'school'} name={name} />

      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-extrabold text-gray-900">Find coaches</h1>
          <span className="text-xs text-gray-400 font-medium">{coachList.length} available</span>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
          <Link href="/coaches"
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border-2 whitespace-nowrap ${!sport && !province ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-600'}`}>
            All
          </Link>
          {SPORTS.slice(0, 6).map(s => (
            <Link key={s} href={`/coaches?sport=${encodeURIComponent(s)}`}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border-2 whitespace-nowrap ${sport === s ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-600'}`}>
              {s}
            </Link>
          ))}
        </div>

        {coachList.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm font-extrabold text-gray-500">No coaches found</p>
            <p className="text-xs text-gray-400 mt-1">Try a different sport or clear filters.</p>
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
                      {coach.experience_years} yrs experience
                      {coach.location ? ` · ${coach.location}` : ''}
                      {coach.province ? `, ${coach.province}` : ''}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {coach.sports.slice(0, 4).map(s => (
                        <span key={s} className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-md">{s}</span>
                      ))}
                    </div>
                    {coach.bio && (
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">{coach.bio}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {coach.hourly_rate && (
                      <p className="text-sm font-extrabold text-green-700">{formatZAR(coach.hourly_rate)}<span className="text-xs font-normal">/hr</span></p>
                    )}
                    <Link href={`/messages?with=${coach.user_id}`}
                      className="mt-2 inline-block text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                      Contact
                    </Link>
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
