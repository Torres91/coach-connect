import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));

  const formData = await req.formData();
  const jobId = formData.get('jobId') as string;

  const { data: school } = await supabase.from('schools').select('id').eq('user_id', user.id).single();
  if (!school) return NextResponse.redirect(new URL('/school/dashboard', req.url));

  await supabase.from('applications').update({ status: 'rejected' }).eq('id', params.id);

  return NextResponse.redirect(new URL(`/school/jobs/${jobId}`, req.url));
}
