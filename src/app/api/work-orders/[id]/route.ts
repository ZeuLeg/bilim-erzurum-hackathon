import { db } from '@/db';
import { workOrders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const order = await db.select().from(workOrders).where(eq(workOrders.id, Number(id)));

  if (!order[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(order[0]);
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body: { status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' } =
    await request.json();

  const allowed = ['scheduled', 'in_progress', 'completed', 'cancelled'];
  if (body.status && !allowed.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
  }

  const updated = await db
    .update(workOrders)
    .set({ ...(body.status && { status: body.status }) })
    .where(eq(workOrders.id, Number(id)))
    .returning();

  if (!updated[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated[0]);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const deleted = await db.delete(workOrders).where(eq(workOrders.id, Number(id))).returning();

  if (!deleted[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
