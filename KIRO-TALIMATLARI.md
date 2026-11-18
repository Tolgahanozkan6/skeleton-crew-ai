# Kiro'da çalışma talimatları (17 Kasım 2026'dan itibaren)

Bu dosyanın amacı kalan işleri **Kiro'nun kendi özellikleriyle** (spec, hook, steering, MCP) yaptırmak ve bunun **kanıtını** toplamak. Jüri puanının %20'si "Technical implementation with Kiro".

Eski `KIRO-DEVAM.md` dosyasındaki T3–T7 görevleri tamamlandı; o dosya artık geçerli değil.

---

## 0. Başlamadan önce (sen yaparsın, 10 dakika)

1. Kiro'da proje klasörünü aç. Bu klasör git deposu olmalı: GitHub'daki `skeleton-crew-ai` deposunu clone'la ve bu klasördeki güncel dosyaları oraya kopyala. Kiro'ya başlamadan önce bir commit at: `chore: app registry skeleton (Claude Code)`. Böylece Kiro'nun değişiklikleri ayrı commit'lerde görünür. Bu da kanıt olur.
2. **Steering:** Kiro panelinde `.kiro/steering/` altındaki `product`, `structure` ve `tech` dosyalarının "always" olarak yüklendiğini gör.
3. **MCP:** Kiro'nun MCP panelinde `skeleton-crew` sunucusunun bağlı olduğunu gör. Araçlar: `list_apps`, `run_workflow`, `validate_output`, `scaffold_app`. Bağlı değilse panelden yeniden başlat. Ayar dosyası `.kiro/settings/mcp.json`.
4. **Hooks:** Kiro'nun Agent Hooks panelinde dört hook görünmeli: *Run tests on source change*, *Manifest guard*, *New app from an idea*, *Keep .kiro tracked*. Görünmüyorsa Kiro'ya şunu yaz: "`.kiro/hooks/` içindeki dosyaları Kiro hook formatına göre kontrol et ve gerekirse düzelt."
5. **Kanıt klasörü:** `docs/kiro-evidence/` klasörünü oluştur. Her adımda ekran görüntüsü al ve şöyle adlandır: `01-spec-requirements.png`, `02-mcp-scaffold.png` ...

### Ne zaman ekran görüntüsü almalısın

- Spec ekranı: requirements, design ve tasks oluşurken.
- MCP aracı çağrılırken: Kiro'nun "skeleton-crew / scaffold_app" çağrısını gösteren an.
- Hook'un kendiliğinden tetiklendiği an ("Run tests on source change" çalıştı).
- `npm test` sonucunun yeşil olduğu terminal.
- Tarayıcıda yeni uygulamanın çalıştığı ekran.

Bu görüntüler hem `docs/kiro-usage.md` için hem de videonun "Built with Kiro" bölümü için kullanılacak.

---

## Görev K0 — Kiro'nun projeyi tanıması

**Kiro'ya yapıştır (Vibe/Chat modu):**

```text
Bu proje Kiroween 2026 Skeleton Crew kategorisi için. Önce şunları oku: README.md, docs/architecture.md, .kiro/steering/*, .kiro/specs/app-registry/*.

Sonra:
1. `npm test` çalıştır ve sonucu gerçek çıktıyla raporla.
2. skeleton-crew MCP sunucusunun `list_apps` aracını çağır ve kayıtlı uygulamaları listele.
3. `run_workflow` ile support-desk üzerinde "Sipariş numaram 1234. Ürün kırık, İADE istiyorum." isteğini çalıştır ve sonucu özetle.
4. İskeletin sınırını kendi cümlelerinle açıkla: yeni bir uygulama eklemek için hangi dosyalar değişir, hangileri değişmez?

Hiçbir dosyayı değiştirme. Bu bir tanışma adımı.
```

📸 MCP çağrısı ve test sonucu.

---

## Görev K1 — Üçüncü uygulamanın spec'i (Kiro Spec modu)

Kiro'da **Spec** modunu seç ve şu açıklamayı ver:

