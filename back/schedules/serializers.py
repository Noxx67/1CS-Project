from rest_framework import serializers
from .models import Session, SessionInstance, AttendanceRecord, AbsenceCounter

class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = '__all__'

class SessionInstanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionInstance
        fields = '__all__'

class AttendanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRecord
        fields = '__all__'

class AbsenceCounterSerializer(serializers.ModelSerializer):
    class Meta:
        model = AbsenceCounter
        fields = '__all__'
