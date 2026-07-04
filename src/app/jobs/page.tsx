import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/NavBar';
import ApplyButton from './ApplyButton';
import { formatDate, formatZAR } from '@/lib/utils';
import type { Job } from '@/types';
import { SPORTS } from '@/types';

export const dynamic = 'force-dynamic';

export default async function BrowseJobsPage({
  searchParams,
}: {
  searchParams: { sport?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: coachProfile }, { data: myApps }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('coach_profiles').select('id, full_name, sports').eq('user_id', user.id).maybeSingle(),
    supabase.from('applications').select('job_id').eq('coach_id',
      (await supabase.from('coach_profiles').select('id').eq('user_id', user.id).single()).data?.id ?? ''
    ),
  ]);

  const sport = searchParams.sport;
  let query = supabase
    .from('jobs')
    .select('*, school:schools(name, location, province)')
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (sport) query = query.eq('sport', sport);

  const { data: jobs } = await query;
  const jobList     = (jobs ?? []) as (Job & { school: { name: string; location: string; province: string } })[];
  const appliedIds  = new Set((myApps ?? []).map(a => a.job_id));
  const unreadCount = 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-8">
      <NavBar role={profile?.role ?? 'coach'} name={coachProfile?.full_name ?? ''} unreadCount={unreadCount} />

      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-extrabold text-gray-900">Open jobs</h1>
          <span className="text-xs text-gray-400 font-medium">{jobList.length} available</span>
        </div>

        {/* Sport filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
          <Link href="/jobs"
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border-2 whitespace-nowrap transition-all ${
              !sport ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 text-gray-600'
            }`}>
            All sports
          </Link>
          {SPORTS.slice(0, 6).map(s => (
            <Link key={s} href={`/jobs?sport=${encodeURIComponent(s)}`}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border-2 whitespace-nowrap transition-all ${
                sport === s ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 text-gray-600'
              }`}>
              {s}
            </Link>
          ))}
        </div>

        {jobList.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm font-extrabold text-gray-500">No open jobs {sport ? `for ${sport}` : ''}</p>
            <p className="text-xs text-gray-400 mt-1">Check back soon — schools post new vacancies regularly.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {jobList.map(job => {
              const hasApplied = appliedIds.has(job.id);
              return (
                <div key={job.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div>
                      <p className="text-sm font-extrabold text-gray-900">{job.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 font-semibold">
                        🏫 {job.school?.name}
                        {job.school?.location ? ` · ${job.school.location}` : ''}
                      </p>
                    </div>
                    {job.pay && (
                      <span className="text-sm font-extrabold text-green-700 shrink-0">{formatZAR(job.pay)}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-xs font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-lg">⚽ {job.sport}</span>
                    {job.age_group && <span className="text-xs font-bold bg-gray-50 text-gray-600 px-2 py-0.5 rounded-lg">{job.age_group}</span>}
                    {job.date && <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-lg">{formatDate(job.date)}</span>}
                    {job.time && <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-lg">{job.time}</span>}
                    {job.duration_hours && <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-lg">{job.duration_hours}h</span>}
                  </div>

                  {job.notes && (
                    <p className="text-xs text-gray-500 mb-3 leading-relaxed">{job.notes}</p>
                  )}

                  {coachProfile && (
                    <ApplyButton
                      jobId={job.id}
                      coachId={coachProfile.id}
                      hasApplied={hasApplied}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
