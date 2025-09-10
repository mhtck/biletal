import redis
import json
from datetime import datetime, timedelta
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.core.cache import cache
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Trip, Seat, Reservation, Payment, User
import logging

logger = logging.getLogger(__name__)

class SeatReservationService:
    def __init__(self):
        self.redis_client = redis.StrictRedis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            decode_responses=True
        )
        self.channel_layer = get_channel_layer()
        self.lock_timeout = 900  
        self.temp_lock_timeout = 300  

    def get_trip_seats(self, trip_id):
        cache_key = f"trip_seats_{trip_id}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data

        try:
            trip = Trip.objects.get(id=trip_id)
            seats = Seat.objects.filter(vehicle=trip.vehicle).order_by('row_number', 'seat_letter')
            
            reserved_seats = set(
                Reservation.objects.filter(
                    trip=trip,
                    status__in=['pending', 'confirmed']
                ).values_list('seat_id', flat=True)
            )
            
            # Geçici olarak kilitli koltukları Redis'ten bul
            temp_locked_seats = set()
            lock_pattern = f"seat_lock_{trip_id}_*"
            for key in self.redis_client.scan_iter(match=lock_pattern):
                seat_id = key.split('_')[-1]
                temp_locked_seats.add(int(seat_id))

            seat_data = []
            for seat in seats:
                status = 'available'
                if seat.id in reserved_seats:
                    status = 'reserved'
                elif seat.id in temp_locked_seats:
                    status = 'temp_locked'
                
                seat_data.append({
                    'id': seat.id,
                    'seat_number': seat.seat_number,
                    'row_number': seat.row_number,
                    'seat_letter': seat.seat_letter,
                    'is_window': seat.is_window,
                    'status': status
                })

            # 5 dakika cache'le
            cache.set(cache_key, seat_data, 300)
            return seat_data

        except Trip.DoesNotExist:
            return []

    def create_temporary_lock(self, trip_id, seat_id, user_session):
        """Koltuk için geçici kilit oluştur"""
        lock_key = f"seat_lock_{trip_id}_{seat_id}"
        
        # Mevcut kilidi kontrol et
        existing_lock = self.redis_client.get(lock_key)
        if existing_lock and existing_lock != user_session:
            return False, "Koltuk başka bir yolcu tarafından seçilmiş"
        
        # Geçici kilit oluştur
        self.redis_client.setex(
            lock_key, 
            self.temp_lock_timeout, 
            user_session
        )
        
        # Gerçek zamanlı güncelleme gönder
        self.broadcast_seat_update(trip_id)
        
        return True, "Koltuk geçici olarak rezerve edildi"

    def release_temporary_lock(self, trip_id, seat_id, user_session):
        """Geçici kilidi serbest bırak"""
        lock_key = f"seat_lock_{trip_id}_{seat_id}"
        
        # Sadece aynı session'ın kilidini kaldır
        if self.redis_client.get(lock_key) == user_session:
            self.redis_client.delete(lock_key)
            self.broadcast_seat_update(trip_id)
            return True
        return False

    def create_reservation(self, trip_id, seat_id, passenger_data, user_session):
        """Rezervasyon oluştur"""
        lock_key = f"seat_lock_{trip_id}_{seat_id}"
        
        # Geçici kilidi kontrol et
        if self.redis_client.get(lock_key) != user_session:
            return None, "Koltuk kilidi geçersiz"

        try:
            with transaction.atomic():
                trip = Trip.objects.select_for_update().get(id=trip_id)
                seat = Seat.objects.get(id=seat_id, vehicle=trip.vehicle)
                passenger = User.objects.get(id=passenger_data['phone'])
                
                # Çifte rezervasyon kontrolü
                existing = Reservation.objects.filter(
                    trip=trip,
                    seat=seat,
                    status__in=['pending', 'confirmed']
                )
                if existing.exists():
                    return None, "Koltuk zaten rezerve edilmiş"

                # Rezervasyon oluştur
                reservation = Reservation.objects.create(
                    trip=trip,
                    seat=seat,
                    user=passenger,
                    passenger_phone=passenger_data['phone'],
                    expires_at=timezone.now() + timedelta(minutes=15),
                    total_price=trip.price,
                    status='pending'
                )

                # Geçici kilidi rezervasyon kilidi ile değiştir
                reservation_lock_key = f"reservation_lock_{reservation.id}"
                self.redis_client.setex(
                    reservation_lock_key,
                    self.lock_timeout,
                    str(reservation.id)
                )
                
                # Geçici kilidi temizle
                self.redis_client.delete(lock_key)
                
                # Cache'i temizle
                cache.delete(f"trip_seats_{trip_id}")
                
                # Gerçek zamanlı güncelleme
                self.broadcast_seat_update(trip_id)
                
                return reservation, "Rezervasyon başarıyla oluşturuldu"

        except Exception as e:
            logger.error(f"Rezervasyon oluşturma hatası: {str(e)}")
            return None, f"Rezervasyon oluşturulamadı: {str(e)}"

    def process_payment(self, reservation_id, payment_data):
        """Mock ödeme işlemi"""
        try:
            with transaction.atomic():
                reservation = Reservation.objects.select_for_update().get(
                    id=reservation_id,
                    status='pending'
                )
                
                # Süre kontrolü
                if timezone.now() > reservation.expires_at:
                    reservation.status = 'expired'
                    reservation.save()
                    return None, "Rezervasyon süresi dolmuş"

                # Mock ödeme servisi
                payment_success = self.mock_payment_service(
                    reservation.total_price,
                    payment_data
                )

                if payment_success['success']:
                    # Ödeme kaydı oluştur
                    payment = Payment.objects.create(
                        reservation=reservation,
                        amount=reservation.total_price,
                        payment_method=payment_data['method'],
                        status='completed',
                        transaction_id=payment_success['transaction_id'],
                        payment_date=timezone.now()
                    )
                    
                    # Rezervasyonu onayla
                    reservation.status = 'confirmed'
                    reservation.payment_id = payment.transaction_id
                    reservation.save()
                    
                    # Cache temizle
                    cache.delete(f"trip_seats_{reservation.trip.id}")
                    
                    # Gerçek zamanlı güncelleme
                    self.broadcast_seat_update(reservation.trip.id)
                    
                    return payment, "Ödeme başarıyla tamamlandı"
                else:
                    return None, payment_success['error']

        except Reservation.DoesNotExist:
            return None, "Rezervasyon bulunamadı"
        except Exception as e:
            logger.error(f"Ödeme işleme hatası: {str(e)}")
            return None, f"Ödeme işlenemedi: {str(e)}"

    def mock_payment_service(self, amount, payment_data):
        """Mock ödeme servisi"""
        import random
        import uuid
        
        # %90 başarı oranı ile mock ödeme
        success_rate = 0.9
        
        if random.random() < success_rate:
            return {
                'success': True,
                'transaction_id': f"TXN_{uuid.uuid4().hex[:12].upper()}",
                'amount': float(amount),
                'timestamp': timezone.now().isoformat()
            }
        else:
            error_messages = [
                "Kart limiti yetersiz",
                "Kart bilgileri hatalı",
                "Banka bağlantı hatası",
                "İşlem reddedildi"
            ]
            return {
                'success': False,
                'error': random.choice(error_messages)
            }

    def cleanup_expired_reservations(self):
        """Süresi dolmuş rezervasyonları temizle"""
        expired_reservations = Reservation.objects.filter(
            status='pending',
            expires_at__lt=timezone.now()
        )
        
        trip_ids = set()
        for reservation in expired_reservations:
            trip_ids.add(reservation.trip.id)
            
            # Rezervasyon kilidini temizle
            lock_key = f"reservation_lock_{reservation.id}"
            self.redis_client.delete(lock_key)
        
        # Rezervasyonları expired yap
        expired_reservations.update(status='expired')
        
        # Cache temizle ve güncelle
        for trip_id in trip_ids:
            cache.delete(f"trip_seats_{trip_id}")
            self.broadcast_seat_update(trip_id)

    def broadcast_seat_update(self, trip_id):
        """WebSocket ile koltuk güncellemelerini yayınla"""
        try:
            seat_data = self.get_trip_seats(trip_id)
            
            async_to_sync(self.channel_layer.group_send)(
                f"trip_{trip_id}",
                {
                    "type": "seat_update",
                    "message": {
                        "type": "seat_status_update",
                        "trip_id": trip_id,
                        "seats": seat_data,
                        "timestamp": timezone.now().isoformat()
                    }
                }
            )
        except Exception as e:
            logger.error(f"WebSocket broadcast hatası: {str(e)}")

# Singleton instance
seat_service = SeatReservationService()