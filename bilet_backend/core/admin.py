from django.contrib import admin

# Register your models here.
from django.contrib import admin
from core.models import User, Profile, Trip

class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'is_staff', 'is_active']


class ProfileAdmin(admin.ModelAdmin):
    list_editable = ['verified']
    list_display = ['user', 'first_name', 'last_name', 'verified']
    
class TripAdmin(admin.ModelAdmin):
    list_display = ('route', 'departure_time', 'company', 'status')
    list_filter = ('company', 'status')


admin.site.register(User, UserAdmin)
admin.site.register(Profile, ProfileAdmin)
admin.site.register(Trip, TripAdmin)
