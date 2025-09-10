from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/trip/(?P<trip_id>\w+)/$', consumers.TripSeatConsumer.as_asgi()),
    re_path(r'ws/reservation/(?P<reservation_id>[\w-]+)/$', consumers.ReservationStatusConsumer.as_asgi()),
]