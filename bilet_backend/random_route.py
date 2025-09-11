import psycopg2
import itertools
import random

iller = [
    "Adana", "Diyarbakır", "Isparta", "Mersin", "İstanbul", 
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


conn = psycopg2.connect(
    dbname='biletdb',
    user='postgres',
    password='root123',
    host='localhost',
    port='5432'
)

cursor = conn.cursor()

vehicle_id = 1
seat_letters = ['A', 'B', 'C', 'D']
seats_per_row = 4
total_seats = 40
total_rows = total_seats // seats_per_row

for row in range(1, total_rows + 1):
    for i, letter in enumerate(seat_letters):
        seat_number = f"{row}{letter}"
        is_window = letter in ['A', 'D']

        query = """
        INSERT INTO core_seat (vehicle_id, seat_number, row_number, seat_letter, is_window)
        VALUES (%s, %s, %s, %s, %s);
        """

        values = (vehicle_id, seat_number, row, letter, is_window)
        cursor.execute(query, values)

conn.commit()
cursor.close()
conn.close()

print(f"{total_seats} koltuk başarıyla eklendi.")


from datetime import datetime, timedelta

conn = psycopg2.connect(
    dbname='biletdb',
    user='postgres',
    password='root123',
    host='localhost',
    port='5432'
)
cursor = conn.cursor()

company_id = 1
vehicle_id = 1
price = 500.00
status = 'scheduled'
base_departure = datetime(2025, 9, 20, 8, 0)  

query = """
INSERT INTO core_trip (
    company_id, vehicle_id, route_id,
    departure_time, arrival_time,
    price, status, created_at
) VALUES (%s, %s, %s, %s, %s, %s, %s, now());
"""

for i in range(5):
    route_id = i + 1
    departure_time = base_departure + timedelta(hours=i * 3)  
    arrival_time = departure_time + timedelta(hours=7 + i)    

    values = (
        company_id,
        vehicle_id,
        route_id,
        departure_time,
        arrival_time,
        price + (i * 25),  
        status
    )

    cursor.execute(query, values)
    print(f"Trip eklendi → route_id: {route_id}, kalkış: {departure_time}, varış: {arrival_time}")

conn.commit()
cursor.close()
conn.close()
print("Tüm tripler başarıyla eklendi.")
