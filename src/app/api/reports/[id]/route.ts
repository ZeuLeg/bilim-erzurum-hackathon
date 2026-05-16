import { db } from '@/db';
import { reports } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const report = await db.select().from(reports).where(eq(reports.id, Number(id)));

  if (!report[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(report[0]);
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body: { status?: 'pending' | 'in_progress' | 'resolved' } = await request.json();

  const allowed = ['pending', 'in_progress', 'resolved'];
  if (body.status && !allowed.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
  }

  const updated = await db
    .update(reports)
    .set({ ...(body.status && { status: body.status }) })
    .where(eq(reports.id, Number(id)))
    .returning();

  if (!updated[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated[0]);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const deleted = await db.delete(reports).where(eq(reports.id, Number(id))).returning();

  if (!deleted[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
