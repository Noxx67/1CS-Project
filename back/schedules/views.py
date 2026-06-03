from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Count, Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import (
    Session, SessionInstance, AttendanceRecord, AbsenceCounter, Justification,
    Exam, ExamRoom, ExamStudentAssignment, ExamAttendanceRecord
)
from .serializers import (
    SessionSerializer,
    SessionInstanceSerializer,
    AttendanceRecordSerializer,
    AbsenceCounterSerializer,
    JustificationSerializer,
    ExamSerializer,
    ExamRoomSerializer,
    ExamAttendanceRecordSerializer
)
from .permissions import IsTeacherOrAdmin
from rest_framework.views import APIView
from accounts.permissions import IsAdminOrScolarite


class SessionViewSet(viewsets.ModelViewSet):
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        user = self.request.user
        queryset = Session.objects.all()

        if getattr(user, 'role', None) == 'TEACHER':
            queryset = queryset.filter(teacher=user)
        elif getattr(user, 'role', None) == 'STUDENT':
            try:
                profile = user.student_profile
                from django.db.models import Q
                base_qs = queryset.filter(
                    year=str(profile.year)
                ).filter(
                    Q(specialty=profile.speciality) | Q(specialty='N/A') | Q(specialty__isnull=True) | Q(specialty='')
                )
                valid_ids = [
                    s.id for s in base_qs
                    if not s.assigned_groups or profile.group in s.assigned_groups
                ]
                queryset = queryset.filter(id__in=valid_ids)
            except Exception:
                return Session.objects.none()

        # Apply frontend filters
        day = self.request.query_params.get('day')
        year = self.request.query_params.get('year')
        specialty = self.request.query_params.get('specialty')
        section = self.request.query_params.get('section')

        if day:
            queryset = queryset.filter(day__iexact=day)
        if year:
            queryset = queryset.filter(year__iexact=year)
        if specialty:
            queryset = queryset.filter(specialty__iexact=specialty)
        if section:
            try:
                queryset = queryset.filter(section=int(section))
            except ValueError:
                pass

        return queryset

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        validated_data = serializer.validated_data
        day = validated_data.get('day')
        start_time = validated_data.get('start_time')
        end_time = validated_data.get('end_time')
        room = validated_data.get('room')

        if day and start_time and end_time and room:
            overlaps = Session.objects.filter(
                day=day,
                room=room,
            ).filter(
                Q(start_time__lt=end_time) & Q(end_time__gt=start_time)
            )
            if overlaps.exists():
                raise ValidationError({"detail": "A session already exists in this room at the specified time."})
        serializer.save()

    def perform_update(self, serializer):
        from rest_framework.exceptions import ValidationError
        instance = self.get_object()
        validated_data = serializer.validated_data
        day = validated_data.get('day', instance.day)
        start_time = validated_data.get('start_time', instance.start_time)
        end_time = validated_data.get('end_time', instance.end_time)
        room = validated_data.get('room', instance.room)

        if day and start_time and end_time and room:
            overlaps = Session.objects.filter(
                day=day,
                room=room,
            ).filter(
                Q(start_time__lt=end_time) & Q(end_time__gt=start_time)
            ).exclude(pk=instance.pk)
            if overlaps.exists():
                raise ValidationError({"detail": "A session already exists in this room at the specified time."})
        serializer.save()

    @action(detail=True, methods=['get'], url_path='students')
    def students(self, request, pk=None):
        """Return all students whose group is in session.assigned_groups."""
        session = self.get_object()
        from accounts.models import StudentProfile
        import re

        groups = session.assigned_groups or []
        
        def normalize_group(g):
            g = str(g).strip().upper()
            m = re.match(r'^G?(\d+)$', g)
            return f'G{m.group(1)}' if m else g

        normalized_groups = [normalize_group(g) for g in groups]
        session_year_int = session.get_numeric_year()

        if normalized_groups:
            all_profiles = StudentProfile.objects.select_related('user')
            profiles = [
                p for p in all_profiles
                if normalize_group(p.group or '') in normalized_groups
                and (session_year_int is None or p.year == session_year_int)
            ]
        else:
            profiles = []

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


def get_replacement_eligible_students(original_exam):
    absent_records = ExamAttendanceRecord.objects.filter(
        exam=original_exam,
        status='absent'
    ).select_related('student')
    eligible = []
    for rec in absent_records:
        try:
            if rec.justification.status == 'JUSTIFIÉE':
                eligible.append(rec.student)
        except Exception:
            continue
    return eligible


