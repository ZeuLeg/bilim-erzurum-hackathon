# 🏙️ CitySync AI

> Erzurum'da altyapı çalışmaları artık çakışmıyor.

**CitySync AI**, belediye müdürlüklerinin iş emirlerini yapay zeka ile koordine eden, aynı caddeyi iki kez kazmayı önleyen bir karar destek platformudur. Yeni dökülen asfaltın bir hafta sonra su borusu için kazılmasını — milyonlarca liralık israfı ve tonlarca karbon emisyonunu — daha planlama aşamasında engeller.

📍 _2026 Kamuda Dijital Dönüşüm ve Yapay Zeka Hackathonu · Bilim Erzurum_
👥 _Team Zetora_

---

## 🎯 Çözdüğümüz Problem

Belediyelerde her müdürlük (Asfalt, Su ve Kanalizasyon, Elektrik, Doğalgaz) kendi takvimini bağımsız yapar. Sonuç:

- Asfalt Müdürlüğü bir caddeyi yeniler → 1 hafta sonra Su Müdürlüğü aynı caddeyi kazar.
- Yeni asfalt tahrip olur, yeniden dökülür → **çalışma başına ~1.6 milyon TL israf**, **~25 ton CO₂** ek emisyon.
- Vatandaş aynı yolda iki kez trafiğe ve toza katlanır.

Bu, Türkiye'deki neredeyse her şehrin yaşadığı, koordinasyon eksikliğinden kaynaklanan kronik bir kaynak israfıdır.

## 💡 Çözümümüz

CitySync AI üç katmanlı çalışır:

1. **Deterministik Çakışma Motoru** — Tüm iş emiri çiftlerini tarar. _300 metre yakınlık + en az 1 gün tarih örtüşmesi_ = çakışma. AI'a bağımlı değildir; her zaman çalışır ve kesin sayılar üretir.
2. **Yapay Zeka Ajanı (Gemini 2.5 Flash)** — Motorun bulgularını alır, vatandaş ihbarlarıyla ilişkilendirir, Türkçe gerekçeli ve **uygulanabilir öneriler** üretir (ör. "kazı çalışmasını asfaltlamadan önceye alın").
3. **Eylem Katmanı** — Admin, AI'ın önerdiği yeni tarihi tek tıkla uygular ("Yeniden Planla"). Çakışma anında çözülür.

### Neden hem motor hem AI?

Deterministik motor **güvenilirliği** (jüri demosunda asla boş ekran yok), AI **açıklanabilirliği ve önceliklendirmeyi** sağlar. AI mesafe/tarih hesaplamaz — motorun verdiği kesin sayıları kullanır, sadece yorumlar ve önerir.

---

## ✨ Özellikler

| Modül                                    | Açıklama                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| 🗺️ **Vatandaş Portalı** (`/report`)      | Harita üzerinden sorun bildirme, mevcut ihbarları ve iş emirlerini görüntüleme             |
| 🔗 **Çakışma Görselleştirme**            | Çakışan iş emirleri haritada renkli kesikli çizgilerle (kırmızı/turuncu/sarı) eşleştirilir |
| 🔥 **İhbar Isı Haritası**                | Vatandaş ihbarlarının yoğunlaştığı bölgeler haritada açılıp-kapanan ısı katmanıyla görülür  |
| 🤖 **AI Çakışma Analizi** (`/dashboard`) | Tek tıkla tüm iş emirlerini tarar, Türkçe gerekçeli rapor üretir                           |
| 💰 **Etki Paneli**                       | Önlenen bütçe kaybı (₺), CO₂ tasarrufu (kg), kurtarılan yol (m) — gerçek zamanlı           |
| 📅 **Zaman Çizgisi (Gantt)**             | İş emirleri takvim üzerinde; çakışanlar kırmızı vurgulanır                                 |
| ⚡ **Tek Tıkla Yeniden Planlama**        | AI'ın önerdiği yeni tarihi doğrudan uygular                                                |
| 🌐 **Tam Türkçe**                        | Tüm arayüz ve AI çıktıları Türkçe                                                          |

---

## 🛠️ Teknoloji Yığını

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Dil:** TypeScript 6
- **Yapay Zeka:** Vercel AI SDK v6 + Google Gemini 2.5 Flash (`@ai-sdk/google`)
- **Veritabanı:** SQLite + Drizzle ORM (`@libsql/client`)
- **Harita:** Leaflet
- **Arayüz:** Tailwind CSS v4, lucide-react
- **Test:** Vitest

---

## 🚀 Kurulum

