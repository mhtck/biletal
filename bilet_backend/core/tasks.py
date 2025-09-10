from celery import shared_task
from .services import seat_service
import logging

logger = logging.getLogger(__name__)

@shared_task
def cleanup_expired_reservations():
    """Süresi dolmuş rezervasyonları temizle"""
    try:
        seat_service.cleanup_expired_reservations()
        logger.info("Expired reservations cleaned up successfully")
        return "Success"
    except Exception as e:
        logger.error(f"Error cleaning up expired reservations: {str(e)}")
        return f"Error: {str(e)}"

@shared_task
def send_reservation_reminder(reservation_id):
    """Rezervasyon hatırlatması gönder"""
    try:
        # E-posta veya SMS hatırlatması implementasyonu
        # Bu örnek implementasyon
        from .models import Reservation
        
        reservation = Reservation.objects.get(id=reservation_id)
        if reservation.status == 'pending':
            logger.info(f"Reminder sent for reservation {reservation_id}")
            # Burada gerçek e-posta/SMS servisi çağrılabilir
        
        return "Reminder sent"
    except Exception as e:
        logger.error(f"Error sending reminder: {str(e)}")
        return f"Error: {str(e)}"

# celery.py
from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from celery.schedules import crontab

# Django settings module'ü set et
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bus_reservation.settings')

app = Celery('bus_reservation')

# Django settings'i kullan
app.config_from_object('django.conf:settings', namespace='CELERY')

# Periodik task'ları tanımla
app.conf.beat_schedule = {
    'cleanup-expired-reservations': {
        'task': 'reservations.tasks.cleanup_expired_reservations',
        'schedule': crontab(minute='*/5'),  # Her 5 dakikada bir çalış
    },
}

app.conf.timezone = 'Europe/Istanbul'

# Otomatik olarak task'ları keşfet
app.autodiscover_tasks()