def send_replacement_exam_notification(exam, created=False):
    if not exam.is_replacement:
        return

    students = exam.attendance_records.select_related('student').all()
    recipient_list = []
    for record in students:
        if record.student.email:
            recipient_list.append(record.student.email)
    recipient_list = list(dict.fromkeys(recipient_list))
    if not recipient_list:
        return

    teacher_names = [
        getattr(t, 'full_name', '') or f"{t.first_name} {t.last_name}".strip()
        for t in exam.teachers.all()
    ]
    room_names = [room.room_name for room in exam.rooms.all()]
    when_text = f"{exam.date.strftime('%d %b %Y')} {exam.start_time.strftime('%H:%M')} - {exam.end_time.strftime('%H:%M')}"
    room_text = ', '.join(room_names) if room_names else 'TBD'
    teacher_text = ', '.join([name for name in teacher_names if name]) or 'TBD'
    action_word = 'has been scheduled' if created else 'has been updated'
    subject = f"Replacement exam {action_word}: {exam.module}"
    body = (
        f"A replacement exam {action_word} for {exam.module}.\n\n"
        f"Original exam: {exam.original_exam.module if exam.original_exam else 'N/A'}\n"
        f"Date & time: {when_text}\n"
        f"Room: {room_text}\n"
        f"Assigned teachers: {teacher_text}\n\n"
        "Important: absences during replacement exams cannot be justified and no further replacement exam will be generated for this session."
    )
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@example.com')
    send_mail(subject, body, from_email, recipient_list, fail_silently=True)


def get_replacement_status_label(record):
    today = timezone.localdate()
    exam_date = record.exam.date
    if exam_date > today:
        return 'Upcoming'
    if record.status == 'present':
        return 'Completed'
    if record.status == 'absent':
        return 'Missed'
    return 'Upcoming'


def setup_exam_assignments(exam, rooms_data=None):
    # Clear existing assignments & attendance
    exam.student_assignments.all().delete()
    exam.attendance_records.all().delete()

    if rooms_data is not None:
        exam.rooms.all().delete()
        rooms = []
        for r_data in rooms_data:
            name = r_data.get('name', '')
            rtype = r_data.get('type', 'SALLE')
            cap = int(r_data.get('capacity', 20))
            rooms.append(ExamRoom.objects.create(
                exam=exam,
                room_type=rtype,
                room_name=name,
                capacity=cap
            ))
    else:
        rooms = list(exam.rooms.all())

    # Assign teachers to rooms
    for r in rooms:
        r.supervisors.clear()

    teachers = list(exam.teachers.all())
    import random
    random.shuffle(teachers)

    idx = 0
    # Amphi needs 3 teachers, each salle needs 1
    for r in rooms:
        req = 3 if r.room_type == ExamRoom.RoomType.AMPHI else 1
        for _ in range(req):
            if idx < len(teachers):
                r.supervisors.add(teachers[idx])
                idx += 1

    # Fetch students — for replacement exams only assign eligible students
    if exam.is_replacement and exam.original_exam:
        # Eligible: absent in original exam WITH an approved justification
        absent_records = ExamAttendanceRecord.objects.filter(
            exam=exam.original_exam, status='absent'
        ).select_related('student')
        eligible_users = []
        for rec in absent_records:
            try:
                if rec.justification.status == 'JUSTIFIÉE':
                    eligible_users.append(rec.student)
            except Exception:
                pass
        students_to_assign = sorted(eligible_users, key=lambda u: (u.last_name or '', u.first_name or ''))
    else:
        from accounts.models import StudentProfile
        numeric_year = exam.get_numeric_year()
        students_qs = StudentProfile.objects.select_related('user').filter(user__is_active=True)
        if numeric_year is not None:
            students_qs = students_qs.filter(year=numeric_year)
        if exam.speciality and exam.speciality != 'N/A':
            students_qs = students_qs.filter(speciality__iexact=exam.speciality)
        profiles = sorted(list(students_qs), key=lambda p: (p.user.last_name or '', p.user.first_name or ''))
        students_to_assign = [p.user for p in profiles]

    # Assign students to rooms based on capacity
    student_idx = 0
    for room in rooms:
        room_capacity = room.capacity
        for _ in range(room_capacity):
            if student_idx >= len(students_to_assign):
                break
            student_user = students_to_assign[student_idx]

            # Create assignment
            ExamStudentAssignment.objects.create(
                exam=exam,
                exam_room=room,
                student=student_user,
                order=student_idx
            )

            # Create attendance record
            ExamAttendanceRecord.objects.create(
                exam=exam,
                exam_room=room,
                student=student_user,
                status='unmarked'
            )

            student_idx += 1


