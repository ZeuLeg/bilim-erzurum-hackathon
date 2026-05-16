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
      title: 'Cumhuriyet Caddesi’nde büyük çukur',
      description: 'Ana kavşağa yakın noktada araçlara zarar veren derin bir çukur var.',
      status: 'pending',
      locationLat: 39.907,
      locationLng: 41.268,
      createdAt: new Date(),
    },
    {
      userId: insertedUsers[0].id,
      title: 'Yakutiye Camii yakınında arızalı sokak lambası',
      description: 'Sokak lambası 3 gündür yanmıyor, yayalar için güvenlik riski oluşturuyor.',
      status: 'pending',
      locationLat: 39.912,
      locationLng: 41.278,
      createdAt: new Date(),
    },
    {
      userId: insertedUsers[1].id,
      title: 'Belediye binası yakınında su borusu sızıntısı',
      description: 'Kaldırımı su basmış durumda, büyük ihtimalle patlamış bir ana isale hattı.',
      status: 'in_progress',
      locationLat: 39.901,
      locationLng: 41.265,
      createdAt: new Date(),
    },
    {
      userId: insertedUsers[1].id,
      title: 'Erzurum Kalesi yakınında çatlak kaldırım',
      description: 'Yaya yolunda büyük çatlaklar var, ciddi düşme tehlikesi oluşturuyor.',
      status: 'pending',
      locationLat: 39.92,
      locationLng: 41.281,
      createdAt: new Date(),
    },
    {
      userId: insertedUsers[0].id,
      title: 'E-80 otoyolu girişinde hasarlı trafik levhası',
      description: 'Hız sınırı levhası devrilmiş, direğinden tamamen kopmuş durumda.',
      status: 'pending',
      locationLat: 39.895,
      locationLng: 41.258,
      createdAt: new Date(),
    },
  ]);

  console.log('✓ 5 vatandaş ihbarı oluşturuldu');

  await db.insert(workOrders).values([
    {
      departmentName: 'Asfalt Müdürlüğü',
      description:
        'Cumhuriyet Caddesi’nin Kale ve Çaykara kavşakları arasında tam yol kaplama çalışması. Yol kapatması gerektirir.',
      plannedStartDate: new Date('2026-06-01'),
      plannedEndDate: new Date('2026-06-15'),
      locationLat: 39.907,
      locationLng: 41.268,
      status: 'scheduled',
    },
    {
      // ⚠️ BİLİNÇLİ ÇAKIŞMA: WO#1 ile aynı konum, 8-20 Haziran tarih çakışması
      departmentName: 'Su ve Kanalizasyon Müdürlüğü',
      description:
        'Cumhuriyet Caddesi’nde ana su borusu değişimi. Tam yol kazısı gerektirir — yeni asfalt tahrip olacak.',
      plannedStartDate: new Date('2026-06-08'),
      plannedEndDate: new Date('2026-06-20'),
      locationLat: 39.907,
      locationLng: 41.268,
      status: 'scheduled',
    },
    {
      departmentName: 'Elektrik İşleri Müdürlüğü',
      description: 'Atatürk Üniversitesi Bulvarı boyunca LED sokak aydınlatması yenilemesi.',
      plannedStartDate: new Date('2026-06-20'),
      plannedEndDate: new Date('2026-06-30'),
      locationLat: 39.912,
      locationLng: 41.278,
      status: 'scheduled',
    },
  ]);

  console.log('✓ 3 iş emri oluşturuldu');
  console.log('');
  console.log('⚠️  BİLİNÇLİ ÇAKIŞMA EKLENDİ:');
  console.log('   İş Emri #1 (Asfalt Müd.)         → 1-15 Haz  konum:39.907, 41.268');
  console.log('   İş Emri #2 (Su ve Kanalizasyon)  → 8-20 Haz  konum:39.907, 41.268');
  console.log('   7 günlük çakışma — AI ajanı bunu tespit etmeli.');
  console.log('');
  console.log('Seed tamamlandı!');
}

seed().catch(console.error);
