# 🎫 Biletal


Django REST Framework + React (Redux) + Redis + Websocket kullanılarak geliştirilmiş, çok kullanıcı tipi destekleyen bilet rezervasyon sistemi.

## 🚀 Özellikler

- 🚌 Ulaşım Tipleri: Otobüs, Uçak, Tren
- 📍 Rota bazlı sefer sorgulama
- 🕒 Filtreleme: Kalkış saati, firma, fiyat aralığı
- 💺 Koltuk seçimi (tekil seçim)
- 🧾 API üzerinden rezervasyon
- 🎛️ Yönetim Paneli (Django Admin)
- 🌐 Postgres veritabanı desteği
- 👉 [Postman Dokümantasyonu](https://documenter.getpostman.com/view/16848466/2sB3HonJwn)


---

![Uygulama Ekran Görüntüsü](biletal.png)


- [X] Kullanıcı kayıt ve giriş sistemi (JWT veya OAuth2 tabanlı)
- [X] Sefer arama (kalkış, varış, tarih, fiyat filtreleme)
- [X] Koltuk seçimi ve aynı koltuğun birden fazla kişiye satılmasını engelleme
- [ ] Rezervasyon ve ödeme süreci (mock ödeme servisi yeterlidir)
- [ ] PNR numarası ile bilet görüntüleme ve iptal
- [ ] Yönetici paneli üzerinden sefer ekleme/düzenleme ve satış raporları
- [ ] Gerçek zamanlı koltuk doluluk güncellemeleri (WebSocket veya SSE)
- [ ] Oluşturulan bilet PDF çıktısı alınabilmelidir.
## 🛠️ Kurulum

### Backend (Django)

Aşagıdaki bilgilere göre veritabanı oluşturun.
```
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        'NAME': 'biletdb',
        'USER': 'postgres',
        'PASSWORD': 'root123',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```


```bash
# Ortam oluştur
python -m venv venv
source venv/bin/activate
```
# Gereksinimleri yükle
```bash
pip install -r requirements.txt
```

# Veritabanını oluştur
```bash
python manage.py migrate
```

# Random veritabanı oluşturmak için
```bash
python biletal_backend/random_route.py
```

# Süper kullanıcı oluştur
```bash
python manage.py createsuperuser
```

# Sunucuyu başlat
```bash
python manage.py runserver
```

### Frontend
```bash
cd bilet_frontend
```

# Paketleri yükle
```bash
npm install
```

# Geliştirme sunucusu
```bash
npm run dev
```

