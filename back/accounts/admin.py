# accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, StudentProfile, TeacherProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ['email', 'first_name', 'last_name', 'role', 'is_active', 'must_change_password']
    list_filter   = ['role', 'is_active', 'must_change_password']
    search_fields = ['email', 'first_name', 'last_name']
    ordering      = ['last_name', 'first_name']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informations personnelles', {'fields': ('first_name', 'last_name', 'phone', 'profile_picture')}),
        ('Rôle et statut', {'fields': ('role', 'is_active', 'must_change_password')}),
        ('Permissions', {'fields': ('is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'phone', 'role', 'password1', 'password2'),
        }),
    )


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display  = ['user', 'registration_number', 'speciality', 'year']
    search_fields = ['user__email', 'registration_number', 'speciality']


@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display  = ['user', 'field', 'department']
    search_fields = ['user__email', 'field', 'department']