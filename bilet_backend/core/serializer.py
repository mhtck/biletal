from core.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Trip, Route, Vehicle, Seat, Reservation, Payment
from django.utils.timezone import now


class UserSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='profile.first_name')
    last_name = serializers.CharField(source='profile.last_name')
    verified = serializers.BooleanField(source='profile.verified')

    class Meta:
        model = User
        fields = ('id', 'email','is_staff', 'first_name','last_name', 'verified')

class UserTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token =  super().get_token(user)

        token['first_name'] = user.profile.first_name
        token['email'] = user.email
        token['verified'] = user.profile.verified

        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)

        # User bilgilerini serializer ile ekle
        data['user'] = UserSerializer(self.user).data
        self.user.last_login = now()
        self.user.save(update_fields=["last_login"])

        return data
    
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        refresh = RefreshToken(attrs['refresh'])

        data = {"refresh": str(refresh.access_token)}

        # Refresh token'dan user id al
        user_id = refresh["user_id"]
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(id=user_id)
            data['user'] = UserSerializer(user).data
        except User.DoesNotExist:
            raise InvalidToken("Invalid user in token.")

        return data


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('first_name', 'last_name','email', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Şifreler eşleşmiyor."}
            )
        return attrs
    
    def create(self, validated_data):
        user = User.objects.create(
            email = validated_data['email'],
            first_name = validated_data['first_name'],
            last_name = validated_data['last_name'],
        )

        user.set_password(validated_data['password'])
        user.save()

        return user
    
class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = ['id', 'vehicle_type', 'capacity']

class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = ['id', 'origin', 'destination', 'distance_km', 'estimated_duration']



class SeatSerializer(serializers.ModelSerializer):   
    is_reserved = serializers.SerializerMethodField()

    class Meta:
        model = Seat
        fields = ['id', 'seat_number', 'row_number', 'seat_letter', 'is_window', 'is_reserved']

    def get_is_reserved(self, seat):
        trip = self.context.get('trip')
        if not trip:
            return False

        return Reservation.objects.filter(
            trip=trip,
            seat=seat,
            status__in=['pending', 'confirmed']
        ).exists()
        
class TripSerializer(serializers.ModelSerializer):
    route = RouteSerializer(read_only=True)
    vehicle = VehicleSerializer(read_only=True)
    seats = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            'id', 'route', 'company', 'vehicle', 'departure_time', 'arrival_time',
            'price', 'status', 'created_at', 'seats'
        ]

    def get_seats(self, trip):
        seats = trip.vehicle.seats.all()
        return SeatSerializer(seats, many=True, context={'trip': trip}).data

class ReservationSerializer(serializers.ModelSerializer):
    trip = TripSerializer(read_only=True)
    seat = SeatSerializer(read_only=True)
    
    class Meta:
        model = Reservation
        fields = [
            'id', 'trip', 'seat', 'passenger_phone', 'status', 'reservation_time', 'expires_at', 
            'total_price', 'payment_id'
        ]

class PaymentSerializer(serializers.ModelSerializer):
    reservation = ReservationSerializer(read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'reservation', 'amount', 'payment_method', 'status',
            'transaction_id', 'payment_date', 'created_at'
        ]