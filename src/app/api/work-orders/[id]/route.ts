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

type WorkOrderStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;

  let body: {
    status?: WorkOrderStatus;
    plannedStartDate?: string;
    plannedEndDate?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const allowed: WorkOrderStatus[] = ['scheduled', 'in_progress', 'completed', 'cancelled'];
  if (body.status && !allowed.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
  }

  const updates: { status?: WorkOrderStatus; plannedStartDate?: Date; plannedEndDate?: Date } = {};

  if (body.status) updates.status = body.status;

  if (body.plannedStartDate !== undefined) {
    const date = new Date(body.plannedStartDate);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Invalid plannedStartDate' }, { status: 400 });
    }
    updates.plannedStartDate = date;
  }

  if (body.plannedEndDate !== undefined) {
    const date = new Date(body.plannedEndDate);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Invalid plannedEndDate' }, { status: 400 });
    }
    updates.plannedEndDate = date;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  if (
    updates.plannedStartDate &&
    updates.plannedEndDate &&
    updates.plannedStartDate >= updates.plannedEndDate
  ) {
    return NextResponse.json(
      { error: 'plannedStartDate must be before plannedEndDate' },
      { status: 400 },
    );
  }

  const updated = await db
    .update(workOrders)
    .set(updates)
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
