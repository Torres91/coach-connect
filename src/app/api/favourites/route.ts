import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: school } = await supabase
    .from('schools').select('id').eq('user_id', user.id).single();
  if (!school) return NextResponse.json({ error: 'Schools only' }, { status: 403 });

  const { coachId } = await req.json();
  if (!coachId) return NextResponse.json({ error: 'coachId required' }, { status: 400 });

  // Check if already favourited
  const { data: existing } = await supabase
    .from('favourite_coaches')
    .select('id')
    .eq('school_id', school.id)
    .eq('coach_id', coachId)
    .maybeSingle();

  if (existing) {
    await supabase.from('favourite_coaches').delete().eq('id', existing.id);
    return NextResponse.json({ isFavourite: false });
  }

  await supabase.from('favourite_coaches').insert({ school_id: school.id, coach_id: coachId });
  return NextResponse.json({ isFavourite: true });
}
