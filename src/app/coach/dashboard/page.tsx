import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/NavBar';
import { formatDate, formatZAR, timeAgo } from '@/lib/utils';
import type { Application, Job, Message } from '@/types';

export default async function CoachDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get coach profile first — needed as FK for applications query
  const { data: profile } = await supabase
    .from('coach_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile) redirect('/coach/profile');

  // Now fetch applications, unread messages, and activity feed in parallel
  const [{ data: apps }, { data: unreadMsgs }] = await Promise.all([
    supabase
      .from('applications')
      .select('*, job:jobs(*, school:schools(name, location))')
      .eq('coach_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('messages')
      .select('*')
      .eq('recipient_id', user.id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const applications = (apps ?? []) as (Application & { job: Job & { school: { name: string; location: string } } })[];
  const notifications = (unreadMsgs ?? []) as Message[];
  const unread = notifications.length;

  const accepted = applications.filter(a => a.status === 'accepted');
  const pending  = applications.filter(a => a.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-8">
      <NavBar role="coach" name={profile.full_name} unreadCount={unread} />

      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* Welcome banner */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-500 rounded-3xl p-6 mb-5 text-white">
          <p className="text-xs font-bold text-green-200 uppercase tracking-widest mb-1">Welcome back</p>
          <h1 className="text-xl font-extrabold leading-tight">{profile.full_name}</h1>
          <p className="text-sm text-green-200 mt-1">
            {profile.sports.slice(0, 3).join(' · ')}
            {profile.experience_years > 0 ? ` · ${profile.experience_years} yrs` : ''}
          </p>
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
            { label: 'Confirmed jobs', value: accepted.length,  icon: '✅' },
            { label: 'Pending',        value: pending.length,   icon: '⏳' },
            { label: 'Unread msgs',    value: unread,           icon: '💬' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-xl font-extrabold text-gray-900">{s.value}</div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Browse jobs CTA */}
        <Link href="/jobs"
          className="flex items-center justify-between bg-white border-2 border-green-200 rounded-2xl px-5 py-4 mb-5 hover:border-green-400 transition-colors">
          <div>
            <p className="text-sm font-extrabold text-green-700">Browse open jobs</p>
            <p className="text-xs text-gray-500 mt-0.5">Find new coaching opportunities near you</p>
          </div>
          <span className="text-green-500 text-xl">→</span>
        </Link>

        {/* Activity / Notifications */}
        {notifications.length > 0 && (
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                🔔 New activity
                <span className="bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{notifications.length}</span>
              </h2>
              <Link href="/messages" className="text-xs font-bold text-green-700 hover:underline">View messages →</Link>
            </div>
            <div className="flex flex-col gap-1.5">
              {notifications.map(msg => (
                <Link key={msg.id} href="/messages"
                  className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 block hover:border-amber-300 transition-colors">
                  <p className="text-xs font-semibold text-gray-800 leading-relaxed line-clamp-2">{msg.content}</p>
                  <p className="text-[10px] text-amber-600 font-bold mt-1">{timeAgo(msg.created_at)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Applications */}
        <div>
          <h2 className="text-sm font-extrabold text-gray-900 mb-3">My applications</h2>
          {applications.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm font-extrabold text-gray-500">No applications yet</p>
              <p className="text-xs text-gray-400 mt-1">
                <Link href="/jobs" className="text-green-600 font-bold">Browse jobs</Link> to get started.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {applications.map(app => (
                <div key={app.id} className={`bg-white rounded-2xl border-2 p-4 ${
                  app.status === 'accepted' ? 'border-green-200 bg-green-50' :
                  app.status === 'rejected' ? 'border-gray-100 opacity-60' : 'border-gray-100'
                }`}>
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-gray-900 truncate">{app.job?.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        🏫 {app.job?.school?.name}
                        {app.job?.school?.location ? ` · ${app.job.school.location}` : ''}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs font-bold text-gray-600">⚽ {app.job?.sport}</span>
                        {app.job?.date && <span className="text-xs text-gray-500">{formatDate(app.job.date)}</span>}
                        {app.job?.pay && <span className="text-xs font-bold text-green-700">{formatZAR(app.job.pay)}</span>}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      app.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      app.status === 'rejected' ? 'bg-gray-100 text-gray-500' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {app.status === 'pending' ? '⏳ pending' : app.status === 'accepted' ? '✅ accepted' : '✕ declined'}
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
