from rest_framework import serializers
from .models import (
    Session, SessionInstance, AttendanceRecord, AbsenceCounter, Justification,
    Exam, ExamRoom, ExamStudentAssignment, ExamAttendanceRecord,
)

class SessionSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField(read_only=True)
    student_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Session
        fields = [
            'id', 'title', 'session_type', 'teacher', 'teacher_name',
            'year', 'specialty', 'section', 'assigned_groups',
            'day', 'start_time', 'end_time', 'room', 'student_count',
        ]
        read_only_fields = ['teacher_name', 'student_count']

    def get_teacher_name(self, obj):
        return getattr(obj.teacher, 'full_name', '') or f"{obj.teacher.first_name} {obj.teacher.last_name}".strip()

    def get_student_count(self, obj):
        import re
        from accounts.models import StudentProfile

        groups = obj.assigned_groups or []
        if not groups:
            return 0

        def normalize_group(g):
            g = str(g).strip().upper()
            m = re.match(r'^G?(\d+)$', g)
            return f'G{m.group(1)}' if m else g

        normalized_groups = {normalize_group(g) for g in groups}
        session_year_int = obj.get_numeric_year()

        return sum(
            1 for p in StudentProfile.objects.all()
            if normalize_group(p.group or '') in normalized_groups
            and (session_year_int is None or p.year == session_year_int)
        )

class SessionInstanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionInstance
        fields = '__all__'

class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    registration_number = serializers.SerializerMethodField()

    date = serializers.SerializerMethodField()
    subject = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    room = serializers.SerializerMethodField()
    justification_status = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceRecord
        fields = ['id', 'session_instance', 'student', 'student_name', 'registration_number', 'status', 'justification_status', 'date', 'subject', 'type', 'time', 'room']

    def get_justification_status(self, obj):
        try:
            return obj.justification.status
        except:
            return None

    def get_time(self, obj):
        session = obj.session_instance.session
        return f"{session.start_time.strftime('%H:%M')} - {session.end_time.strftime('%H:%M')}" if session.start_time and session.end_time else ""

    def get_room(self, obj):
        return obj.session_instance.session.room or ""

    def get_date(self, obj):
        return obj.session_instance.date.strftime("%d %b %Y") if obj.session_instance.date else ""

    def get_subject(self, obj):
        return obj.session_instance.session.title

    def get_type(self, obj):
        return obj.session_instance.session.session_type

    def get_student_name(self, obj):
        return getattr(obj.student, 'full_name', '') or f"{obj.student.first_name} {obj.student.last_name}".strip()

    def get_registration_number(self, obj):
        try:
            return obj.student.student_profile.registration_number or ''
        except Exception:
            return ''



class JustificationSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.full_name')
    absence_details = serializers.SerializerMethodField(read_only=True)
    is_exam = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Justification
        fields = [
            'id', 'student', 'student_name', 'attendance_record', 'exam_attendance_record',
            'absence_details', 'is_exam',
            'justification_type', 'file', 'status', 'submission_date',
            'student_comment', 'scholarite_comment'
        ]
        read_only_fields = ['student', 'status', 'submission_date', 'scholarite_comment']

    def validate(self, attrs):
        exam_record = attrs.get('exam_attendance_record')
        if exam_record is not None and exam_record.exam.is_replacement:
            raise serializers.ValidationError("Justifications are not allowed for replacement exams.")
        return attrs

    def get_is_exam(self, obj):
        return obj.exam_attendance_record is not None

    def get_absence_details(self, obj):
        # Exam justification
        if obj.exam_attendance_record is not None:
            rec = obj.exam_attendance_record
            exam = rec.exam
            return {
                'date': exam.date.strftime("%d %b %Y") if exam.date else '',
                'subject': exam.module,
                'type': f'EXAM — {exam.get_exam_type_display()}',
                'time': f"{exam.start_time.strftime('%H:%M')} - {exam.end_time.strftime('%H:%M')}",
                'room': rec.exam_room.room_name if rec.exam_room else '',
            }
        # Regular session justification
        try:
            record = obj.attendance_record
            session = record.session_instance.session
            return {
                'date': record.session_instance.date.strftime("%d %b %Y"),
                'subject': session.title,
                'type': session.session_type,
                'time': f"{session.start_time.strftime('%H:%M')} - {session.end_time.strftime('%H:%M')}",
                'room': session.room or '',
            }
        except Exception:
            return {}

