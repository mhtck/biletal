from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Vehicle, Seat

@receiver(post_save, sender=Vehicle)
def create_seats_for_vehicle(sender, instance, created, **kwargs):
    if not created:
        return

    vehicle_type = instance.vehicle_type

    if vehicle_type == 'bus':
        create_bus_seats(instance)
    elif vehicle_type == 'plane':
        create_plane_seats(instance)
    elif vehicle_type == 'train':
        create_train_seats(instance)


def create_bus_seats(vehicle):
    rows = 10
    letters = ['A', 'B', 'C', 'D']
    window_letters = ['A', 'D']

    for row in range(1, rows + 1):
        for letter in letters:
            Seat.objects.create(
                vehicle=vehicle,
                seat_number=f"{row}{letter}",
                row_number=row,
                seat_letter=letter,
                is_window=letter in window_letters
            )


def create_plane_seats(vehicle):
    rows = 30
    letters = ['A', 'B', 'C', 'D', 'E', 'F']
    window_letters = ['A', 'F']

    for row in range(1, rows + 1):
        for letter in letters:
            Seat.objects.create(
                vehicle=vehicle,
                seat_number=f"{row}{letter}",
                row_number=row,
                seat_letter=letter,
                is_window=letter in window_letters
            )


def create_train_seats(vehicle):
    rows = 20
    letters = ['A', 'B', 'C', 'D']
    window_letters = ['A', 'D']  

    for row in range(1, rows + 1):
        for letter in letters:
            Seat.objects.create(
                vehicle=vehicle,
                seat_number=f"{row}{letter}",
                row_number=row,
                seat_letter=letter,
                is_window=letter in window_letters
            )
