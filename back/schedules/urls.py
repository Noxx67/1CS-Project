from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SessionViewSet,
    SessionInstanceViewSet,
    AttendanceRecordViewSet,
    AbsenceCounterViewSet
)

router = DefaultRouter()
router.register(r'sessions', SessionViewSet, basename='session')
router.register(r'instances', SessionInstanceViewSet, basename='sessioninstance')
router.register(r'attendance', AttendanceRecordViewSet, basename='attendancerecord')
router.register(r'counters', AbsenceCounterViewSet, basename='absencecounter')

urlpatterns = [
    path('', include(router.urls)),
]
