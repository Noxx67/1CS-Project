from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
 
 
# ============================================================
# MANAGER : Classe qui dit à Django comment créer des utilisateurs
# ============================================================
class UserManager(BaseUserManager):
 
    def create_user(self, email, password=None, **extra_fields):
        """
        Crée un utilisateur normal.
        Cette méthode est appelée quand l'admin crée un compte.
        """
        if not email:
            raise ValueError('Un email est obligatoire')
        email = self.normalize_email(email)  # Normalise l'email (met en minuscules)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)  # Hash le mot de passe automatiquement
        user.save(using=self._db)
        return user
 
    def create_superuser(self, email, password=None, **extra_fields):
        """
        Crée un super-utilisateur (pour la commande createsuperuser).
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)
        return self.create_user(email, password, **extra_fields)
 
 
# ============================================================
# MODÈLE USER : La table principale des utilisateurs
# ============================================================
class User(AbstractBaseUser, PermissionsMixin):
    """
    Modèle utilisateur personnalisé.
    On utilise l'EMAIL comme identifiant (pas le username).
    """
 
    # Définition des rôles possibles
    class Role(models.TextChoices):
        ADMIN     = 'ADMIN',     'Administrateur'
        TEACHER   = 'TEACHER',   'Enseignant'
        SCOLARITE = 'SCOLARITE', 'Scolarité'
        STUDENT   = 'STUDENT',   'Étudiant'
 
    # ---- Champs de base ----
    email      = models.EmailField(unique=True, verbose_name='Email')
    first_name = models.CharField(max_length=100, verbose_name='Prénom')
    last_name  = models.CharField(max_length=100, verbose_name='Nom')
    phone = models.CharField(max_length=20, verbose_name='Numéro de téléphone', blank=True)
    role       = models.CharField(
        max_length=20,
        choices=Role.choices,
        verbose_name='Rôle'
    )
 
    # ---- Champ clé : mot de passe temporaire ----
    must_change_password = models.BooleanField(
        default=True,
        verbose_name='Doit changer le mot de passe',
        help_text='Si True, l utilisateur sera forcé à changer son mot de passe à la prochaine connexion'
    )
 
    # ---- Champs de statut ----
    is_active = models.BooleanField(default=True,  verbose_name='Compte actif')
    is_staff  = models.BooleanField(default=False, verbose_name='Accès admin Django')
 
    # ---- Champs de date ----
    date_joined = models.DateTimeField(auto_now_add=True, verbose_name='Date de création')
    last_login  = models.DateTimeField(null=True, blank=True, verbose_name='Dernière connexion')
 
    # ---- Photo de profil (optionnel) ----
    profile_picture = models.ImageField(
        upload_to='profiles/',
        null=True, blank=True,
        verbose_name='Photo de profil'
    )
 
    # ---- Configuration Django ----
    USERNAME_FIELD  = 'email'   # On se connecte avec l'email
    REQUIRED_FIELDS = ['first_name', 'last_name', 'role']
 
    objects = UserManager()
 
    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        ordering = ['last_name', 'first_name']
 
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"
 
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
 
    def is_admin(self):
        return self.role == self.Role.ADMIN
 
    def is_teacher(self):
        return self.role == self.Role.TEACHER
 
    def is_scolarite(self):
        return self.role == self.Role.SCOLARITE
 
    def is_student(self):
        return self.role == self.Role.STUDENT
 
 
# ============================================================
# MODÈLES SPÉCIFIQUES PAR RÔLE
# Ces modèles étendent le profil selon le rôle
# ============================================================
 
class StudentProfile(models.Model):
    user              = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    registration_number = models.CharField(max_length=50, unique=True, verbose_name='Numéro d inscription')
    year              = models.IntegerField(verbose_name='Année')
    speciality        = models.CharField(max_length=100, verbose_name='Spécialité')

    class Meta:
        verbose_name = 'Profil Étudiant'

    def __str__(self):
        return f"{self.user.full_name} - {self.speciality} Année {self.year}"
 
 
class TeacherProfile(models.Model):
    user       = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile')
    field      = models.CharField(max_length=100, verbose_name='Domaine')
    department = models.CharField(max_length=100, verbose_name='Département')

    class Meta:
        verbose_name = 'Profil Enseignant'

    def __str__(self):
        return f"{self.user.full_name} - {self.department}"
