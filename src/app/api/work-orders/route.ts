import { db } from '@/db';
import { workOrders } from '@/db/schema';
import type { NewWorkOrder } from '@/types';
import { NextResponse } from 'next/server';

export function GET() {
  const data = db.select().from(workOrders).all();
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

  const result = db
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
    .returning()
    .get();

  return NextResponse.json(result, { status: 201 });
}
