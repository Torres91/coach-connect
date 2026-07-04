import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));

  const formData = await req.formData();
  const jobId       = formData.get('jobId') as string;
  const coachUserId = formData.get('coachUserId') as string;

  // Verify this school owns the job
  const { data: school } = await supabase.from('schools').select('id').eq('user_id', user.id).single();
  if (!school) return NextResponse.redirect(new URL('/school/dashboard', req.url));

  const { data: job } = await supabase.from('jobs').select('id').eq('id', jobId).eq('school_id', school.id).single();
  if (!job) return NextResponse.redirect(new URL('/school/dashboard', req.url));

  // Accept this application, reject all others for this job
  await Promise.all([
    supabase.from('applications').update({ status: 'accepted' }).eq('id', params.id),
    supabase.from('applications').update({ status: 'rejected' }).eq('job_id', jobId).neq('id', params.id),
    supabase.from('jobs').update({ status: 'filled' }).eq('id', jobId),
  ]);

  // Send the coach a message
  if (coachUserId) {
    await supabase.from('messages').insert({
      sender_id:    user.id,
      recipient_id: coachUserId,
      job_id:       jobId,
      content:      'Great news — your application has been accepted! Looking forward to working with you.',
    });
  }

  return NextResponse.redirect(new URL(`/school/jobs/${jobId}`, req.url));
}
