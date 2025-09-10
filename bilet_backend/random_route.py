import psycopg2
import itertools
import random

iller = [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya",
    "Artvin", "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur",
    "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne",
    "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane",
    "Hakkari", "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu",
    "Kayseri", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya",
    "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu",
    "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
    "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray",
    "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan",
    "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
]

id_counter = 1

conn = psycopg2.connect("dbname=biletdb user=postgres password=root123 host=localhost")
cur = conn.cursor()

for origin, destination in itertools.permutations(iller, 2):
    distance = random.randint(100, 1200)
    duration = round(distance / random.uniform(70, 100), 1)  # ortalama hız 70-100 km/h
    
    hours = int(duration)
    minutes = int((duration - hours) * 60)

    interval_str = f"{hours} hours {minutes} minutes"

    cur.execute("""
        INSERT INTO public.core_route (id, origin, destination, distance_km, estimated_duration)
        VALUES (%s, %s, %s, %s, %s::interval);
    """, (id_counter, origin, destination, distance, interval_str))
    id_counter += 1

conn.commit()
cur.close()
conn.close()