### Gereksinimler

- Node.js 20+
- Ücretsiz bir Gemini API anahtarı — [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (kredi kartı gerekmez)

### Adımlar

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Ortam değişkenlerini ayarla
cp .env.local.example .env.local
# .env.local dosyasını açıp GOOGLE_GENERATIVE_AI_API_KEY değerini gir

# 3. Veritabanını oluştur ve örnek veriyle doldur
npm run db:push
npm run db:seed

# 4. Geliştirme sunucusunu başlat
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde açılır.

### Komutlar

| Komut               | Açıklama                                    |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Geliştirme sunucusu                         |
| `npm run build`     | Üretim derlemesi                            |
| `npm run db:push`   | Veritabanı şemasını oluştur                 |
| `npm run db:seed`   | Örnek veriyi (bilinçli çakışma dahil) yükle |
| `npm run db:studio` | Drizzle Studio ile veritabanını görüntüle   |
| `npm test`          | Testleri çalıştır                           |

---

## 🧭 Demo Senaryosu (Jüri İçin)

`db:seed` komutu sahneyi **bilinçli bir çakışmayla** kurar:

| İş Emri | Müdürlük                     | Tarih        | Konum                           |
| ------- | ---------------------------- | ------------ | ------------------------------- |
| #1      | Asfalt Müdürlüğü             | 1–15 Haziran | Cumhuriyet Caddesi              |
| #2      | Su ve Kanalizasyon Müdürlüğü | 8–20 Haziran | Cumhuriyet Caddesi (aynı nokta) |

→ **7 günlük örtüşme, 0 m mesafe.** Yeni asfalt kazılacak.

**Sunum akışı:**

1. **`/`** — Açılış sayfası. Üstte canlı "önlenen israf" rakamları.
2. **`/report`** — Vatandaş portalı. Haritada çakışan iş emirleri kırmızı çizgiyle bağlı.
3. **`/dashboard`** — Admin paneli. **"AI Çakışma Analizi Çalıştır"** butonuna bas.
4. AI birkaç saniyede Türkçe raporu üretir: çakışmayı açıklar, ~1.6M TL israfı belirtir, kazıyı asfalttan önceye almayı önerir.
5. **"Yeniden Planla"** butonuyla öneri tek tıkla uygulanır → çakışma çözülür.

---

## 📂 Proje Yapısı

```
src/
├── app/
│   ├── (citizen)/
│   │   ├── page.tsx          # Açılış sayfası (/)
│   │   └── report/page.tsx   # Vatandaş portalı (/report)
│   ├── (admin)/
│   │   └── dashboard/        # Admin paneli (/dashboard)
│   └── api/
│       ├── agent/            # AI ajan endpoint'i (streaming)
│       ├── conflicts/        # Deterministik çakışma raporu
│       ├── reports/          # Vatandaş ihbarları CRUD
│       └── work-orders/      # İş emirleri CRUD
├── components/
│   ├── shared/               # CityMap, ConflictPanel, ReportForm
│   └── ui/                   # StatCard, Button, Card, Badge
├── lib/
│   ├── ai/                   # Prompt'lar, AI araçları, çıktı ayrıştırıcı
│   ├── conflictEngine.ts     # Deterministik çakışma motoru
│   └── utils.ts              # Mesafe & tarih örtüşme hesapları
└── db/                       # Drizzle şeması, seed verisi
```

---

## 🌱 Sürdürülebilir Kalkınma Etkisi

CitySync AI doğrudan **SKH 11 — Sürdürülebilir Şehirler ve Topluluklar** ile **SKH 12 — Sorumlu Üretim ve Tüketim** hedeflerine hizmet eder:

- **Önlenen bütçe israfı** — kamu kaynağı doğru kullanılır.
- **Azaltılan CO₂** — gereksiz inşaat, makine ve malzeme üretimi engellenir.
- **Kurtarılan yol & vatandaş konforu** — aynı cadde iki kez kapatılmaz.

> Etki rakamları (₺1.6M, 25 ton CO₂ vb.) muhafazakâr **tahmini** planlama değerleridir; faturalanmış tutarlar değildir.

---

## 👥 Ekip — Team Zetora

| İsim                    | Sorumluluk                                                |
| ----------------------- | --------------------------------------------------------- |
| **Cengizhan Göçer**     | Proje liderliği, backend, çakışma motoru, AI entegrasyonu |
| **Hüseyin Taha Adanur** | Vatandaş portalı, harita arayüzü                          |
| **Ozan Osman Akan**     | Admin paneli, AI sonuç paneli                             |
