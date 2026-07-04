import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendAcceptedEmail, sendRejectedEmail } from '@/lib/email';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));

  const formData = await req.formData();
  const jobId       = formData.get('jobId') as string;
  const coachUserId = formData.get('coachUserId') as string;

  // Verify this school owns the job
  const { data: school } = await supabase.from('schools').select('id, name').eq('user_id', user.id).single();
  if (!school) return NextResponse.redirect(new URL('/school/dashboard', req.url));

  const { data: job } = await supabase.from('jobs').select('id, title, sport, date').eq('id', jobId).eq('school_id', school.id).single();
  if (!job) return NextResponse.redirect(new URL('/school/dashboard', req.url));

  // Get all other pending applications for this job (for rejection emails)
  const { data: otherApps } = await supabase
    .from('applications')
    .select('id, coach_id, coach:coach_profiles(full_name, user_id)')
    .eq('job_id', jobId)
    .eq('status', 'pending')
    .neq('id', params.id);

  // Accept this application, reject all others, mark job filled
  await Promise.all([
    supabase.from('applications').update({ status: 'accepted' }).eq('id', params.id),
    supabase.from('applications').update({ status: 'rejected' }).eq('job_id', jobId).neq('id', params.id),
    supabase.from('jobs').update({ status: 'filled' }).eq('id', jobId),
  ]);

  // Send the accepted coach a welcome message + email (fire-and-forget)
  if (coachUserId) {
    void (async () => {
      try {
        await supabase.from('messages').insert({
          sender_id:    user.id,
          recipient_id: coachUserId,
          job_id:       jobId,
          content:      `Great news — your application for "${job.title}" has been accepted! Looking forward to working with you.`,
        });

        const { data: coach } = await supabase
          .from('coach_profiles')
          .select('full_name, user_id')
          .eq('user_id', coachUserId)
          .single();
        if (!coach) return;

        const { createAdminClient } = await import('@/lib/supabase/server');
        const admin = createAdminClient();
        const { data: authUser } = await admin.auth.admin.getUserById(coachUserId);
        if (authUser?.user?.email) {
          await sendAcceptedEmail({
            coachEmail:  authUser.user.email,
            coachName:   coach.full_name,
            schoolName:  school.name,
            jobTitle:    job.title,
            sport:       job.sport,
            jobDate:     job.date,
          });
        }
      } catch { /* ignore */ }
    })();

    // Send rejection emails to declined coaches (fire-and-forget)
    if (otherApps && otherApps.length > 0) {
      void Promise.all(otherApps.map(async (app) => {
        try {
          const coach = (app.coach as unknown as { full_name: string; user_id: string } | null);
          if (!coach) return;
          const { createAdminClient } = await import('@/lib/supabase/server');
          const admin = createAdminClient();
          const { data: authUser } = await admin.auth.admin.getUserById(coach.user_id);
          if (authUser?.user?.email) {
            await sendRejectedEmail({
              coachEmail: authUser.user.email,
              coachName:  coach.full_name,
              jobTitle:   job.title,
            });
          }
        } catch { /* ignore */ }
      }));
    }
  }

  return NextResponse.redirect(new URL(`/school/jobs/${jobId}`, req.url));
}
