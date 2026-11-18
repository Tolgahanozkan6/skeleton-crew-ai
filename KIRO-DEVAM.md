> **Güncel değil (17 Kasım 2026):** Bu dosyadaki T3–T7 görevleri tamamlandı. Güncel talimatlar için `KIRO-TALIMATLARI.md` dosyasına bak.

# Skeleton Crew AI — Kesintisiz geliştirme talimatı

Bu dosya Kiro için proje yürütme talimatıdır. Kullanıcı her görev için ayrı mesaj vermeden kalan geliştirme işlerinin sırayla tamamlanmasını istiyor. Mevcut çalışma dosyalarını koru; bu dosya mevcut gereksinim ve tasarımın yerini almaz.

## 1. Başlangıç ve çalışma biçimi

1. Geçerli çalışma klasöründe `package.json`, `apps/` ve `.kiro/specs/two-app-mvp/` bulunduğunu doğrula. Yoksa bu dosyanın bulunduğu klasörü kontrol et; proje bulunamıyorsa doğru klasörü iste.
2. Varsa `AGENTS.md`, ardından `.kiro/steering/`, `.kiro/specs/two-app-mvp/` içindeki requirements, design ve tasks dosyalarını ve `docs/architecture.md` dosyasını oku.
3. Mevcut değişiklikleri incele. Kullanıcının veya önceki Kiro oturumlarının değişikliklerini geri alma. Toplu dosya değiştirme, sıfırlama ve silme yapma.
4. T1 ve T2 tamamlanmış görünebilir. Dosyaları ve testleri kontrol ederek gerçek durumu belirle; çalışır olanı yeniden yazma. T3 başlamışsa mevcut işin üzerine devam et.
5. Başlangıçta `npm test`, `npm start`, `npm run demo:support` ve `npm run demo:planner` çalıştır. Hataları inceleyip düzelt. Sonuçları gerçek çalıştırmadan raporla.
6. Aşağıdaki aşamaları bağımlılık sırasıyla uygula. Her aşamanın sonunda doğrulama yap, hataları gider ve sonraki aşamaya kendin geç. “Devam edeyim mi?” sorusuyla durma.
7. İlerleme bilgisini kısa tut. Bir görev ancak kabul kontrolleri başarılıysa tamamlandı işaretlenir. Tamamlanmamış işi bitmiş gibi gösterme.
8. API anahtarı, hesap erişimi veya yayınlama hedefi eksikse ilgili canlı doğrulamayı engelli kaydet; bağımsız yerel geliştirme, sahte sağlayıcı testleri ve teslim hazırlığına devam et. Gizli değerleri sohbette isteme; yerel ortam ayarı kullan.

## 2. T3 — Kayıt ve insan onayı

- Benzersiz çalıştırma kimliği, sunucu zamanı, uygulama kimliği, mod ve sürüm içeren yaşam döngüsü oluştur.
- Durumlar: running, awaiting_human_review, approved, rejected, failed. Geçersiz geçişleri reddet.
- Bellek içi kayıt arayüzü ve ardından `data/` altında atomik JSON kayıt adaptörü ekle. Şema sürümü kullan; bozuk veya desteklenmeyen dosyanın üzerine sessizce yazma.
- Onay/red, düzenlenmiş taslak, zaman ve beklenen sürümü kaydet. Aynı süreçte eşzamanlı isteklerde sürüm kontrolü ve yazma işlemini birlikte güvenceye al.
- Tekrar onay, eski sürüm, bilinmeyen kayıt ve başarısız çalıştırma için açık hata üret. Onay hiçbir dış işlem yapmaz.
- Kabul: yeniden başlatmada kayıtların korunması, bozuk dosya, eski sürüm, çift işlem, onay/red ve başarısız çalıştırma testleri başarılı; mevcut demolar korunmuş.

## 3. T4 — İki tarayıcı uygulaması

- Aynı ortak hizmeti kullanan ayrı Support Desk ve Job Planner ekranları oluştur. Uygulama klasörlerini ve alan davranışlarını ayrı tut.
- Node.js ES modüllerini ve mevcut basit yapıyı koru. İhtiyaç yoksa yeni framework ekleme.
- Yalnızca yerel arayüze bağlanan sunucu ekle; tek komutla başlatmayı README'de anlat. Mevcut demo komutlarını koru.
- `/support` ve `/planner` ekranlarında örnek yükleme, manuel giriş, çalıştırma, adım izi, düzenlenebilir taslak, onay/red ve geçmiş olsun.
- API'de girdi/çıktı doğrulaması, açık durum kodları ve sınırlı istek boyutu kullan. Model veya kullanıcı metnini HTML olarak çalıştırma. Anahtarlar tarayıcıya gitmesin.
- Boş, yükleniyor, başarılı ve hata durumları; etiketli alanlar, klavye kullanımı, görünür odak ve dar ekrana uyum hazır olsun.
- Kabul: iki uygulamada giriş → sonuç → düzenleme → onay/red → geçmiş → yeniden yükleme akışı çalışır. Hata ve HTML enjeksiyon örnekleri kontrol edilir. Tarayıcı aracı yoksa otomatik HTTP testlerini yap, görsel/klavye kontrolünü doğrulanmadı olarak açık bırak.

## 4. T5 — Sağlayıcı bağlantısı

