# 🎤 CitySync AI — Jüri Sunumu

> Toplam süre hedefi: **5 dakika sunum + 3 dakika demo + soru-cevap**
> Her slayt için altta konuşma metni ("Konuşma:") verilmiştir — ezberlemeyin, anlatın.

---

## Slayt 1 — Açılış (15 sn)

**CitySync AI**
*Erzurum'da altyapı çalışmaları artık çakışmıyor.*

Team Zetora · 2026 Yapay Zeka ve Sürdürülebilir Kalkınma Hackathonu

> **Konuşma:** "Merhaba, biz Team Zetora. Bugün size belediyelerin yıllardır çözemediği bir israf problemini, yapay zeka ile nasıl çözdüğümüzü göstereceğiz."

---

## Slayt 2 — Problem (45 sn)

**Aynı caddeyi iki kez kazıyoruz.**

- Asfalt Müdürlüğü caddeyi yeniler.
- 1 hafta sonra Su Müdürlüğü aynı caddeyi kazar.
- Yeni asfalt çöpe gider.

📉 Çalışma başına **~1.6 milyon TL** israf · **~25 ton CO₂** ek emisyon

> **Konuşma:** "Belediyede her müdürlük kendi takvimini ayrı yapıyor. Kimse diğerinin ne zaman nerede çalışacağını bilmiyor. Sonuç: yeni dökülen asfalt bir hafta sonra su borusu için kazılıyor. Bu, Erzurum'un değil, Türkiye'deki her şehrin sorunu. Tek bir çakışma 1.6 milyon liraya ve 25 ton karbona mal oluyor."

---

## Slayt 3 — Çözüm (45 sn)

**CitySync AI — 3 katmanlı koordinasyon**

1. 🔍 **Deterministik Motor** — 300 m yakınlık + tarih örtüşmesi → kesin çakışma tespiti
2. 🤖 **Gemini AI Ajanı** — çakışmayı yorumlar, vatandaş ihbarlarıyla birleştirir, Türkçe öneri üretir
3. ⚡ **Eylem** — önerilen yeni tarih tek tıkla uygulanır

> **Konuşma:** "Çözümümüz üç katmanlı. Önce deterministik bir motor, tüm iş emirlerini matematiksel olarak tarıyor — yapay zekaya bağımlı değil, her zaman çalışıyor. Sonra Gemini yapay zekası bu bulguları alıp vatandaş ihbarlarıyla birleştiriyor ve uygulanabilir, Türkçe bir öneri üretiyor. En önemlisi: admin bu öneriyi tek tıkla uyguluyor. Sadece tespit değil, çözüm sunuyoruz."

---

## Slayt 4 — Neden Hem Motor Hem AI? (30 sn)

| Deterministik Motor | Yapay Zeka |
|---|---|
| Asla yanılmaz, asla boş ekran | Açıklar, önceliklendirir, önerir |
| Kesin sayılar (mesafe, gün, ₺) | İnsan diliyle gerekçe |

→ AI mesafe **hesaplamaz** — motorun kesin sayılarını kullanır.

> **Konuşma:** "Burası kritik: Yapay zekaya 'mesafeyi sen hesapla' demiyoruz, çünkü halüsinasyon yapabilir. Mesafeyi, günü, bütçeyi deterministik motor veriyor; yapay zeka sadece yorumluyor ve öneriyor. Bu yüzden hem güvenilir hem akıllı."

---

## Slayt 5 — CANLI DEMO (3 dk)

**Ekranı paylaş, şu sırayı izle:**

1. **`/`** → "Bakın, bu sezon AI'ın önlediği israf: canlı rakamlar."
2. **`/report`** → "Vatandaş portalı. Haritadaki kırmızı çizgi: iki müdürlük aynı noktada çakışıyor."
3. **`/dashboard`** → "AI Çakışma Analizi Çalıştır" butonuna **bas**.
4. AI raporu akarken: "Gemini şu an iş emirlerini, vatandaş ihbarlarını inceliyor… İşte: Cumhuriyet Caddesi'nde 7 günlük çakışma, 1.6 milyon TL risk."
5. **"Yeniden Planla"** butonuna **bas** → "Ve çakışma çözüldü. Etki paneli güncellendi."

