import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: school } = await supabase
    .from('schools').select('id').eq('user_id', user.id).single();
  if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 });

  const { sport, role = 'Coach', time_start, pay, notes } = await req.json();
  if (!sport || !time_start) {
    return NextResponse.json({ error: 'sport and time_start are required' }, { status: 400 });
  }

  const today = new Date().toISOString().split('T')[0];
  const expires_at = new Date(`${today}T${time_start}:00`).toISOString();

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: job, error } = await admin.from('jobs').insert({
    school_id:    school.id,
    title:        `URGENT: ${sport} ${role} needed — today ${time_start}`,
    sport,
    role,
    status:       'open',
    is_emergency: true,
    expires_at,
    date:         today,
    time:         time_start,
    time_start,
    pay:          pay ? parseInt(pay) : null,
    notes:        notes || null,
    booking_type: 'single',
    num_required: 1,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ job });
}
