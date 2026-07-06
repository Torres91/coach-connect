import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: coach } = await supabase
    .from('coach_profiles').select('id, full_name').eq('user_id', user.id).single();
  if (!coach) return NextResponse.json({ error: 'Coach profile not found' }, { status: 404 });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Atomic claim: update succeeds only if the job is still open
  const { data: claimed, error: claimErr } = await admin
    .from('jobs')
    .update({ status: 'filled' })
    .eq('id', params.id)
    .eq('status', 'open')
    .eq('is_emergency', true)
    .select('id, sport, school_id')
    .maybeSingle();

  if (claimErr) return NextResponse.json({ error: claimErr.message }, { status: 500 });
  if (!claimed)  return NextResponse.json({ error: 'Job already taken' },  { status: 409 });

  // Application record
  await admin.from('applications').insert({
    job_id:  params.id,
    coach_id: coach.id,
    status:  'accepted',
    message: 'Emergency accept',
  });

  // Notify school via in-app message
  const { data: school } = await admin
    .from('schools').select('user_id').eq('id', claimed.school_id).single();

  if (school) {
    await admin.from('messages').insert({
      sender_id:    user.id,
      recipient_id: school.user_id,
      job_id:       params.id,
      content: `✅ ${coach.full_name} accepted your emergency ${claimed.sport} job and is on their way.`,
    });
  }

  return NextResponse.json({ accepted: true, coachName: coach.full_name });
}
