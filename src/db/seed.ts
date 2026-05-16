import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import path from 'path';
import * as schema from './schema';
import { reports, users, workOrders } from './schema';

const client = createClient({
  url: `file:${path.join(process.cwd(), 'citysync.db')}`,
});
const db = drizzle(client, { schema });

async function seed() {
  console.log('Clearing existing data...');
  await db.delete(workOrders);
  await db.delete(reports);
  await db.delete(users);

  const insertedUsers = await db
    .insert(users)
    .values([
      { role: 'citizen', email: 'ali.yilmaz@example.com' },
      { role: 'citizen', email: 'fatma.kaya@example.com' },
      { role: 'staff', email: 'mehmet.demir@erzurum.bel.tr' },
      { role: 'admin', email: 'admin@erzurum.bel.tr' },
    ])
    .returning();

  console.log(`✓ Created ${insertedUsers.length} users`);

  await db.insert(reports).values([
    {
      userId: insertedUsers[0].id,
      title: 'Pothole on Cumhuriyet Caddesi',
      description: 'Large pothole causing vehicle damage near the main intersection.',
      status: 'pending',
      locationLat: 39.907,
      locationLng: 41.268,
      createdAt: new Date(),
    },
    {
      userId: insertedUsers[0].id,
      title: 'Broken streetlight near Yakutiye Mosque',
      description: 'Streetlight has been out for 3 days, creating a pedestrian safety hazard.',
      status: 'pending',
      locationLat: 39.912,
      locationLng: 41.278,
      createdAt: new Date(),
    },
    {
      userId: insertedUsers[1].id,
      title: 'Water pipe leakage near City Hall',
      description: 'Visible water flooding the sidewalk, likely a burst main pipe.',
      status: 'in_progress',
      locationLat: 39.901,
      locationLng: 41.265,
      createdAt: new Date(),
    },
    {
      userId: insertedUsers[1].id,
      title: 'Cracked pavement near Erzurum Castle',
      description: 'Large cracks in the pedestrian walkway, serious trip hazard.',
      status: 'pending',
      locationLat: 39.92,
      locationLng: 41.281,
      createdAt: new Date(),
    },
    {
      userId: insertedUsers[0].id,
      title: 'Damaged road sign on E-80 highway entrance',
      description: 'Speed limit sign knocked over, missing from post entirely.',
      status: 'pending',
      locationLat: 39.895,
      locationLng: 41.258,
      createdAt: new Date(),
    },
  ]);

  console.log('✓ Created 5 citizen reports');

  await db.insert(workOrders).values([
    {
      departmentName: 'Asphalt Department',
      description:
        'Full road resurfacing of Cumhuriyet Caddesi between Kale and Çaykara intersections. Requires road closure.',
      plannedStartDate: new Date('2026-06-01'),
      plannedEndDate: new Date('2026-06-15'),
      locationLat: 39.907,
      locationLng: 41.268,
      status: 'scheduled',
    },
    {
      // ⚠️ DELIBERATE COLLISION: same location as WO#1, overlapping dates Jun 8-20
      departmentName: 'Water & Sewage Department',
      description:
        'Main water pipe replacement on Cumhuriyet Caddesi. Requires full road excavation — asphalt will be destroyed.',
      plannedStartDate: new Date('2026-06-08'),
      plannedEndDate: new Date('2026-06-20'),
      locationLat: 39.907,
      locationLng: 41.268,
      status: 'scheduled',
    },
    {
      departmentName: 'Electrical Department',
      description: 'LED streetlight upgrade along Atatürk University Boulevard.',
      plannedStartDate: new Date('2026-06-20'),
      plannedEndDate: new Date('2026-06-30'),
      locationLat: 39.912,
      locationLng: 41.278,
      status: 'scheduled',
    },
  ]);

  console.log('✓ Created 3 work orders');
  console.log('');
  console.log('⚠️  DELIBERATE COLLISION INJECTED:');
  console.log('   Work Order #1 (Asphalt Dept)   → Jun 1–15  at lat:39.907 lng:41.268');
  console.log('   Work Order #2 (Water & Sewage)  → Jun 8–20  at lat:39.907 lng:41.268');
  console.log('   7-day overlap — AI agent should detect this.');
  console.log('');
  console.log('Seed complete!');
}

seed().catch(console.error);
