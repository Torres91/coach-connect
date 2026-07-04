import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import JobStatusActions from './JobStatusActions';
import { formatDate, formatZAR } from '@/lib/utils';
import type { Application, CoachProfile } from '@/types';

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: school } = await supabase.from('schools').select('id, user_id').eq('user_id', user.id).single();
  if (!school) redirect('/school/dashboard');

  const { data: job } = await supabase.from('jobs').select('*').eq('id', params.id).eq('school_id', school.id).single();
  if (!job) notFound();

  const { data: apps } = await supabase
    .from('applications')
    .select('*, coach:coach_profiles(*)')
    .eq('job_id', params.id)
    .order('created_at', { ascending: false });

  const applications = (apps ?? []) as (Application & { coach: CoachProfile })[];

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/school/dashboard" className="text-gray-400 hover:text-gray-700 text-sm font-bold">← Dashboard</Link>
        <span className="font-extrabold text-base text-gray-900 truncate">{job.title}</span>
        <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
          job.status === 'open'   ? 'bg-green-100 text-green-700' :
          job.status === 'filled' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-500'
        }`}>{job.status}</span>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-6 space-y-4">
        {/* Job summary */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {[
              ['Sport',    job.sport],
              ['Age group', job.age_group ?? '—'],
              ['Date',     job.date ? formatDate(job.date) : '—'],
              ['Time',     job.time ?? '—'],
              ['Duration', job.duration_hours ? `${job.duration_hours}h` : '—'],
              ['Pay',      job.pay ? formatZAR(job.pay) : '—'],
            ].map(([k, v]) => (
              <div key={k}>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{k}: </span>
                <span className="font-semibold text-gray-700">{v}</span>
              </div>
            ))}
          </div>
          {job.notes && (
            <div className="mt-3 pt-3 border-t border-gray-50">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-gray-600">{job.notes}</p>
            </div>
          )}
          <JobStatusActions jobId={job.id} currentStatus={job.status} />
        </div>

        {/* Applications */}
        <div>
          <h2 className="text-sm font-extrabold text-gray-900 mb-3">
            Applications ({applications.length})
          </h2>
          {applications.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
              <div className="text-3xl mb-2">🕐</div>
              <p className="text-sm font-extrabold text-gray-500">No applications yet</p>
              <p className="text-xs text-gray-400 mt-1">Coaches will appear here when they apply.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {applications.map(app => (
                <ApplicationCard key={app.id} app={app} jobStatus={job.status} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ApplicationCard({ app, jobStatus }: {
  app: Application & { coach: CoachProfile };
  jobStatus: string;
}) {
  const coach = app.coach;
  return (
    <div className={`bg-white rounded-2xl border-2 p-4 ${
      app.status === 'accepted' ? 'border-green-300 bg-green-50' : 'border-gray-100'
    }`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center font-extrabold text-green-700 text-sm shrink-0">
          {coach.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-gray-900">{coach.full_name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {coach.sports.slice(0, 3).join(', ')} · {coach.experience_years} yrs
            {coach.location ? ` · ${coach.location}` : ''}
          </p>
          {coach.hourly_rate && (
            <p className="text-xs font-bold text-green-700 mt-0.5">{formatZAR(coach.hourly_rate)}/hr</p>
          )}
          {app.message && (
            <p className="text-xs text-gray-600 mt-1.5 italic">&ldquo;{app.message}&rdquo;</p>
          )}
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
          app.status === 'accepted' ? 'bg-green-100 text-green-700' :
          app.status === 'rejected' ? 'bg-red-100 text-red-600' :
          'bg-amber-100 text-amber-700'
        }`}>{app.status}</span>
      </div>

      {app.status === 'pending' && jobStatus === 'open' && (
        <ApplicationActions appId={app.id} jobId={app.job_id} coachUserId={coach.user_id} />
      )}
      {app.status === 'accepted' && (
        <div className="mt-3 flex gap-2">
          <Link href={`/messages?job=${app.job_id}&with=${coach.user_id}`}
            className="text-xs font-bold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors">
            💬 Message coach
          </Link>
        </div>
      )}
    </div>
  );
}

function ApplicationActions({ appId, jobId, coachUserId }: {
  appId: string; jobId: string; coachUserId: string;
}) {
  return (
    <div className="mt-3 flex gap-2">
      <form action={`/api/applications/${appId}/accept`} method="POST">
        <input type="hidden" name="jobId" value={jobId} />
        <input type="hidden" name="coachUserId" value={coachUserId} />
        <button
          type="submit"
          className="text-xs font-bold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          ✓ Accept
        </button>
      </form>
      <form action={`/api/applications/${appId}/reject`} method="POST">
        <button
          type="submit"
          className="text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg transition-colors border border-red-100"
        >
          ✕ Decline
        </button>
      </form>
    </div>
  );
}
