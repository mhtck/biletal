from django.shortcuts import render
from django.http import JsonResponse
from core.models import User
from core.serializer import UserTokenObtainPairSerializer, RegisterSerializer 

from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework import viewsets, status
from rest_framework.decorators import action
from .models import Trip, Seat, Reservation, Payment
from .services import seat_service
from .serializer import TripSerializer, ReservationSerializer, PaymentSerializer
import json
import uuid

from rest_framework_simplejwt.views import TokenRefreshView
from .serializer import CustomTokenRefreshSerializer

class CustomTokenRefreshView(TokenRefreshView):
    serializer_class = CustomTokenRefreshSerializer

class UserTokenObtainPairView(TokenObtainPairView):
    serializer_class = UserTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer


@api_view(['GET'])
def getRoutes(request):
    routes = [
        '/api/auth/login',
        '/api/auth/register',
        'api/auth/token/refresh'
    ]
    return Response(routes)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def testEndPoint(request):
    if request.method == 'GET':
        data = f"Başarılı {request.user}, GET request"
        return Response({'response': data}, status=status.HTTP_200_OK)
    elif request.method == 'POST':
        text = "Selamünaleyküm"
        data = f"Başarılı, POST request: {text}"
        return Response({'response': data}, status=status.HTTP_200_OK)
    return Response({'response': "HATA!"}, status=status.HTTP_400_BAD_REQUEST)
    
    


class TripViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Trip.objects.filter(status='scheduled')
    serializer_class = TripSerializer
    permission_classes = [AllowAny]

    @action(detail=True, methods=['get'])
    def seats(self, request, pk=None):
        """Sefer için koltuk durumları"""
        trip = self.get_object()
        seat_data = seat_service.get_trip_seats(trip.id)
        
        return Response({
            'trip_id': trip.id,
            'seats': seat_data,
            'total_seats': len(seat_data),
            'available_seats': len([s for s in seat_data if s['status'] == 'available'])
        })

@api_view(['POST'])
def select_seat(request):
    """Koltuk seçimi endpoint'i"""
    try:
        data = json.loads(request.body)
        trip_id = data.get('trip_id')
        seat_id = data.get('seat_id')
        user_session = data.get('user_session', str(uuid.uuid4()))
        
        if not trip_id or not seat_id:
            return JsonResponse({
                'success': False,
                'error': 'trip_id ve seat_id gerekli'
            }, status=400)

        success, message = seat_service.create_temporary_lock(
            trip_id, seat_id, user_session
        )
        
        return JsonResponse({
            'success': success,
            'message': message,
            'user_session': user_session,
            'seat_id': seat_id
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@api_view(['POST'])
def release_seat(request):
    """Koltuk bırakma endpoint'i"""
    try:
        data = json.loads(request.body)
        trip_id = data.get('trip_id')
        seat_id = data.get('seat_id')
        user_session = data.get('user_session')
        
        if not all([trip_id, seat_id, user_session]):
            return JsonResponse({
                'success': False,
                'error': 'Tüm parametreler gerekli'
            }, status=400)

        success = seat_service.release_temporary_lock(
            trip_id, seat_id, user_session
        )
        
        return JsonResponse({
            'success': success,
            'message': 'Koltuk bırakıldı' if success else 'Koltuk bırakılamadı'
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@api_view(['POST'])
def create_reservation(request):
    """Rezervasyon oluşturma endpoint'i"""
    try:
        data = json.loads(request.body)
        trip_id = data.get('trip_id')
        seat_id = data.get('seat_id')
        user_session = data.get('user_session')
        passenger_data = data.get('passenger', {})
        
        # Validasyon
        required_fields = ['id', 'phone']
        missing_fields = [field for field in required_fields if not passenger_data.get(field)]
        
        if missing_fields:
            return JsonResponse({
                'success': False,
                'error': f'Eksik yolcu bilgileri: {", ".join(missing_fields)}'
            }, status=400)

        if not all([trip_id, seat_id, user_session]):
            return JsonResponse({
                'success': False,
                'error': 'trip_id, seat_id ve user_session gerekli'
            }, status=400)

        reservation, message = seat_service.create_reservation(
            trip_id, seat_id, passenger_data, user_session
        )
        
        if reservation:
            serializer = ReservationSerializer(reservation)
            return JsonResponse({
                'success': True,
                'message': message,
                'reservation': serializer.data
            })
        else:
            return JsonResponse({
                'success': False,
                'error': message
            }, status=400)

    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@api_view(['POST'])
def process_payment(request):
    """Ödeme işleme endpoint'i"""
    try:
        data = json.loads(request.body)
        reservation_id = data.get('reservation_id')
        payment_data = data.get('payment', {})
        
        required_payment_fields = ['method', 'card_number', 'card_name', 'expiry', 'cvv']
        missing_fields = [field for field in required_payment_fields 
                         if not payment_data.get(field)]
        
        if missing_fields:
            return JsonResponse({
                'success': False,
                'error': f'Eksik ödeme bilgileri: {", ".join(missing_fields)}'
            }, status=400)

        if not reservation_id:
            return JsonResponse({
                'success': False,
                'error': 'reservation_id gerekli'
            }, status=400)

        payment, message = seat_service.process_payment(
            reservation_id, payment_data
        )
        
        if payment:
            serializer = PaymentSerializer(payment)
            return JsonResponse({
                'success': True,
                'message': message,
                'payment': serializer.data
            })
        else:
            return JsonResponse({
                'success': False,
                'error': message
            }, status=400)

    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@api_view(['GET'])
def reservation_status(request, reservation_id):
    """Rezervasyon durumu sorgulama"""
    try:
        reservation = get_object_or_404(Reservation, id=reservation_id)
        serializer = ReservationSerializer(reservation)
        
        return JsonResponse({
            'success': True,
            'reservation': serializer.data
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@api_view(['GET'])
def trip_list(request):
    """Sefer listesi sayfası"""
    trips = Trip.objects.filter(status='scheduled').select_related('route', 'vehicle', 'company')
    serializer = TripSerializer(trips, many=True)
    return JsonResponse({'response': serializer.data}, status=status.HTTP_200_OK)

@api_view(['GET'])
def trip_detail(request, trip_id):
    """Sefer detay ve koltuk seçimi sayfası"""
    trips = Trip.objects.filter(id=trip_id).select_related('route', 'vehicle', 'company')
    serializer = TripSerializer(trips, many=True)
    return JsonResponse({'response': serializer.data}, status=status.HTTP_200_OK)

@api_view(['GET'])
def reservation_detail(request, reservation_id):
    """Rezervasyon detay ve ödeme sayfası"""
    reservation = Reservation.objects.filter(id=reservation_id).select_related('trip', 'seat')
    serializer = ReservationSerializer(reservation, many=True)
    return JsonResponse({'response': serializer.data}, status=status.HTTP_200_OK)
