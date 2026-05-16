import { db } from '@/db';
import { workOrders } from '@/db/schema';
import { detectConflicts } from '@/lib/conflictEngine';
import { NextResponse } from 'next/server';

// Deterministic conflict detection — runs the rule-based engine over every
// work order. No AI, no API key: this endpoint always works and is the
// guaranteed fallback for the dashboard's AI conflict panel.
export async function GET() {
  try {
    const data = await db.select().from(workOrders);
    return NextResponse.json(detectConflicts(data));
  } catch {
    return NextResponse.json({ error: 'Failed to detect conflicts' }, { status: 500 });
  }
}
