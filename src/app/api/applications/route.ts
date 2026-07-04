import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendApplicationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { jobId, message } = await req.json();
    if (!jobId) return NextResponse.json({ error: 'Job ID required' }, { status: 400 });

    const { data: coachProfile } = await supabase
      .from('coach_profiles')
      .select('id, full_name')
      .eq('user_id', user.id)
      .single();

    if (!coachProfile) return NextResponse.json({ error: 'Coach profile not found' }, { status: 404 });

    // Insert application
    const { data: app, error } = await supabase
      .from('applications')
      .insert({ job_id: jobId, coach_id: coachProfile.id, message: message?.trim() || null, status: 'pending' })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Already applied' }, { status: 409 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch job + school details for email (fire-and-forget)
    void (async () => {
      try {
        const { data: job } = await supabase
          .from('jobs')
          .select('title, sport, date, school:schools(name, contact_name, user_id)')
          .eq('id', jobId)
          .single();
        if (!job) return;
        const school = (job.school as unknown as { name: string; contact_name: string | null; user_id: string });
        const { data: schoolAuth } = await supabase.auth.admin.getUserById(school.user_id).catch(() => ({ data: null }));
        const schoolEmail = schoolAuth?.user?.email;
        if (schoolEmail) {
          await sendApplicationEmail({
            schoolEmail,
            schoolContactName: school.contact_name ?? school.name,
            coachName: coachProfile.full_name,
            jobTitle: job.title,
            sport: job.sport,
            coachMessage: message,
            jobId,
          });
        }
      } catch { /* ignore email errors */ }
    })();

    return NextResponse.json({ application: app });
  } catch (err) {
    console.error('[POST /api/applications]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
