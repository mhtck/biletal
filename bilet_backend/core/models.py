from django.db import models
from django.db.models.signals import post_save
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager

from django.core.exceptions import ValidationError
import random
import string
import uuid


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email alanı zorunludur')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser is_staff=True olmalı.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser is_superuser=True olmalı.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    objects = CustomUserManager()

    def profile(self):
        profile, created = Profile.objects.get_or_create(user=self)
        return profile

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    verified = models.BooleanField(default=False)

def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(
            user=instance,
            first_name=instance.first_name,
            last_name=instance.last_name
        )

def save_user_profile(sender, instance, **kwargs):
        try:
            profile = instance.profile
            profile.first_name = instance.first_name
            profile.last_name = instance.last_name
            profile.save()
        except Profile.DoesNotExist:
            Profile.objects.create(
                user=instance,
                first_name=instance.first_name,
                last_name=instance.last_name
        )

post_save.connect(create_user_profile, sender=User)
post_save.connect(save_user_profile, sender=User)


class Vehicle(models.Model):
    VEHICLE_CHOICES = [
        ('bus', 'Otobüs'),
        ('plain', 'Uçak'),
        ('train', 'Tren')
    ]
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_CHOICES, default='bus')
    capacity = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.vehicle_type} - {self.capacity}"

class Route(models.Model):
    origin = models.CharField(max_length=100)
    destination = models.CharField(max_length=100)
    distance_km = models.FloatField()
    estimated_duration = models.DurationField()

    def __str__(self):
        return f"{self.origin} → {self.destination}"

class Company(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Trip(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Planlandı'),
        ('boarding', 'Biniş'),
        ('departed', 'Yolda'),
        ('arrived', 'Tamamlandı'),
        ('cancelled', 'İptal')
    ]
    
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    route = models.ForeignKey(Route, on_delete=models.CASCADE)
    departure_time = models.DateTimeField()
    arrival_time = models.DateTimeField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['vehicle', 'departure_time']


    def __str__(self):
        return f"{self.route} - {self.departure_time.strftime('%Y-%m-%d %H:%M')}"

class Seat(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='seats')
    seat_number = models.CharField(max_length=5)  
    row_number = models.IntegerField()
    seat_letter = models.CharField(max_length=1)
    is_window = models.BooleanField(default=False)

    class Meta:
        unique_together = ['vehicle', 'seat_number']

    def __str__(self):
        return f"{self.vehicle.vehicle_type} - Koltuk {self.seat_number}"

class Reservation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Beklemede'),
        ('confirmed', 'Onaylandı'),
        ('cancelled', 'İptal'),
        ('expired', 'Süresi Doldu')
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE)
    seat = models.ForeignKey(Seat, on_delete=models.CASCADE)
    passenger_phone = models.CharField(max_length=15)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reservation_time = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()  # Ödeme için 15 dakika süre
    payment_id = models.CharField(max_length=100, null=True, blank=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    pnr_code = models.CharField(max_length=10, unique=True, editable=False)

    class Meta:
        unique_together = ['trip', 'seat']

    def clean(self):
        # Aynı sefer ve koltuk için sadece bir aktif rezervasyon
        existing = Reservation.objects.filter(
            trip=self.trip,
            seat=self.seat,
            status__in=['pending', 'confirmed']
        ).exclude(id=self.id)
        
        if existing.exists():
            raise ValidationError("Bu koltuk zaten rezerve edilmiş!")
        

    def save(self, *args, **kwargs):
        self.clean()
        if not self.pnr_code:
            self.pnr_code = self.generate_unique_pnr()
        super().save(*args, **kwargs)

    def generate_unique_pnr(self):
        
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if not Reservation.objects.filter(pnr_code=code).exists():
                return code

    def __str__(self):
        return f"{self.user.first_name} - {self.trip} - Koltuk {self.seat.seat_number}"

class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Beklemede'),
        ('processing', 'İşleniyor'),
        ('completed', 'Tamamlandı'),
        ('failed', 'Başarısız'),
        ('refunded', 'İade Edildi')
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('credit_card', 'Kredi Kartı'),
        ('debit_card', 'Banka Kartı'),
        ('bank_transfer', 'Havale/EFT'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reservation = models.OneToOneField(Reservation, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(max_length=100, null=True, blank=True)
    payment_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Ödeme {self.id} - {self.reservation.user.first_name}"