import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/NavBar';
import { formatDate, formatZAR } from '@/lib/utils';
import type { Application, Job } from '@/types';

export default async function CoachDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: apps }, { data: unread }] = await Promise.all([
    supabase.from('coach_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('applications')
      .select('*, job:jobs(*, school:schools(name, location))')
      .eq('coach_id', (await supabase.from('coach_profiles').select('id').eq('user_id', user.id).single()).data?.id ?? '')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('recipient_id', user.id).eq('read', false),
  ]);

  if (!profile) redirect('/coach/profile');

  const applications = (apps ?? []) as (Application & { job: Job & { school: { name: string; location: string } } })[];
  const unreadCount  = (unread as unknown as { count: number })?.count ?? 0;

  const accepted = applications.filter(a => a.status === 'accepted');
  const pending  = applications.filter(a => a.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-8">
      <NavBar role="coach" name={profile.full_name} unreadCount={unreadCount} />

      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* Welcome */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-500 rounded-3xl p-6 mb-5 text-white">
          <p className="text-xs font-bold text-green-200 uppercase tracking-widest mb-1">Welcome back</p>
          <h1 className="text-xl font-extrabold leading-tight">{profile.full_name}</h1>
          <p className="text-sm text-green-200 mt-1">{profile.sports.slice(0, 3).join(' · ')} · {profile.experience_years} yrs experience</p>
          <div className="flex items-center gap-3 mt-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${profile.available ? 'bg-white/20 text-white' : 'bg-red-400/30 text-red-100'}`}>
              {profile.available ? '✅ Available' : '⏸ Unavailable'}
            </span>
            <Link href="/coach/profile" className="text-xs font-bold text-green-200 hover:text-white underline">
              Edit profile
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Confirmed jobs', value: accepted.length, icon: '✅' },
            { label: 'Pending',        value: pending.length,  icon: '⏳' },
            { label: 'Messages',       value: unreadCount,      icon: '💬' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-xl font-extrabold text-gray-900">{s.value}</div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* CTA to browse jobs */}
        <Link href="/jobs"
          className="flex items-center justify-between bg-white border-2 border-green-200 rounded-2xl px-5 py-4 mb-5 hover:border-green-400 transition-colors">
          <div>
            <p className="text-sm font-extrabold text-green-700">Browse open jobs</p>
            <p className="text-xs text-gray-500 mt-0.5">Find new coaching opportunities near you</p>
          </div>
          <span className="text-green-500 text-lg">→</span>
        </Link>

        {/* My applications */}
        <div>
          <h2 className="text-sm font-extrabold text-gray-900 mb-3">My applications</h2>
          {applications.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm font-extrabold text-gray-500">No applications yet</p>
              <p className="text-xs text-gray-400 mt-1">
                <Link href="/jobs" className="text-green-600 font-bold">Browse jobs</Link> to apply.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {applications.map(app => (
                <div key={app.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="text-sm font-extrabold text-gray-900">{app.job?.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {app.job?.school?.name} · {app.job?.school?.location}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs font-bold text-gray-600">⚽ {app.job?.sport}</span>
                        {app.job?.date && <span className="text-xs text-gray-500">{formatDate(app.job.date)}</span>}
                        {app.job?.pay && <span className="text-xs font-bold text-green-700">{formatZAR(app.job.pay)}</span>}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      app.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-600' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                  {app.status === 'accepted' && (
                    <Link href={`/messages?job=${app.job_id}`}
                      className="mt-2 inline-block text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors">
                      💬 Message school
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
