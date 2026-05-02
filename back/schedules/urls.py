from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SessionViewSet,
    SessionInstanceViewSet,
    AttendanceRecordViewSet,
    AbsenceCounterViewSet,
    JustificationViewSet,
    ScolariteDashboardOverviewView,
    RecentAbsenceRecordsView
)

router = DefaultRouter()
router.register(r'sessions', SessionViewSet, basename='session')
router.register(r'instances', SessionInstanceViewSet, basename='sessioninstance')
router.register(r'attendance', AttendanceRecordViewSet, basename='attendancerecord')
router.register(r'counters', AbsenceCounterViewSet, basename='absencecounter')
router.register(r'justifications', JustificationViewSet, basename='justification')

urlpatterns = [
    path('', include(router.urls)),
    path('scolarite/dashboard/overview/', ScolariteDashboardOverviewView.as_view(), name='scolarite-overview'),
    path('scolarite/recent-absence-records/', RecentAbsenceRecordsView.as_view(), name='scolarite-recent-absences'),
]
