import { db } from '@/db';
import { reports } from '@/db/schema';
import type { NewReport } from '@/types';
import { NextResponse } from 'next/server';

export async function GET() {
  const data = await db.select().from(reports);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body: NewReport = await request.json();

  if (!body.title || !body.description || body.locationLat == null || body.locationLng == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const result = await db
    .insert(reports)
    .values({
      title: body.title,
      description: body.description,
      locationLat: body.locationLat,
      locationLng: body.locationLng,
      userId: body.userId ?? null,
      status: 'pending',
      createdAt: new Date(),
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