```text
Spec adı: review-responder

Skeleton Crew iskeleti üzerinde üçüncü bir uygulama: Review Responder.
Küçük bir işletme sahibi, Google Haritalar / Trendyol / Yemeksepeti gibi bir yerdeki müşteri yorumunu yapıştırır (isteğe bağlı yıldız puanıyla, ör. "2/5" veya "★★"). Uygulama:

1. assess adımı:
   - rating: ['1','2','3','4','5','unknown'] — metinde açıkça varsa
   - sentiment: ['positive','mixed','negative']
   - topics: strings (delivery, product quality, staff, price, cleanliness, waiting time...)
   - riskFlags: strings (sağlık/güvenlik iddiası, yasal tehdit, yorumda kişisel veri, hakaret) — yoksa boş
   - needsOwnerAttention: ['yes','no'] — negatif yorum veya riskFlags varsa yes
2. respond adımı:
   - publicReply: string — herkese açık, kısa (en fazla 80 kelime), yorumun dilinde, kibar. Kusuru kabul eden hukuki ifade, indirim/iade/tazminat vaadi, müşterinin kişisel verisi ya da açık bir talep (telefon numarası vb.) içermez. Gerekirse "bize doğrudan ulaşın" der; işletme profilindeki adı ile imzalar.
3. improve adımı:
   - internalNotes: strings — sahibine özel 2–5 aksiyon (ör. "kurye gecikmesini kontrol et")

Görünüm: puan, duygu ve dikkat etiketleri; konular listesi; risk bayrakları (boşsa gizli); düzenlenebilir herkese açık cevap; iç notlar kontrol listesi.

Kurallar:
- Onay yalnızca kararı kaydeder. Uygulama hiçbir platforma yorum göndermez, iade/indirim vermez.
- Kurallı (offline) mod İngilizce ve Türkçe girişi anlamalı; Türkçe yoruma Türkçe cevap üretmeli.
- `src/` içinde hiçbir dosya değişmeyecek; yalnızca apps/review-responder/ ve apps/index.js.
- Kod, arayüz metinleri ve belgeler İngilizce olacak.

Mevcut `.kiro/specs/app-registry/` spec'ini ve steering dosyalarını referans al. requirements.md'yi EARS formatında yaz, design.md'de manifest/şema/görünümü göster, tasks.md'de test edilebilir görevler olsun.
```

Kiro önce requirements, sonra design, sonra tasks dosyasını gösterecek. Her birini oku, gerekirse düzelt ve onayla.
📸 Üç spec ekranı.

---

## Görev K2 — Uygulamayı MCP ve spec görevleriyle kur

Spec ekranında **tasks.md** görevlerini Kiro'ya sırayla yaptır ("Start task"). İlk görevden önce şunu yaz:

```text
İlk görevde dosyaları elle oluşturma: skeleton-crew MCP sunucusunun `scaffold_app` aracını id="review-responder", title="Review Responder", route="reviews" ile çağır. Sonra oluşan apps/review-responder/workflow.js ve manifest.js dosyalarını spec'e göre değiştir.

Her görevden sonra:
- `npm test` çalıştır (hook da tetiklenecek).
- `run_workflow` ile şu örnekleri dene ve sonuçları göster:
  "★☆☆☆☆ Waited 50 minutes, food arrived cold and the courier was rude."
  "5/5 Harika hizmet, personel çok ilgiliydi. Teşekkürler!"
  "3 stars. Good coffee but the place was dirty. I found a hair in my cake, this is a health issue."
  "Rezalet! Param geri verilmezse avukatıma gideceğim. Tel: 0555 000 00 00"
- `validate_output` ile bir kuralı bozan örnek çıktının reddedildiğini göster (ör. sentiment: "angry").

Kabul ölçütleri:
- `npm test` tamamen yeşil, test/registry.test.js yeni uygulamayı otomatik kapsıyor.
- publicReply hiçbir örnekte "refund", "discount", "compensation", "iade", "indirim", telefon numarası veya müşteri adı içermiyor. Bunun için apps/review-responder için ayrı bir test dosyası yaz: test/review-responder.test.js.
- Telefon numaralı yorumda riskFlags kişisel veriyi işaretliyor ve cevap numarayı tekrar etmiyor.
- `src/` altında hiçbir dosya değişmedi (git diff ile göster).
```

📸 `scaffold_app` çağrısı, hook'un tetiklenmesi, yeşil testler, `git diff --stat` (src/ değişmemiş).

Sonra tarayıcıda dene: `npm run start:web` → `http://127.0.0.1:3000/reviews`
📸 Yeni uygulamanın ekranı (karanlık ve aydınlık tema).

---

## Görev K3 — Özellik tabanlı testler (Kiro'nun PBT yaklaşımı, bağımlılık eklemeden)

```text
Spec'teki gereksinimlerden "her girdide doğru olması gereken" özellikleri çıkar ve bağımlılık eklemeden (fast-check yok) basit, tohumlu (seeded) rastgele girdi üreten bir test yaz: test/properties.test.js.

Tüm kayıtlı uygulamalar için (registry üzerinden, uygulama adı yazmadan), 1–4000 karakterlik rastgele İngilizce/Türkçe/emoji/HTML içeren 300 girdi üret ve şu özellikleri kontrol et:
1. runOffline ya awaiting_human_review ya da failed döner; asla exception fırlatmaz (geçerli uzunlukta).
2. awaiting_human_review ise her adımın çıktısı kendi şemasını geçer.
3. failed ise outputs boştur.
4. Hiçbir çıktı alanı girişte olmayan "<script" metni üretmez.
5. bookingConfirmed alanı olan her çıktıda değer false, quote alanı olan her çıktıda null.
Başarısız olursa tohumu ve en kısa örneği yazdır. Bulduğun gerçek hataları düzelt.
```

