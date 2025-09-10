import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

class TripSeatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.trip_id = self.scope['url_route']['kwargs']['trip_id']
        self.trip_group_name = f'trip_{self.trip_id}'
        
        # Gruba katıl
        await self.channel_layer.group_add(
            self.trip_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # İlk bağlantıda mevcut koltuk durumlarını gönder
        seat_data = await self.get_trip_seats()
        if seat_data:
            await self.send(text_data=json.dumps({
                'type': 'initial_seats',
                'trip_id': self.trip_id,
                'seats': seat_data
            }))

    async def disconnect(self, close_code):
        # Gruptan ayrıl
        await self.channel_layer.group_discard(
            self.trip_group_name,
            self.channel_name
        )

    # WebSocket'ten mesaj al
    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            if message_type == 'seat_select':
                await self.handle_seat_select(text_data_json)
            elif message_type == 'seat_release':
                await self.handle_seat_release(text_data_json)
            elif message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': text_data_json.get('timestamp')
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Geçersiz JSON formatı'
            }))
        except Exception as e:
            logger.error(f"WebSocket receive error: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Sunucu hatası'
            }))

    async def handle_seat_select(self, data):
        """Koltuk seçimi işle"""
        seat_id = data.get('seat_id')
        user_session = data.get('user_session')
        
        if not seat_id or not user_session:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Geçersiz koltuk seçimi'
            }))
            return

        # Servise delegate et
        success, message = await self.create_temp_lock(seat_id, user_session)
        
        await self.send(text_data=json.dumps({
            'type': 'seat_select_response',
            'success': success,
            'message': message,
            'seat_id': seat_id
        }))

    async def handle_seat_release(self, data):
        """Koltuk bırakma işle"""
        seat_id = data.get('seat_id')
        user_session = data.get('user_session')
        
        if not seat_id or not user_session:
            return

        # Servise delegate et
        await self.release_temp_lock(seat_id, user_session)

    # Grup mesajlarını işle
    async def seat_update(self, event):
        """Koltuk güncellemesi yayınla"""
        message = event['message']
        
        await self.send(text_data=json.dumps(message))

    # Database operasyonları
    @database_sync_to_async
    def get_trip_seats(self):
        """Koltuk verilerini getir"""
        from .services import seat_service
        return seat_service.get_trip_seats(self.trip_id)

    @database_sync_to_async
    def create_temp_lock(self, seat_id, user_session):
        """Geçici kilit oluştur"""
        from .services import seat_service
        return seat_service.create_temporary_lock(
            self.trip_id, seat_id, user_session
        )

    @database_sync_to_async
    def release_temp_lock(self, seat_id, user_session):
        """Geçici kilidi bırak"""
        from .services import seat_service
        return seat_service.release_temporary_lock(
            self.trip_id, seat_id, user_session
        )


class ReservationStatusConsumer(AsyncWebsocketConsumer):
    """Rezervasyon durumu güncellemeleri için ayrı consumer"""
    
    async def connect(self):
        self.reservation_id = self.scope['url_route']['kwargs']['reservation_id']
        self.reservation_group_name = f'reservation_{self.reservation_id}'
        
        await self.channel_layer.group_add(
            self.reservation_group_name,
            self.channel_name
        )
        
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.reservation_group_name,
            self.channel_name
        )

    async def reservation_update(self, event):
        """Rezervasyon güncellemesi yayınla"""
        message = event['message']
        await self.send(text_data=json.dumps(message))