# accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, StudentProfile, TeacherProfile


# ============================================================
# SERIALIZER DE BASE (informations communes à tous)
# ============================================================
class UserSerializer(serializers.ModelSerializer):
    """Sérialise les informations d'un utilisateur pour l'affichage."""
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'phone', 'is_active', 'must_change_password', 'date_joined','profile_picture',
        ]
        read_only_fields = ['id', 'date_joined', 'must_change_password']


# ============================================================
# SERIALIZER POUR LA CRÉATION D'UN UTILISATEUR (par l'admin)
# ============================================================
class CreateUserSerializer(serializers.ModelSerializer):
    """
    Utilisé par l'admin pour créer un nouveau compte.
    L'admin fournit un mot de passe temporaire.
    """
    # Champs profil étudiant
    registration_number = serializers.CharField(required=False, write_only=True)
    year                = serializers.IntegerField(required=False, write_only=True)
    speciality          = serializers.CharField(required=False, write_only=True)
    # Champs profil enseignant
    field               = serializers.CharField(required=False, write_only=True)
    department          = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'role', 'password', 'phone',
            # Student
            'registration_number', 'year', 'speciality',
            # Teacher
            'field', 'department',
        ]
        extra_kwargs = {
            'password': {
                'write_only': True,
                'style': {'input_type': 'password'}
            }
        }

    def validate_email(self, value):
        """Vérifie que l'email n'est pas déjà utilisé."""
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError(
                "Un utilisateur avec cet email existe déjà."
            )
        return value.lower()

    def validate(self, attrs):
        """Validations croisées selon le rôle."""
        role = attrs.get('role')

        if role == User.Role.STUDENT:
            if not attrs.get('registration_number'):
                raise serializers.ValidationError(
                    {'registration_number': 'Le numéro d inscription est obligatoire.'}
                )
            if not attrs.get('year'):
                raise serializers.ValidationError(
                    {'year': "L'année est obligatoire."}
                )
            if not attrs.get('speciality'):
                raise serializers.ValidationError(
                    {'speciality': 'La spécialité est obligatoire.'}
                )

        if role == User.Role.TEACHER:
            if not attrs.get('field'):
                raise serializers.ValidationError(
                    {'field': 'Le domaine est obligatoire.'}
                )
            if not attrs.get('department'):
                raise serializers.ValidationError(
                    {'department': 'Le département est obligatoire.'}
                )
        return attrs

    def create(self, validated_data):
        """
        Crée l'utilisateur ET son profil spécifique.
        Le mot de passe est hashé automatiquement.
        """
        # Extraire les données des profils spécifiques
        student_data = {
            'registration_number': validated_data.pop('registration_number', None),
            'year':                validated_data.pop('year', None),
            'speciality':          validated_data.pop('speciality', None),
        }
        teacher_data = {
            'field':      validated_data.pop('field', None),
            'department': validated_data.pop('department', None),
        }

        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)

        if user.role == User.Role.STUDENT:
            StudentProfile.objects.create(user=user, **student_data)

        if user.role == User.Role.TEACHER:
            TeacherProfile.objects.create(user=user, **teacher_data)

        return user


# ============================================================
# SERIALIZER POUR LA CONNEXION
# ============================================================
class LoginSerializer(serializers.Serializer):
    """Utilisé pour se connecter."""
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)


# ============================================================
# SERIALIZER POUR CHANGER LE MOT DE PASSE
# ============================================================
class ChangePasswordSerializer(serializers.Serializer):
    """
    Utilisé quand un utilisateur veut changer son mot de passe.
    Nécessite l'ancien mot de passe pour confirmer l'identité.
    """
    old_password     = serializers.CharField(write_only=True, required=True)
    new_password     = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate_new_password(self, value):
        """Valide que le nouveau mot de passe respecte les règles."""
        validate_password(value)
        return value

    def validate(self, attrs):
        """Vérifie que les deux nouveaux mots de passe correspondent."""
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError(
                {'confirm_password': 'Les deux mots de passe ne correspondent pas.'}
            )
        return attrs


# ============================================================
# SERIALIZER POUR METTRE À JOUR UN PROFIL
# ============================================================
class UpdateUserSerializer(serializers.ModelSerializer):
    """Permet à l'admin de modifier les informations d'un utilisateur."""
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'role', 'phone', 'is_active']
        extra_kwargs = {'email': {'required': False}}