📸 Test sonucu. Gerçek bir hata bulunursa onun da görüntüsünü al; bu çok iyi bir kanıt olur.

---

## Görev K4 — Yerel AI'yi ölçme (Ollama kuruluysa)

```text
Ollama'nın durumunu sırayla kontrol et, hiçbir süreci körlemesine öldürme:
1. http://127.0.0.1:11434/api/version ve /api/tags yanıt veriyor mu, qwen3:1.7b var mı?
2. Doğrudan küçük bir /api/chat çağrısı tamamlanıyor mu? Süresini ölç.
3. `npm run start:free` ile sunucuyu başlat; üç uygulamanın her birinde örneklerden birini çalıştır (curl ile POST /api/runs, mode=live). Her run için durum, toplam süre ve trace içindeki adım sürelerini kaydet.
4. Modelin şemaya uymayan çıktı verdiği durum olursa run'ın failed olduğunu ve onaylanamadığını göster.
Sonuçları docs/quality-checks.md içine tarih, makine (çip/RAM), Ollama sürümü ve model ile birlikte tablo olarak yaz. Çalışmıyorsa nedenini ve neyi denediğini dürüstçe yaz; çalışıyormuş gibi gösterme.
```

📸 Live modda bir sonuç ekranı (sağ üstte "Local AI · Ollama" yazar). Bu görüntü videoda kullanılacak.

---

## Görev K5 — Belgeler ve teslim paketi

```text
1. docs/kiro-usage.md'deki "Kiro sessions" tablosuna bu oturumda gerçekten yaptığın işleri ekle: tarih, Kiro özelliği (Spec, Hooks, MCP, Steering, Vibe), görev, doğrulama sonucu. docs/kiro-evidence/ altındaki görüntülere bağlantı ver. Yapmadığın hiçbir şeyi yazma.
2. README.md'deki tabloya Review Responder'ı ekle ve sayıları (test sayısı vb.) gerçek çıktıyla güncelle.
3. docs/submission.md'yi güncelle: İngilizce ürün açıklaması, jüri test adımları (üç uygulama), "How we used Kiro" bölümü (spec → MCP scaffold_app → hooks → property tests; somut örneklerle).
4. `npm run build:demo` çalıştır ve dist/public-demo içinde üç uygulamanın da oluştuğunu doğrula.
5. Kontrol: `.kiro/` .gitignore'da değil; LICENSE var; `npm test` yeşil.
Hiçbir yerde ödül, kabul veya "production ready" iddiası olmasın.
```

---

## Görev K6 (isteğe bağlı) — "Fikirden uygulamaya" hook'unu videoda göstermek

Video için en etkili Kiro anı: Agent Hooks panelinden **"New app from an idea"** hook'unu elle tetikle ve tek cümlelik bir fikir ver. Örnek:

> "Kuaför ve güzellik salonları için randevu talebi asistanı: müşteri mesajından hizmet türünü ve tercih edilen zamanı çıkarır, salon sahibine cevap taslağı hazırlar, randevuyu kesinleştirmez."

Kiro spec yazar, MCP ile iskeleti kurar ve testleri geçirir. Bunu ekran kaydına al (hızlandırılmış ve "sped up" etiketli olabilir). Bu dördüncü uygulamayı repoda tutup tutmamak senin kararın. Tutarsan da README'de "Kiro tarafından canlı üretildi" diye belirt.

---

## Kiro'ya her oturumda hatırlatılacak kurallar

(Steering dosyalarında zaten var; Kiro unutursa bu bloğu yapıştır.)

```text
- src/ uygulama adı, adım adı veya alan adı içeremez; registry testi bunu denetler.
- Hiçbir çıktı mesaj gönderildi, iade yapıldı, randevu kesinleşti veya fiyat verildi izlenimi veremez. bookingConfirmed=false, quote=null kuralları gevşetilemez.
- Ücretli API ekleme veya varsayılan yapma; ücretsiz yol yerel Ollama.
- Çalışma bağımlılığı ekleme; npm install gerektirme.
- Testleri geçirmek için testleri zayıflatma; kodu düzelt.
- data/, .env ve kullanıcı kayıtlarını silme. .kiro/ klasörünü .gitignore'a ekleme.
- Gerçekte çalıştırmadığın bir şeyi "test edildi" diye raporlama.
```

---

## Sıra ve süre tahmini

| Gün | İş |
|---|---|
| 17–18 Kasım | 0, K0, K1 |
| 19–20 Kasım | K2 |
| 21 Kasım | K3 |
| 22 Kasım | K4 |
| 23–24 Kasım | K5, public demoyu yeniden yayınla |
| 25–30 Kasım | Video, blog yazısı, sosyal medya paylaşımı |
| 1 Aralık | Kiro kredisi talebinin son günü (yapılmadıysa) |
| 3 Aralık | Devpost'a teslim (4 Aralık yedek gün) |
