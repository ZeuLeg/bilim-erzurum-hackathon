import { db } from '@/db';
import { workOrders } from '@/db/schema';
import type { NewWorkOrder } from '@/types';
import { NextResponse } from 'next/server';

export async function GET() {
  const data = await db.select().from(workOrders);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body: NewWorkOrder = await request.json();

  if (
    !body.departmentName ||
    !body.description ||
    !body.plannedStartDate ||
    !body.plannedEndDate ||
    body.locationLat == null ||
    body.locationLng == null
  ) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const result = await db
    .insert(workOrders)
    .values({
      departmentName: body.departmentName,
      description: body.description,
      plannedStartDate: new Date(body.plannedStartDate),
      plannedEndDate: new Date(body.plannedEndDate),
      locationLat: body.locationLat,
      locationLng: body.locationLng,
      status: 'scheduled',
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
