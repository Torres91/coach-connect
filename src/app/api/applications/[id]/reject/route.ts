import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendRejectedEmail } from '@/lib/email';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));

  const formData = await req.formData();
  const jobId = formData.get('jobId') as string;

  const { data: school } = await supabase.from('schools').select('id, name').eq('user_id', user.id).single();
  if (!school) return NextResponse.redirect(new URL('/school/dashboard', req.url));

  // Get application + coach user_id + job title for notification
  const { data: app } = await supabase
    .from('applications')
    .select('id, coach_id, coach:coach_profiles(user_id, full_name), job:jobs(title, sport)')
    .eq('id', params.id)
    .single();

  await supabase.from('applications').update({ status: 'rejected' }).eq('id', params.id);

  // In-app + email notification (fire-and-forget)
  if (app) {
    const coach = app.coach as unknown as { user_id: string; full_name: string } | null;
    const job   = app.job   as unknown as { title: string; sport: string }    | null;
    if (coach && job) {
      void (async () => {
        try {
          // In-app message to coach
          await supabase.from('messages').insert({
            sender_id:    user.id,
            recipient_id: coach.user_id,
            job_id:       jobId,
            content:      `Thanks for applying for "${job.title}" at ${school.name}. Unfortunately we've filled this position with another candidate. We'll keep you in mind for future roles!`,
          });

          // Email notification
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
      })();
    }
  }

  return NextResponse.redirect(new URL(`/school/jobs/${jobId}`, req.url));
}