class ExamViewSet(viewsets.ModelViewSet):
    serializer_class = ExamSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Exam.objects.all()

        if getattr(user, 'role', None) == 'TEACHER':
            queryset = queryset.filter(Q(teachers=user) | Q(rooms__supervisors=user)).distinct()
        elif getattr(user, 'role', None) == 'STUDENT':
            try:
                profile = user.student_profile
                queryset = queryset.filter(year=str(profile.year))
                if profile.speciality and profile.speciality != 'N/A':
                    queryset = queryset.filter(Q(speciality=profile.speciality) | Q(speciality='') | Q(speciality__isnull=True))
            except Exception:
                return Exam.objects.none()

        module = self.request.query_params.get('module')
        year = self.request.query_params.get('year')
        if module:
            queryset = queryset.filter(module__icontains=module)
        if year:
            queryset = queryset.filter(year__iexact=year)

        return queryset

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        validated_data = serializer.validated_data
        date = validated_data.get('date')
        start_time = validated_data.get('start_time')
        end_time = validated_data.get('end_time')
        
        rooms_data = self.request.data.get('rooms', [])
        room_names = [r.get('name') for r in rooms_data if r.get('name')]
        
        if not room_names:
            raise ValidationError({"detail": "At least one room is required."})

        overlaps = ExamRoom.objects.filter(
            exam__date=date,
            room_name__in=room_names
        ).filter(
            Q(exam__start_time__lt=end_time) & Q(exam__end_time__gt=start_time)
        )
        if overlaps.exists():
            overlap_room = overlaps.first().room_name
            raise ValidationError({"detail": f"An exam already exists in room {overlap_room} at the specified time."})
            
        exam = serializer.save(created_by=self.request.user)
        setup_exam_assignments(exam, rooms_data)
        send_replacement_exam_notification(exam, created=True)

    def perform_update(self, serializer):
        from rest_framework.exceptions import ValidationError
        instance = self.get_object()
        validated_data = serializer.validated_data
        date = validated_data.get('date', instance.date)
        start_time = validated_data.get('start_time', instance.start_time)
        end_time = validated_data.get('end_time', instance.end_time)
        
        rooms_data = self.request.data.get('rooms')
        if rooms_data is not None:
            room_names = [r.get('name') for r in rooms_data if r.get('name')]
            if not room_names:
                raise ValidationError({"detail": "At least one room is required."})
            
            overlaps = ExamRoom.objects.filter(
                exam__date=date,
                room_name__in=room_names
            ).filter(
                Q(exam__start_time__lt=end_time) & Q(exam__end_time__gt=start_time)
            ).exclude(exam__pk=instance.pk)
            if overlaps.exists():
                overlap_room = overlaps.first().room_name
                raise ValidationError({"detail": f"An exam already exists in room {overlap_room} at the specified time."})

        exam = serializer.save()
        if rooms_data is not None:
            setup_exam_assignments(exam, rooms_data)
        else:
            setup_exam_assignments(exam, None)
        send_replacement_exam_notification(exam, created=False)

    @action(detail=True, methods=['get', 'post'], url_path='start_attendance')
    def start_attendance(self, request, pk=None):
        exam = self.get_object()
        user = request.user
        
        room = None
        if getattr(user, 'role', None) == 'TEACHER':
            room = exam.rooms.filter(supervisors=user).first()
            if not room:
                return Response({'error': 'You are not supervising any room for this exam.'}, status=status.HTTP_403_FORBIDDEN)
        else:
            room_id = request.query_params.get('room_id')
            if room_id:
                room = exam.rooms.filter(id=room_id).first()
            else:
                room = exam.rooms.first()
                
        if not room:
            return Response({'error': 'No room found for this exam.'}, status=status.HTTP_404_NOT_FOUND)

        records = ExamAttendanceRecord.objects.filter(exam=exam, exam_room=room)
        
        students_data = [
            {
                'record_id': r.id,
                'student_id': r.student.id,
                'full_name': getattr(r.student, 'full_name', '') or f"{r.student.first_name} {r.student.last_name}".strip(),
                'registration_number': getattr(r.student.student_profile, 'registration_number', '') if hasattr(r.student, 'student_profile') else '',
                'group': getattr(r.student.student_profile, 'group', '') if hasattr(r.student, 'student_profile') else '',
                'status': r.status,
            }
            for r in records
        ]
        
        return Response({
            'exam_id': exam.id,
            'room_id': room.id,
            'room_name': room.room_name,
            'date': str(exam.date),
            'students': students_data,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='my_exams')
    def my_exams(self, request):
        user = request.user
        if getattr(user, 'role', None) != 'TEACHER':
            return Response({'error': 'Only teachers can access this endpoint.'}, status=status.HTTP_403_FORBIDDEN)
        exams = Exam.objects.filter(Q(teachers=user) | Q(rooms__supervisors=user)).distinct().order_by('date', 'start_time')
        serializer = ExamSerializer(exams, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='eligible_for_replacement')
    def eligible_for_replacement(self, request, pk=None):
        """Return students who were absent in this exam AND have an approved justification."""
        if getattr(request.user, 'role', None) not in ['ADMIN', 'SCOLARITE']:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        exam = self.get_object()
        absent_records = ExamAttendanceRecord.objects.filter(exam=exam, status='absent')
        eligible = []
        for record in absent_records:
            try:
                justification = record.justification
                if justification.status == 'JUSTIFIÉE':
                    eligible.append({
                        'student_id': record.student.id,
                        'full_name': getattr(record.student, 'full_name', '') or f"{record.student.first_name} {record.student.last_name}".strip(),
                        'registration_number': getattr(record.student.student_profile, 'registration_number', '') if hasattr(record.student, 'student_profile') else '',
                    })
            except Exception:
                pass
        return Response({'count': len(eligible), 'students': eligible})

    @action(detail=False, methods=['get'], url_path='my_replacement_exams')
    def my_replacement_exams(self, request):
        """Return replacement exams for the current student."""
        user = request.user
        if getattr(user, 'role', None) != 'STUDENT':
            return Response({'error': 'Only students can access this endpoint.'}, status=status.HTTP_403_FORBIDDEN)
        # Find replacement exams where this student has an attendance record
        replacement_records = ExamAttendanceRecord.objects.filter(
            student=user,
            exam__is_replacement=True
        ).select_related('exam', 'exam_room')
        result = []
        for record in replacement_records:
            exam = record.exam
            original = exam.original_exam
            teachers = list(exam.teachers.all())
            supervisor_names = []
            for room in exam.rooms.all():
                supervisor_names += [getattr(s, 'full_name', '') or f"{s.first_name} {s.last_name}".strip() for s in room.supervisors.all()]
            result.append({
                'id': record.id,
                'exam_id': exam.id,
                'module': exam.module,
                'exam_type': exam.exam_type,
                'date': str(exam.date),
                'start_time': str(exam.start_time)[:5],
                'end_time': str(exam.end_time)[:5],
                'room_name': record.exam_room.room_name,
                'room_type': record.exam_room.get_room_type_display(),
                'status': record.status,
                'original_module': original.module if original else exam.module,
                'teachers': [getattr(t, 'full_name', '') or f"{t.first_name} {t.last_name}".strip() for t in teachers],
                'supervisors': supervisor_names,
            })
        return Response(result)


class ExamAttendanceRecordViewSet(viewsets.ModelViewSet):
    serializer_class = ExamAttendanceRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) in ['ADMIN', 'SCOLARITE']:
            return ExamAttendanceRecord.objects.all()
        if getattr(user, 'role', None) == 'TEACHER':
            return ExamAttendanceRecord.objects.filter(exam_room__supervisors=user)
        return ExamAttendanceRecord.objects.filter(student=user)

    @action(detail=True, methods=['post', 'patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        record = self.get_object()
        new_status = request.data.get('status')
        if new_status in dict(ExamAttendanceRecord.STATUS_CHOICES):
            record.status = new_status
            record.marked_by = request.user
            record.marked_at = timezone.now()
            record.save()
            return Response({'status': record.status})
        return Response({'error': f'Invalid status: {new_status}'}, status=status.HTTP_400_BAD_REQUEST)

