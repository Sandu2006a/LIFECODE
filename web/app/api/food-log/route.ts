import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { user_id, meal, calories, protein, carbs, fats } = await req.json();
  const { data, error } = await supabase
    .from('food_logs')
    .insert({ user_id, meal, calories: calories || 0, protein: protein || 0, carbs: carbs || 0, fats: fats || 0, logged_at: new Date().toISOString() })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function GET(req: NextRequest) {
  const user_id = req.nextUrl.searchParams.get('user_id');
  const date    = req.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .eq('user_id', user_id)
    .gte('logged_at', `${date}T00:00:00.000Z`)
    .lte('logged_at', `${date}T23:59:59.999Z`)
    .order('logged_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
