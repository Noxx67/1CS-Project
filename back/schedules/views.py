from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Session, SessionInstance, AttendanceRecord, AbsenceCounter
from .serializers import (
    SessionSerializer, 
    SessionInstanceSerializer, 
    AttendanceRecordSerializer, 
    AbsenceCounterSerializer
)
from .permissions import IsTeacherOrAdmin

class SessionViewSet(viewsets.ModelViewSet):
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) in ['ADMIN', 'SCOLARITE']:
            return Session.objects.all()
        if getattr(user, 'role', None) == 'TEACHER':
            return Session.objects.filter(teacher=user)
        # If student, filter by their profile year, specialty, and group
        if getattr(user, 'role', None) == 'STUDENT':
            try:
                profile = user.student_profile
                from django.db.models import Q
                base_qs = Session.objects.filter(
                    year=str(profile.year)
                ).filter(
                    Q(specialty=profile.speciality) | Q(specialty='N/A') | Q(specialty__isnull=True) | Q(specialty='')
                )
                valid_ids = [
                    s.id for s in base_qs
                    if not s.assigned_groups or profile.group in s.assigned_groups
                ]
                return Session.objects.filter(id__in=valid_ids)
            except Exception:
                return Session.objects.none()
                
        return Session.objects.all()

class SessionInstanceViewSet(viewsets.ModelViewSet):
    serializer_class = SessionInstanceSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) in ['ADMIN', 'SCOLARITE']:
            return SessionInstance.objects.all()
        if getattr(user, 'role', None) == 'TEACHER':
            return SessionInstance.objects.filter(session__teacher=user)
        if getattr(user, 'role', None) == 'STUDENT':
            try:
                profile = user.student_profile
                from django.db.models import Q
                base_qs = SessionInstance.objects.filter(
                    session__year=str(profile.year)
                ).filter(
                    Q(session__specialty=profile.speciality) | Q(session__specialty='N/A') | Q(session__specialty__isnull=True) | Q(session__specialty='')
                )
                valid_ids = [
                    i.id for i in base_qs
                    if not i.session.assigned_groups or profile.group in i.session.assigned_groups
                ]
                return SessionInstance.objects.filter(id__in=valid_ids)
            except Exception:
                return SessionInstance.objects.none()
                
        return SessionInstance.objects.all()

class AttendanceRecordViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) in ['ADMIN', 'SCOLARITE']:
            return AttendanceRecord.objects.all()
        if getattr(user, 'role', None) == 'TEACHER':
            return AttendanceRecord.objects.filter(session_instance__session__teacher=user)
        # Students only see their own attendance
        return AttendanceRecord.objects.filter(student=user)

class AbsenceCounterViewSet(viewsets.ModelViewSet):
    serializer_class = AbsenceCounterSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) in ['ADMIN', 'SCOLARITE']:
            return AbsenceCounter.objects.all()
        if getattr(user, 'role', None) == 'TEACHER':
            return AbsenceCounter.objects.filter(session__teacher=user)
        # Students only see their own counters
        return AbsenceCounter.objects.filter(student=user)
