from rest_framework import serializers
from .models import Session, SessionInstance, AttendanceRecord, AbsenceCounter, Justification

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

    class Meta:
        model = Justification
        fields = [
            'id', 'student', 'student_name', 'attendance_record', 'absence_details',
            'justification_type', 'file', 'status', 'submission_date', 
            'student_comment', 'scholarite_comment'
        ]
        read_only_fields = ['student', 'status', 'submission_date', 'scholarite_comment']

    def get_absence_details(self, obj):
        record = obj.attendance_record
        session = record.session_instance.session
        return {
            'date': record.session_instance.date.strftime("%d %b %Y"),
            'subject': session.title,
            'type': session.session_type,
            'time': f"{session.start_time.strftime('%H:%M')} - {session.end_time.strftime('%H:%M')}"
        }

class AbsenceCounterSerializer(serializers.ModelSerializer):
    class Meta:
        model = AbsenceCounter
        fields = '__all__'
