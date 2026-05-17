# 🏙️ CitySync AI

> **Erzurum'da altyapı çalışmaları artık çakışmıyor.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-4285f4?logo=google&logoColor=white)](https://aistudio.google.com)
[![Vitest](https://img.shields.io/badge/Vitest-28_test-6e9f18?logo=vitest&logoColor=white)](https://vitest.dev)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

**CitySync AI**, belediye müdürlüklerinin iş emirlerini yapay zeka ile koordine eden, aynı caddeyi iki kez kazmayı önleyen bir karar destek platformudur. Yeni dökülen asfaltın bir hafta sonra su borusu için kazılmasını — milyonlarca liralık israfı ve tonlarca karbon emisyonunu — planlama aşamasında engeller.

📍 _2026 Kamuda Dijital Dönüşüm ve Yapay Zeka Hackathonu · Bilim Erzurum_  
👥 _Team Zetora_

---

## İçindekiler

- [Problem](#-çözdüğümüz-problem)
- [Çözüm](#-çözümümüz)
- [Özellikler](#-özellikler)
- [Teknoloji Yığını](#️-teknoloji-yığını)
- [Mimari](#-mimari)
- [Kurulum ve Çalıştırma](#-kurulum-ve-çalıştırma)
- [Testler](#-testler)
- [Demo Senaryosu](#-demo-senaryosu)
- [Proje Yapısı](#-proje-yapısı)
- [Sürdürülebilirlik Etkisi](#-sürdürülebilirlik-etkisi)
- [Ekip](#-ekip--team-zetora)

---

## 🎯 Çözdüğümüz Problem

Belediyelerde her müdürlük (Asfalt, Su ve Kanalizasyon, Elektrik, Doğalgaz) kendi takvimini bağımsız yapar. Sonuç:

- Asfalt Müdürlüğü bir caddeyi yeniler → 1 hafta sonra Su Müdürlüğü aynı caddeyi kazar.
- Yeni asfalt tahrip olur, yeniden dökülür → **çalışma başına ~1.6 milyon TL israf**, **~25 ton CO₂** ek emisyon.
- Vatandaş aynı yolda iki kez trafiğe ve toza katlanır.

Bu, Türkiye'deki neredeyse her şehrin yaşadığı, koordinasyon eksikliğinden kaynaklanan kronik bir kaynak israfıdır.

---

## 💡 Çözümümüz

CitySync AI üç katmanlı çalışır:

```
Vatandaş İhbarı  ─┐
İş Emirleri DB   ─┼──▶ Deterministik Motor ──▶ AI Ajanı (Gemini) ──▶ Admin Eylemi
Konum Verileri   ─┘        (300 m + tarih)       (öneri + gerekçe)    (tek tık)
```

1. **Deterministik Çakışma Motoru** — Tüm iş emiri çiftlerini tarar. _300 metre yakınlık + en az 1 gün tarih örtüşmesi_ = çakışma. AI'a bağımlı değildir; her zaman çalışır ve kesin sayılar üretir.
2. **Yapay Zeka Ajanı (Gemini 2.5 Flash)** — Motorun bulgularını alır, vatandaş ihbarlarıyla ilişkilendirir, Türkçe gerekçeli ve uygulanabilir öneriler üretir.
3. **Eylem Katmanı** — Admin, AI'ın önerdiği yeni tarihi tek tıkla uygular. Çakışma anında çözülür.

### Neden hem motor hem AI?

| Katman | Güçlü Yönü | Neden Gerekli? |
|---|---|---|
| Deterministik Motor | Her zaman çalışır, kesin sayı | Demo güvenilirliği, AI olmadan da işe yarar |
| Gemini AI | Türkçe açıklama, önceliklendirme | Sayıları yorumlar, aksiyona dönüştürür |

---

## ✨ Özellikler

| Modül | Açıklama |
|---|---|
| 🗺️ **Vatandaş Portalı** (`/report`) | Harita üzerinden sorun bildirme; mevcut ihbarları ve iş emirlerini görüntüleme |
| 📍 **Haritada Konum Seçimi** | Haritaya tıklayarak, sürükleyerek veya GPS ile konum belirleme |
| 🔗 **Çakışma Görselleştirme** | Çakışan iş emirleri haritada renkli kesikli çizgilerle eşleştirilir |
| 🔥 **İhbar Isı Haritası** | Vatandaş ihbarlarının yoğunlaştığı bölgeler açılıp kapanan ısı katmanıyla görülür |
| 📋 **Rapor Listesi** | Tüm ihbarlar filtrelenebilir kart listesinde; karta tıklayınca haritada vurgulanır |
| 🤖 **AI Çakışma Analizi** (`/dashboard`) | Tek tıkla tüm iş emirlerini tarar, Türkçe gerekçeli rapor üretir |
| 📅 **30 Gün Risk Analizi** | Önümüzdeki 30 günü aciliyet sıralamasıyla değerlendiren özel AI prompt |
| 💰 **Etki Paneli** | Önlenen bütçe kaybı (₺), CO₂ tasarrufu (kg), kurtarılan yol (m) — gerçek zamanlı |
| 📅 **Zaman Çizgisi (Gantt)** | İş emirleri takvim üzerinde; AI çakışma tespitinden sonra çakışanlar kırmızı |
| ⚡ **Tek Tıkla Yeniden Planlama** | AI'ın önerdiği yeni tarihi doğrudan `PATCH /api/work-orders/:id` ile uygular |
| 🌐 **Tam Türkçe** | Tüm arayüz ve AI çıktıları Türkçe |

---

## 🛠️ Teknoloji Yığını

| Katman | Teknoloji | Versiyon | Neden seçildi? |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.2.6 | SSR + API routes tek çatıda, Turbopack ile hızlı geliştirme |
| Dil | TypeScript | 6 | Tip güvenliği; özellikle AI çıktı şemaları için kritik |
| Yapay Zeka | Vercel AI SDK + Gemini 2.5 Flash | ai@6, @ai-sdk/google@3 | Streaming, tool-use desteği; Gemini kotası ücretsiz |
| Veritabanı | SQLite + Drizzle ORM | libsql@0.17 | Sıfır kurulum; demo için ideal |
| Harita | Leaflet | 1.9.4 | Açık kaynak, hafif, plugin ekosistemi |
| Arayüz | Tailwind CSS | v4 | Yeni PostCSS tabanlı mimari, config dosyası gerektirmiyor |
| İkonlar | lucide-react | 1.16 | Tree-shakeable, tutarlı tasarım |
| Test | Vitest | 4.1.6 | Jest uyumlu, TypeScript için yerel destek |
| Doğrulama | Zod | 4 | AI çıktılarını runtime'da doğrulama |

---

## 🏗️ Mimari

```
src/
├── app/
│   ├── (citizen)/
│   │   ├── page.tsx            # Açılış sayfası — canlı etki rakamları
│   │   └── report/page.tsx     # Vatandaş portalı (/report)
│   ├── (admin)/
│   │   └── dashboard/          # Admin paneli (/dashboard)
│   └── api/
│       ├── agent/route.ts      # AI ajan endpoint — streaming, tool-use
│       ├── conflicts/route.ts  # GET: deterministik çakışma raporu
│       ├── reports/route.ts    # GET + POST: vatandaş ihbarları
│       └── work-orders/
│           └── [id]/route.ts   # PATCH: yeniden planlama
│
├── components/
│   ├── shared/
│   │   ├── CityMap.tsx         # Leaflet harita — marker, çizgi, ısı katmanı
│   │   ├── ConflictPanel.tsx   # AI sonuç paneli — streaming mesajları render
│   │   ├── ReportForm.tsx      # Sorun bildir formu — GPS + harita senkronizasyonu
│   │   └── ReportList.tsx      # Filtrelenebilir ihbar kartları
│   └── ui/
│       └── StatCard.tsx        # Etki istatistik kartı
│
├── lib/
│   ├── conflictEngine.ts       # Çakışma motoru — mesafe + tarih algoritması
│   ├── utils.ts                # haversine mesafesi, tarih örtüşmesi
│   └── ai/
│       ├── agent.ts            # Gemini ajan tanımı ve system prompt
│       ├── conflictParser.ts   # AI metninden JSON çıkarma (regex + JSON.parse)
│       └── tools.ts            # AI araçları: getWorkOrders, getReports
│
└── db/
    ├── schema.ts               # Drizzle şeması: workOrders + reports
    ├── seed.ts                 # Demo veri — bilinçli çakışma içerir
    └── index.ts                # libsql bağlantısı
```

### Veri Akışı

```
Admin "AI Analizi Çalıştır" butonuna basar
    │
    ▼
POST /api/agent  (prompt gönderilir)
    │
    ├─ AI tool çağırır: getWorkOrders() → DB'den iş emirleri
    ├─ AI tool çağırır: getReports()   → DB'den vatandaş ihbarları
    │
    ▼
Gemini 2.5 Flash — çakışmaları analiz eder, JSON formatında rapor üretir (streaming)
    │
    ▼
ConflictPanel.tsx — parseConflictReportFromText() ile JSON'u ayrıştırır
    │
    ├─ Çakışma kartları render edilir (şiddet, mesafe, örtüşme, bütçe etkisi)
    └─ "Yeniden Planla" butonu → PATCH /api/work-orders/:id
```

---

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler

- **Node.js 20+**
- **Gemini API anahtarı** — [aistudio.google.com/apikey](https://aistudio.google.com/apikey) adresinden ücretsiz alınır (kredi kartı gerekmez)

### Adım Adım Kurulum

```bash
# 1. Repoyu klonla
git clone https://github.com/team-zetora/citysync-ai.git
cd citysync-ai

# 2. Bağımlılıkları yükle
npm install

# 3. Ortam değişkenlerini ayarla
cp .env.local.example .env.local
# .env.local dosyasını açıp GOOGLE_GENERATIVE_AI_API_KEY değerini gir

# 4. Veritabanını oluştur
npm run db:push

# 5. Demo verilerini yükle (bilinçli çakışma dahil)
npm run db:seed

# 6. Geliştirme sunucusunu başlat
npm run dev
```

Uygulama **[http://localhost:3000](http://localhost:3000)** adresinde açılır.

### Tüm Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Turbopack ile geliştirme sunucusu |
| `npm run build` | Üretim derlemesi |
| `npm run start` | Üretim sunucusunu başlat |
| `npm run lint` | ESLint denetimi |
| `npm run db:push` | Drizzle şemasını SQLite'a uygula |
| `npm run db:seed` | Demo veriyi yükle (veritabanını sıfırlar) |
| `npm run db:studio` | Drizzle Studio — tarayıcıda DB görüntüle |
| `npm test` | Tüm testleri çalıştır |
| `npm run test:watch` | İzleme modunda testler |

---

## 🧪 Testler

Proje **28 birim testi** içerir; tamamı geçmektedir (`npm test`).

### Test Dosyaları

#### `src/lib/conflictEngine.test.ts` — Çakışma Motoru (9 test)

Deterministik çakışma motorunun temel iş mantığını test eder:

| Test | Ne doğrulanır? |
|---|---|
| Demo çakışması (asfalt + su) | `HIGH` şiddet, 0 m mesafe, 7 gün örtüşme |
| Uzak iş emirleri (>300 m) | Çakışma yok |
| Tarih örtüşmesi yok | Çakışma yok |
| Yakın ama aynı site değil (50–300 m) | `MEDIUM` şiddet |
| Aynı sitede (<50 m) farklı tür | `HIGH` şiddet |
| Boş / tek iş emiri listesi | Güvenli dönüş |
| Sıralama: HIGH önce MEDIUM | Sıra doğruluğu |
| `Date` nesnesi girdisi | ISO string ve Date uyumu |
| Türkçe müdürlük isimleri | Asfalt tanıma + bütçe etkisi |

#### `src/lib/ai/conflictParser.test.ts` — AI Çıktı Ayrıştırıcı (15 test)

AI'ın ürettiği metin içinden JSON çıkarmayı ve edge-case'leri doğrular:

- Ham JSON string ayrıştırma
- Markdown kod bloğu içindeki JSON (`\`\`\`json ... \`\`\``)
- Eksik alan toleransı
- Geçersiz JSON → `null` dönüşü
- `budgetImpact` sayı ve string varyantları

#### `src/lib/utils.test.ts` — Yardımcı Fonksiyonlar (4 test)

- Haversine mesafe formülü doğruluğu
- Tarih örtüşmesi hesabı

### Testleri Çalıştırma

```bash
# Tüm testleri çalıştır ve sonuçları göster
npm test

# İzleme modunda (dosya değişince otomatik yeniden çalışır)
npm run test:watch
```

Beklenen çıktı:
```
✓ src/lib/utils.test.ts (4)
✓ src/lib/conflictEngine.test.ts (9)
✓ src/lib/ai/conflictParser.test.ts (15)

Test Files  3 passed (3)
Tests      28 passed (28)
```

---

## 🧭 Demo Senaryosu

`npm run db:seed` komutu sahneyi **bilinçli bir çakışmayla** kurar:

| İş Emri | Müdürlük | Tarih | Konum |
|---|---|---|---|
| #1 | Asfalt Müdürlüğü | 1–15 Haziran 2026 | Cumhuriyet Caddesi |
| #2 | Su ve Kanalizasyon Müdürlüğü | 8–20 Haziran 2026 | Cumhuriyet Caddesi (**aynı nokta**) |

→ **7 günlük örtüşme, 0 m mesafe.** Yeni asfalt kazılacak.

### Sunum Akışı (5 dakika)

1. **`/`** — Açılış sayfası. Üstte canlı "önlenen israf" rakamları görünür.
2. **`/report`** — Vatandaş portalı. Haritada:
   - İş emirleri renkli marker ile işaretli
   - Çakışan iş emirleri kırmızı kesikli çizgiyle bağlı
   - "🔥 Isı Haritası" butonu ile vatandaş ihbar yoğunluğu görülür
   - Haritaya tıklayarak yeni rapor konumu seçilebilir
3. **`/dashboard`** — Admin paneli.
   - "**AI Çakışma Analizi Çalıştır**" butonuna bas.
   - AI birkaç saniyede streaming Türkçe rapor üretir: çakışmayı açıklar, tahmini ~1.6M TL israfı belirtir, kazıyı asfalttan önceye almayı önerir.
   - "**Yeniden Planla**" butonuyla öneri tek tıkla uygulanır → çakışma çözülür.
4. `npm run db:seed` ile demo verisi sıfırlanabilir.

---

## 🌱 Sürdürülebilirlik Etkisi

CitySync AI doğrudan **SKH 11 — Sürdürülebilir Şehirler ve Topluluklar** ile **SKH 12 — Sorumlu Üretim ve Tüketim** hedeflerine hizmet eder:

| Etki | Açıklama |
|---|---|
| 💰 **Önlenen bütçe israfı** | Önlenen her asfalt+kazı çakışması başına ~₺1.6M kamu kaynağı korunur |
| 🌱 **Azaltılan CO₂** | Gereksiz inşaat makinesi kullanımı ve malzeme üretiminden ~25 ton CO₂ azalır |
| 🛣️ **Kurtarılan yol** | Aynı cadde iki kez kapatılmaz; vatandaş konforu ve trafik akışı korunur |
| 📊 **Ölçülebilir etki** | Açılış sayfasında ve admin panelinde gerçek zamanlı etki rakamları |

> Etki rakamları (₺1.6M, 25 ton CO₂ vb.) muhafazakâr tahmini planlama değerleridir.

---

## 👥 Ekip — Team Zetora

| İsim | Sorumluluk |
|---|---|
| **Cengizhan Göçer** | Proje liderliği · Backend · Çakışma motoru · AI entegrasyonu · Veritabanı |
| **Hüseyin Taha Adanur** | Vatandaş portalı · Harita arayüzü · Isı haritası · GPS konum |
| **Ozan Osman Akan** | Admin paneli · AI sonuç paneli · Etki istatistikleri · Zaman çizgisi |

---

## 📄 Lisans

MIT © 2026 Team Zetora