- Önce mevcut ortamda sağlayıcı seçimi veya adaptör var mı incele. Varsa onu kullan. Yoksa resmî dokümanlardan doğrulayabildiğin tek bir sağlayıcı için sunucu tarafı adaptör uygula; seçimi gerekçelendir.
- Çevrimdışı mod anahtarsız ve ağsız varsayılan olarak çalışmaya devam etsin. Canlı/sahte mod ekranda açıkça görünsün.
- Ortam değişkenlerini gerçekten yükleyen yapı kur; `.env.example` ve README'yi uygulamayla eşleştir. Gerçek anahtarları kaydetme veya loglama.
- Yapılandırılmış çıktıyı doğrula; çağrı başına 15 saniye zaman aşımı, çalıştırma başına en fazla üç uzman çağrısı ve başlangıçta otomatik tekrar olmaması kurallarını uygula.
- Hatalı çıktı, eksik anahtar, zaman aşımı ve sağlayıcı hatasında açık başarısız durum üret; sessizce sahte yanıta geçme. Kullanıcı metni araç yetkisi veremez.
- Kabul: başarılı yanıt, bozuk çıktı, zaman aşımı, çağrı bütçesi ve gizli değerlerin loglardan korunması sahte sağlayıcıyla test edilir. Gerçek API testi yalnızca uygun yerel kimlik bilgileri varsa yapılır; yoksa canlı entegrasyon doğrulanmadı olarak kalır. Sırf bunun için diğer aşamaları durdurma.

## 5. T6 — Tekrarlanabilir sürüm

- Node.js 22 üzerinde testleri ve iki çevrimdışı demoyu çalıştıran GitHub Actions iş akışı ekle. Canlı anahtar gerektirmesin.
- Temiz bir geçici proje kopyasında belgelenmiş kurulum/başlatma komutlarını doğrula; mevcut çalışma klasörünü silme veya sıfırlama.
- Yeni bağımlılık gerekiyorsa kilit dosyasını ekle. Gereksiz bağımlılık ekleme.
- README'de iki uygulamanın açılacağı yerel adresleri, test komutlarını, modları, veri konumunu, bilinen sınırları ve sorun giderme adımlarını yaz.
- Yayınlama için gerekli başlatma, ortam ve kalıcı depolama gereksinimlerini belgele. Yerel JSON dosyasının geçici sunucuda veri kaybedebileceğini göz önüne al.
- Kabul: testler, demolar ve yerel HTTP akışları başarılı; temiz kopya kontrolü gerçek sonuçlarla kaydedilmiş. Uzak CI henüz çalışmadıysa başarılı olduğunu iddia etme.

## 6. T7 — Yarışma ve teslim hazırlığı

- `https://kiroween.devpost.com/rules` resmî kurallarını yeniden kontrol et; kontrol tarihini `docs/competition.md` içine yaz. Erişilemiyorsa önceki doğrulamanın tarihini koru ve güncel kontrolün yapılamadığını belirt.
- Skeleton Crew için ortak temeli ve iki farklı uygulamayı açıkla. Sadece iki klasörün yarışmaya uygunluğu garanti ettiğini söyleme.
- İngilizce ürün açıklaması, iki uygulama için jüri test adımları ve üç dakikadan kısa demo için sahne/metin planını `docs/` altında hazırla.
- `docs/kiro-usage.md` içine bu oturumda gerçekten kullanılan Kiro özelliklerini, görevleri ve doğrulama sonuçlarını kaydet. Uydurma oturum, commit, hook veya kanıt ekleme.
- MIT lisansını ve kök `.kiro/` dizinini koru. Kullanılan üçüncü taraf kod/varlık ve önceden mevcut işleri listele.
- Dağıtım hedefi, hesap erişimi veya kullanıcıya özgü uygunluk bilgisi yoksa bunları engelli maddeler olarak yaz. Yerel teslim paketini yine tamamla. Kullanıcının yerine yaş/ülke/öğrencilik beyanı üretme.
- Yayınlanmış çalışan bağlantı, gerçek video ve gerekli uygunluk kontrolleri olmadan T7'nin tamamını bitmiş işaretleme. Yalnızca hazırlanan alt işleri işaretle.

## 7. Doğrulama, devam kaydı ve bitiş

Her aşamadan sonra:

1. Değişen davranışın ilgili testlerini ve tüm test takımını çalıştır. İki demoyu tekrar doğrula.
2. `.kiro/specs/two-app-mvp/tasks.md` dosyasını gerçek sonuca göre güncelle. Kanıtı olmayan kutuları işaretleme.
3. `docs/progress.md` içine tamamlanan görev, çalıştırılan kontroller, gerçek sonuç, kalan engel ve sıradaki adımı yaz. Oturum sınırı olursa bu kayıt yeni oturumun devam noktası olsun.
4. `docs/kiro-usage.md` kaydını güncelle. Gizli bilgiler, kişisel müşteri verileri ve ortam dosyalarını sürüm kontrolüne alma.
5. Sonraki bağımsız göreve otomatik geç. Haricî erişim engeli yüzünden yapılabilir işleri yarım bırakma. Araç erişim denetimlerini aşmaya çalışma.

Son rapor kısa ve Türkçe olsun:

- Tamamlanan görevler ve açık kalanlar.
- Test sonuçları ve hangi kontrollerin yapılamadığı.
- Uygulamayı başlatan kesin komut ve iki yerel adres.
- Canlı sağlayıcının gerçekten denenip denenmediği.
- Varsa yalnızca zorunlu kullanıcı işlemleri: ortam anahtarı, hesap erişimi, dağıtım hedefi, video yükleme veya kişisel uygunluk beyanı.

Kullanıcıdan her aşamada yeni komut isteme. Bu dosyadaki yapılabilir işleri bitirene kadar ilerle. Yerel dosyaların değişmiş olması GitHub'a yüklendikleri anlamına gelmez; commit/push/yayın durumunu yalnızca doğrulanmışsa bildir.
