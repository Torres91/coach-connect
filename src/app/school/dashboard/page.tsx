import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/NavBar';
import EmergencyPost from '@/components/EmergencyPost';
import { formatDate, formatZAR } from '@/lib/utils';
import type { Job } from '@/types';

export default async function SchoolDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: school } = await supabase
    .from('schools')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // First-time school user — auto-create record then send to profile setup
  if (!school) {
    const meta = user.user_metadata;
    await supabase.from('schools').insert({
      user_id:      user.id,
      name:         meta?.full_name ? `${meta.full_name}'s School` : 'My School',
      contact_name: meta?.full_name ?? null,
    });
    redirect('/school/profile');
  }

  const [{ data: jobs }, { count: unreadRaw }, { data: emergencyJobs }] = await Promise.all([
    supabase
      .from('jobs')
      .select('*, applications(id, status)')
      .eq('school_id', school.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('recipient_id', user.id).eq('read', false),
    supabase
      .from('jobs')
      .select('*')
      .eq('school_id', school.id)
      .eq('is_emergency', true)
      .in('status', ['open', 'filled'])
      .order('created_at', { ascending: false })
      .limit(5),
  ]);
  const unreadCount = unreadRaw ?? 0;

  const jobList = (jobs ?? []) as (Job & { applications: { id: string; status: string }[] })[];

  const openJobs    = jobList.filter(j => j.status === 'open');
  const filledJobs  = jobList.filter(j => j.status === 'filled');
  const pendingApps = jobList.reduce((n, j) => n + (j.applications ?? []).filter(a => a.status === 'pending').length, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-8">
      <NavBar role="school" name={school.contact_name ?? school.name} unreadCount={unreadCount} />

      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-6 mb-5 text-white">
          <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Head of Sport</p>
          <h1 className="text-xl font-extrabold leading-tight">{school.name}</h1>
          {school.location && <p className="text-sm text-blue-200 mt-1">📍 {school.location}</p>}
          <div className="flex gap-2 mt-3 flex-wrap items-center">
            <Link href="/school/post-job"
              className="text-sm font-extrabold bg-white text-blue-700 px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors">
              + Post a job
            </Link>
            <Link href="/coaches"
              className="text-sm font-bold bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition-colors border border-white/30">
              Find coaches
            </Link>
            <Link href="/school/profile"
              className="text-sm font-bold bg-white/10 hover:bg-white/20 text-blue-100 px-4 py-2 rounded-xl transition-colors">
              ⚙️ Settings
            </Link>
            <EmergencyPost schoolId={school.id} initialJobs={(emergencyJobs ?? []) as Job[]} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { label: 'Open jobs',   value: openJobs.length,  icon: '📋' },
            { label: 'New apps',    value: pendingApps,       icon: '⏳' },
            { label: 'Filled',      value: filledJobs.length, icon: '✅' },
            { label: 'Messages',    value: unreadCount,        icon: '💬' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-3 border border-gray-100 text-center">
              <div className="text-lg mb-1">{s.icon}</div>
              <div className="text-lg font-extrabold text-gray-900">{s.value}</div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Jobs list */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-extrabold text-gray-900">Your job postings</h2>
            <Link href="/school/post-job" className="text-xs font-bold text-green-700 hover:underline">+ New job</Link>
          </div>

          {jobList.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-sm font-extrabold text-gray-500">No jobs posted yet</p>
              <p className="text-xs text-gray-400 mt-1">Post your first vacancy to find a coach.</p>
              <Link href="/school/post-job"
                className="inline-block mt-4 bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors">
                Post a job →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {jobList.map(job => {
                const jobApps  = job.applications ?? [];
                const newApps  = jobApps.filter(a => a.status === 'pending').length;
                const accepted = jobApps.find(a => a.status === 'accepted');
                return (
                  <Link key={job.id} href={`/school/jobs/${job.id}`}
                    className="bg-white rounded-2xl border border-gray-100 hover:border-blue-200 transition-colors p-4 block">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="text-sm font-extrabold text-gray-900">{job.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs font-bold text-gray-600">⚽ {job.sport}</span>
                          {job.age_group && <span className="text-xs text-gray-500">{job.age_group}</span>}
                          {job.date && <span className="text-xs text-gray-500">{formatDate(job.date)}</span>}
                          {job.pay && <span className="text-xs font-bold text-green-700">{formatZAR(job.pay)}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          job.status === 'open'      ? 'bg-green-100 text-green-700' :
                          job.status === 'filled'    ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>{job.status}</span>
                        {newApps > 0 && (
                          <p className="text-[10px] font-bold text-amber-600 mt-1">{newApps} new app{newApps !== 1 ? 's' : ''}</p>
                        )}
                        {accepted && (
                          <p className="text-[10px] font-bold text-green-600 mt-1">✓ Coach hired</p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
