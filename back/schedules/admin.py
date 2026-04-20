from django.contrib import admin
from .models import Session, SessionInstance, AttendanceRecord, AbsenceCounter

@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ('title', 'session_type', 'teacher', 'year', 'day', 'start_time', 'end_time', 'room')
    list_filter = ('session_type', 'year', 'day', 'teacher')
    search_fields = ('title', 'room', 'teacher__first_name', 'teacher__last_name')

@admin.register(SessionInstance)
class SessionInstanceAdmin(admin.ModelAdmin):
    list_display = ('session', 'date', 'status')
    list_filter = ('status', 'date')
    search_fields = ('session__title',)

@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ('session_instance', 'student', 'status')
    list_filter = ('status', 'session_instance__date')
    search_fields = ('student__first_name', 'student__last_name', 'session_instance__session__title')

@admin.register(AbsenceCounter)
class AbsenceCounterAdmin(admin.ModelAdmin):
    list_display = ('student', 'session', 'absence_count', 'last_updated')
    list_filter = ('session',)
    search_fields = ('student__first_name', 'student__last_name', 'session__title')