class AbsenceCounterSerializer(serializers.ModelSerializer):
    class Meta:
        model = AbsenceCounter
        fields = '__all__'


class ExamRoomSerializer(serializers.ModelSerializer):
    supervisors_details = serializers.SerializerMethodField(read_only=True)
    student_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ExamRoom
        fields = ['id', 'exam', 'room_type', 'room_name', 'capacity', 'supervisors', 'supervisors_details', 'student_count']

    def get_supervisors_details(self, obj):
        return [
            {
                'id': u.id,
                'full_name': getattr(u, 'full_name', '') or f"{u.first_name} {u.last_name}".strip(),
                'email': u.email
            }
            for u in obj.supervisors.all()
        ]

    def get_student_count(self, obj):
        return obj.student_assignments.count()


class ExamSerializer(serializers.ModelSerializer):
    teachers_details = serializers.SerializerMethodField(read_only=True)
    rooms = ExamRoomSerializer(many=True, read_only=True)
    student_count = serializers.SerializerMethodField(read_only=True)
    assigned_room = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Exam
        fields = [
            'id', 'module', 'exam_type', 'date', 'start_time', 'end_time',
            'year', 'speciality', 'teachers', 'teachers_details', 'rooms', 'student_count',
            'assigned_room', 'is_replacement', 'original_exam'
        ]

    def get_teachers_details(self, obj):
        return [
            {
                'id': u.id,
                'full_name': getattr(u, 'full_name', '') or f"{u.first_name} {u.last_name}".strip(),
                'email': u.email
            }
            for u in obj.teachers.all()
        ]

    def get_student_count(self, obj):
        return obj.student_assignments.count()

    def get_assigned_room(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.role == 'STUDENT':
            assignment = obj.student_assignments.filter(student=request.user).first()
            if assignment:
                return {
                    'room_name': assignment.exam_room.room_name,
                    'room_type': assignment.exam_room.get_room_type_display(),
                    'order': assignment.order + 1
                }
        return None

    def validate(self, attrs):
        original_exam = attrs.get('original_exam', getattr(self.instance, 'original_exam', None))
        is_replacement = attrs.get('is_replacement', getattr(self.instance, 'is_replacement', False))
        if is_replacement:
            if original_exam is None:
                raise serializers.ValidationError("Replacement exams must reference an original exam.")
            if original_exam.is_replacement:
                raise serializers.ValidationError("A replacement exam cannot be based on another replacement exam.")

            absent_records = ExamAttendanceRecord.objects.filter(exam=original_exam, status='absent')
            eligible = []
            for rec in absent_records:
                try:
                    if rec.justification.status == 'JUSTIFIÉE':
                        eligible.append(rec)
                except Exception:
                    pass
            if not eligible:
                raise serializers.ValidationError("Original exam has no eligible students for replacement.")

        return attrs



class ExamAttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    registration_number = serializers.SerializerMethodField()
    group = serializers.SerializerMethodField()
    room_name = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    subject = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    justification_status = serializers.SerializerMethodField()
    is_replacement = serializers.ReadOnlyField(source='exam.is_replacement')

    class Meta:
        model = ExamAttendanceRecord
        fields = [
            'id', 'exam', 'exam_room', 'student', 'student_name', 'registration_number', 'group',
            'status', 'room_name', 'date', 'subject', 'type', 'time', 'justification_status', 'is_replacement'
        ]

    def get_student_name(self, obj):
        return getattr(obj.student, 'full_name', '') or f"{obj.student.first_name} {obj.student.last_name}".strip()

    def get_registration_number(self, obj):
        try:
            return obj.student.student_profile.registration_number or ''
        except Exception:
            return ''

    def get_group(self, obj):
        try:
            return obj.student.student_profile.group or ''
        except Exception:
            return ''

    def get_room_name(self, obj):
        return obj.exam_room.room_name

    def get_date(self, obj):
        return obj.exam.date.strftime("%d %b %Y") if obj.exam.date else ""

    def get_subject(self, obj):
        return obj.exam.module

    def get_type(self, obj):
        return obj.exam.exam_type

    def get_time(self, obj):
        return f"{obj.exam.start_time.strftime('%H:%M')} - {obj.exam.end_time.strftime('%H:%M')}"

    def get_justification_status(self, obj):
        try:
            return obj.justification.status
        except:
            return None

