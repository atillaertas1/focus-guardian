Milestone 4: İyileştirme ve Yayın Öncesi Hazırlık To-Do Listesi
Hedef: Uygulamayı daha profesyonel, güvenilir ve kullanışlı hale getirmek.

[✅] 1. Kullanıcı Deneyimi (UX) İyileştirmeleri:

[✅] Bildirimler Ekle:

Odak oturumu başladığında: "Odak oturumu başladı!" gibi bir masaüstü bildirimi gönder.

Odak oturumu bittiğinde: "Oturum tamamlandı! Şimdi mola zamanı." gibi bir bildirim gönder.

(İpucu: Electron'un kendi Notification API'sini kullanabilirsin.)

[✅] Görsel Geri Bildirimler Ekle:

"Listeyi Kaydet" butonuna basıldığında, alert() yerine butonun yanında kısa bir süreliğine "Kaydedildi! ✔" gibi bir yazı göster.

[✅] Otomatik Oturum Döngüsü Oluştur (İsteğe bağlı):

25 dakikalık odak süresi bittiğinde, otomatik olarak 5 dakikalık bir mola sayacını başlat.

[✅] 2. Hata Yönetimi ve Stabilite:

[✅] hosts Dosyası Güvenliği:

Uygulama beklenmedik bir şekilde kapandığında (çökme, bilgisayarın kapanması vb.) hosts dosyasının orijinal haline geri döndüğünden emin olacak bir mekanizma geliştir.

(İpucu: Uygulama başlarken hosts dosyasının yedeğini kontrol eden ve gerekirse geri yükleyen bir kod ekleyebilirsin. app.on('will-quit', ...) olayını kullanarak çıkışta temizlik yapmayı garantileyebilirsin.)

[✅] Yönetici İzni Kontrolü:

sudo-prompt ile yönetici izni alınamazsa kullanıcıya "Ayarları değiştirmek için yönetici izni gerekli." gibi bir hata mesajı göster.

[✅] 3. Kod Temizliği ve Organizasyon:

[✅] Koduna yorum satırları ekleyerek hangi bölümün ne işe yaradığını daha anlaşılır hale getir.

[✅] Tekrar eden kodları (varsa) fonksiyonlar haline getirerek daha temiz bir yapı oluştur.

[✅] 4. Yayın ve Paketleme Hazırlığı:

[✅] README.md Dosyasını Güncelle:

Projenin GitHub sayfasına, uygulamanın ne işe yaradığını anlatan net bir açıklama yaz.

Uygulamanın birkaç ekran görüntüsünü ekle.

Uygulamanın nasıl kurulup kullanılacağını basit adımlarla anlat.

[✅] Uygulama İkonu Ekle:

Projeye bir .ico (Windows) ve .icns (macOS) formatında ikon dosyası ekleyerek uygulamanın daha profesyonel görünmesini sağla.

[ ] Uygulamayı Paketle:

Terminalde npm run make komutunu çalıştırarak Windows (.exe), macOS (.dmg) ve Linux için kurulabilir paketler oluştur.