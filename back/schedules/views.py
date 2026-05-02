from django.utils import timezone
from django.db.models import Count, Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Session, SessionInstance, AttendanceRecord, AbsenceCounter, Justification
from .serializers import (
    SessionSerializer,
    SessionInstanceSerializer,
    AttendanceRecordSerializer,
    AbsenceCounterSerializer,
    JustificationSerializer
)
from .permissions import IsTeacherOrAdmin
from rest_framework.views import APIView
from accounts.permissions import IsAdminOrScolarite

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

    @action(detail=True, methods=['get'], url_path='students')
    def students(self, request, pk=None):
        """Return all students whose group is in session.assigned_groups."""
        session = self.get_object()
        from accounts.models import StudentProfile
        from django.contrib.auth import get_user_model
        User = get_user_model()

        groups = session.assigned_groups or []
        if groups:
            profiles = StudentProfile.objects.filter(group__in=groups).select_related('user')
        else:
            profiles = StudentProfile.objects.none()

        students_data = [
            {
                'id': p.user.id,
                'full_name': getattr(p.user, 'full_name', '') or f"{p.user.first_name} {p.user.last_name}".strip(),
                'registration_number': p.registration_number or '',
                'group': p.group or '',
            }
            for p in profiles
        ]
        return Response(students_data)

    @action(detail=True, methods=['post'], url_path='start_attendance')
    def start_attendance(self, request, pk=None):
        """
        Create (or get) a SessionInstance for today, then create AttendanceRecord
        rows for every student in the session's assigned groups.
        Returns instance_id and the full student list with their current status.
        """
        session = self.get_object()
        today = timezone.localdate()

        instance, _ = SessionInstance.objects.get_or_create(
            session=session,
            date=today,
            defaults={'status': 'active', 'teacher_note': ''}
        )
        # Mark active if it was upcoming
        if instance.status == 'upcoming':
            instance.status = 'active'
            instance.save(update_fields=['status'])

        from accounts.models import StudentProfile
        import re

        groups = session.assigned_groups or []

        # ── Normalize group codes to 'G{N}' format ──────────────
        # Session groups may be stored as 'G1', '1', 'g1', etc.
        def normalize_group(g):
            g = str(g).strip().upper()
            # If already like G1, keep it; if just a number, prefix G
            m = re.match(r'^G?(\d+)$', g)
            return f'G{m.group(1)}' if m else g

        # Normalize all session groups
        normalized_groups = [normalize_group(g) for g in groups]

        # ── Normalize session year to integer ────────────────────
        # Session.year is like '1CS', '2CP', '3CS'; StudentProfile.year is int
        session_year_int = session.get_numeric_year()

        # ── Fetch matching students ──────────────────────────────
        # Start with all student profiles, then apply filters
        profiles_qs = StudentProfile.objects.select_related('user')

        if normalized_groups:
            # Normalize DB groups at query time — fetch all then filter in Python
            # because Django can't call Python functions in SQL
            all_profiles = list(profiles_qs)
            profiles = [
                p for p in all_profiles
                if normalize_group(p.group or '') in normalized_groups
                and (session_year_int is None or p.year == session_year_int)
            ]
        else:
            profiles = []

        students_data = []
        for p in profiles:
            record, _ = AttendanceRecord.objects.get_or_create(
                session_instance=instance,
                student=p.user,
                defaults={'status': 'unmarked'}
            )
            students_data.append({
                'record_id': record.id,
                'student_id': p.user.id,
                'full_name': getattr(p.user, 'full_name', '') or f"{p.user.first_name} {p.user.last_name}".strip(),
                'registration_number': p.registration_number or '',
                'group': p.group or '',
                'status': record.status,
            })

        return Response({
            'instance_id': instance.id,
            'session_id': session.id,
            'date': str(today),
            'status': instance.status,
            'students': students_data,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='my_sessions')
    def my_sessions(self, request):
        """Return all sessions for the authenticated teacher, grouped by day."""
        user = request.user
        if getattr(user, 'role', None) != 'TEACHER':
            return Response({'error': 'Only teachers can access this endpoint.'}, status=status.HTTP_403_FORBIDDEN)
        sessions = Session.objects.filter(teacher=user).order_by('day', 'start_time')
        serializer = SessionSerializer(sessions, many=True)
        return Response(serializer.data)


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
                
                # Fetch all sessions for filtering in Python (due to mapping)
                # This could be optimized later if needed
                all_instances = SessionInstance.objects.filter(
                    Q(session__specialty=profile.speciality) | Q(session__specialty='N/A') | Q(session__specialty__isnull=True) | Q(session__specialty='')
                ).select_related('session')
                
                valid_ids = []
                for inst in all_instances:
                    # Match year
                    if inst.session.get_numeric_year() == profile.year:
                        # Match group
                        if not inst.session.assigned_groups or profile.group in inst.session.assigned_groups:
                            valid_ids.append(inst.id)
                
                return SessionInstance.objects.filter(id__in=valid_ids)
            except Exception:
                return SessionInstance.objects.none()

        return SessionInstance.objects.all()

class AttendanceRecordViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method not in ('GET', 'HEAD', 'OPTIONS'):
            return [IsAuthenticated(), IsTeacherOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) in ['ADMIN', 'SCOLARITE']:
            return AttendanceRecord.objects.all()
        if getattr(user, 'role', None) == 'TEACHER':
            # Ensure we are filtering by the teacher assigned to the session
            return AttendanceRecord.objects.filter(session_instance__session__teacher=user)
        # Students only see their own attendance
        return AttendanceRecord.objects.filter(student=user)

    @action(detail=True, methods=['post', 'patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        record = self.get_object()
        new_status = request.data.get('status')
        if new_status in dict(AttendanceRecord.STATUS_CHOICES):
            record.status = new_status
            record.save()
            return Response({'status': record.status})
        return Response({'error': f'Invalid status: {new_status}'}, status=status.HTTP_400_BAD_REQUEST)

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

class JustificationViewSet(viewsets.ModelViewSet):
    serializer_class = JustificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) in ['ADMIN', 'SCOLARITE']:
            return Justification.objects.all()
        return Justification.objects.filter(student=user)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    @action(detail=False, methods=['get'], url_path='overview')
    def overview(self, request):
        if getattr(request.user, 'role', None) not in ['ADMIN', 'SCOLARITE']:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
            
        justifications = self.get_queryset()
        
        # Simple stats
        pending = justifications.filter(status='EN ATTENTE').count()
        approved = justifications.filter(status='JUSTIFIÉE').count()
        rejected = justifications.filter(status='INJUSTIFIÉE').count()
        
        return Response({
            'metrics': {
                'pendingReview': {'value': pending, 'label': 'En attente', 'helper': 'Nécessite une validation', 'tone': 'blue', 'icon': 'pending'},
                'approvedThisWeek': {'value': approved, 'label': 'Approuvées', 'helper': 'Certificats validés', 'tone': 'blue', 'icon': 'approved'},
                'rejected': {'value': rejected, 'label': 'Rejetées', 'helper': 'Documents invalides', 'tone': 'blue', 'icon': 'rejected'},
            },
            'documents': JustificationSerializer(justifications, many=True).data,
            'statuses': ['EN ATTENTE', 'JUSTIFIÉE', 'INJUSTIFIÉE'],
            'documentTypes': ['MEDICAL', 'TRANSPORT', 'FAMILY', 'OTHER'],
            'notificationsCount': pending
        })

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        if not request.user.is_admin() and request.user.role != 'SCOLARITE':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        justification = self.get_object()
        justification.status = 'JUSTIFIÉE'
        justification.scholarite_comment = request.data.get('comment', '')
        justification.save()
        
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        if not request.user.is_admin() and request.user.role != 'SCOLARITE':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        justification = self.get_object()
        justification.status = 'INJUSTIFIÉE'
        justification.scholarite_comment = request.data.get('comment', '')
        justification.save()
        
        return Response({'status': 'rejected'})

class ScolariteDashboardOverviewView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrScolarite]
    
    def get(self, request):
        today = timezone.localdate()
        
        # Metrics
        absences_today = AttendanceRecord.objects.filter(session_instance__date=today, status='absent').count()
        pending_justifications = Justification.objects.filter(status='EN ATTENTE').count()
        
        # Recent absences
        recent_records = AttendanceRecord.objects.filter(status='absent').order_by('-session_instance__date')[:10]
        
        # Justifications to review
        pending_list = Justification.objects.filter(status='EN ATTENTE').order_by('-submission_date')[:5]
        
        # Absences by department (using Year/Promotion as proxy)
        by_year = Session.objects.values('year').annotate(
            count=Count('instances__attendances', filter=Q(instances__attendances__status='absent'))
        ).order_by('-count')
        
        departments = []
        total_absences = sum(item['count'] for item in by_year) or 1
        for item in by_year:
            departments.append({
                'label': item['year'],
                'percent': int((item['count'] / total_absences) * 100),
                'percentLabel': f"{item['count']} absences"
            })

        return Response({
            'metrics': {
                'absencesToday': {'value': absences_today, 'label': 'Absences today'},
                'pendingJustifications': {'value': pending_justifications, 'label': 'Pending justifications'},
                'scheduledMakeupSessions': {'value': 0, 'label': 'Scheduled makeup'},
                'overallAbsenceRate': {'value': 12, 'unit': '%', 'label': 'Overall rate'},
            },
            'recentAbsences': [
                {
                    'id': r.id,
                    'studentName': r.student.full_name,
                    'department': getattr(r.student.student_profile, 'year', 'N/A') if hasattr(r.student, 'student_profile') else 'N/A',
                    'subject': r.session_instance.session.title,
                    'date': r.session_instance.date.strftime("%d %b %Y"),
                    'status': r.status,
                    'justification_status': getattr(r, 'justification').status if hasattr(r, 'justification') else 'INJUSTIFIÉE',
                    'detailUrl': f"http://127.0.0.1:8000{r.justification.file.url}" if hasattr(r, 'justification') and r.justification.file else None
                } for r in recent_records
            ],
            'justificationsToReview': [
                {
                    'id': j.id,
                    'studentName': j.student.full_name,
                    'subject': f"{j.get_justification_type_display()} - {j.attendance_record.session_instance.session.title}",
                    'submittedAtLabel': j.submission_date.strftime("%d %b %Y"),
                    'approveUrl': f"schedules/justifications/{j.id}/approve/",
                    'rejectUrl': f"schedules/justifications/{j.id}/reject/",
                    'fileUrl': f"http://127.0.0.1:8000{j.file.url}" if j.file else None
                } for j in pending_list
            ],
            'absencesByDepartment': departments,
            'notificationsCount': pending_justifications
        })

class RecentAbsenceRecordsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrScolarite]
    
    def get(self, request):
        records = AttendanceRecord.objects.all().order_by('-session_instance__date')
        return Response(AttendanceRecordSerializer(records, many=True).data)
