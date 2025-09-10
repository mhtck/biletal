from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter


from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from .views import CustomTokenRefreshView


router = DefaultRouter()
router.register(r'trips', views.TripViewSet)

urlpatterns = [
    path('auth/login/', views.UserTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', views.RegisterView.as_view(), name='auth_register'),
    path('auth/test/', views.testEndPoint, name='test'),
    path('', views.getRoutes),#Development
    
     # API endpoints
    path('rest/', include(router.urls)),
    path('rest/select-seat/', views.select_seat, name='select_seat'),
    path('rest/release-seat/', views.release_seat, name='release_seat'),
    path('rest/create-reservation/', views.create_reservation, name='create_reservation'),
    path('rest/process-payment/', views.process_payment, name='process_payment'),
    path('rest/reservation/<int:reservation_id>/', views.reservation_status, name='reservation_status'),
    
    # Template views
    path('rest/trips', views.trip_list, name='trip_list'),
    path('rest/trip/<int:trip_id>/', views.trip_detail, name='trip_detail'),
    path('rest/reservation/<int:reservation_id>/', views.reservation_detail, name='reservation_detail'),
]