> **Yedek plan:** İnternet/AI çökerse → "Deterministik motor AI olmadan da çalışıyor" diyerek `/api/conflicts` çıktısını veya zaman çizgisini göster.

---

## Slayt 6 — Sürdürülebilirlik Etkisi (30 sn)

**SKH 11 & SKH 12'ye doğrudan katkı**

- 💰 Önlenen bütçe israfı → kamu kaynağı korunur
- 🌱 Azaltılan CO₂ → gereksiz üretim engellenir
- 🛣️ Kurtarılan yol → vatandaş konforu

> **Konuşma:** "Bu sadece bir koordinasyon aracı değil. Birleşmiş Milletler Sürdürülebilir Kalkınma Hedefleri 11 ve 12 ile doğrudan örtüşüyor: sürdürülebilir şehirler ve sorumlu kaynak kullanımı. Önlediğimiz her çakışma; tasarruf edilen bütçe, solunmayan karbon ve rahatsız edilmeyen bir mahalle demek."

---

## Slayt 7 — Teknoloji & Kapanış (30 sn)

**Next.js 16 · TypeScript · Gemini 2.5 Flash · Vercel AI SDK v6 · Drizzle**

- Tam Türkçe arayüz ve AI çıktıları
- AI başarısız olsa bile çalışan yedek motor
- Bugün kurulup yarın belediyede kullanılabilir

**CitySync AI — şehri iki kez kazma.**

> **Konuşma:** "Modern bir yığınla, üretime hazır şekilde geliştirdik. Yapay zeka çökse bile sistem çalışmaya devam ediyor. Bu prototip bugün kurulabilir. Teşekkürler — sorularınızı bekliyoruz."

---

## 🎯 Olası Jüri Soruları & Cevaplar

**S: Veriyi belediyeden nasıl alacaksınız?**
C: Her müdürlüğün zaten dijital iş emri kaydı var. CitySync bu kayıtları tek havuzda toplayan bir entegrasyon katmanı. API hazır; mevcut sistemlere bağlanır.

**S: 1.6 milyon TL rakamı nereden geliyor?**
C: Muhafazakâr bir planlama tahmini — yol uzunluğu, asfalt m² maliyeti ve yeniden serim üzerinden. Faturalanmış tutar değil, "tahmini" olarak sunuyoruz.

**S: Yapay zeka yanlış öneri verirse?**
C: AI sadece öneriyor; son kararı admin veriyor. Ayrıca sayılar AI'dan değil, deterministik motordan geliyor — halüsinasyon riski yok.

**S: 300 metre ve 1 gün eşiğini neden seçtiniz?**
C: Tipik bir şehir içi şantiyenin trafik/etki yarıçapı ve takvim çözünürlüğü. Parametreler kod içinde tek yerden ayarlanabilir.

**S: Ölçeklenir mi?**
C: Motor saf bir fonksiyon — şehir genelinde binlerce iş emrini saniyeler içinde tarar. Diğer şehirlere kopyalanabilir.

---

## ✅ Sunum Öncesi Kontrol Listesi

- [ ] `npm run db:seed` çalıştırıldı (bilinçli çakışma yüklü)
- [ ] `npm run dev` açık, `/`, `/report`, `/dashboard` test edildi
- [ ] Gemini API anahtarı `.env.local` içinde geçerli
- [ ] AI analizi en az bir kez başarıyla denendi (cold start gecikmesi olmasın)
- [ ] İnternet yedeği hazır (mobil hotspot)
- [ ] Ekran paylaşımı / projeksiyon önceden test edildi
- [ ] Konuşmacı sırası belli: kim hangi slaytı anlatıyor
