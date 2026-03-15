from rest_framework.permissions import BasePermission
 
 
class IsAdmin(BasePermission):
    """
    Autorisation : Seulement les Administrateurs.
    Utilisé pour : créer des comptes, voir tous les utilisateurs.
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'ADMIN'
        )
 
 
class IsAdminOrScolarite(BasePermission):
    """
    Autorisation : Admin ou service Scolarité.
    Utilisé pour : voir les statistiques, gérer les justificatifs.
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'SCOLARITE']
        )
 
 
class IsTeacher(BasePermission):
    """
    Autorisation : Seulement les Enseignants.
    Utilisé pour : saisir les absences.
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'TEACHER'
        )
 
 
class IsStudent(BasePermission):
    """
    Autorisation : Seulement les Étudiants.
    Utilisé pour : voir ses propres absences, déposer justificatifs.
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'STUDENT'
        )
 
 
class IsPasswordChangeRequired(BasePermission):
    """
    Permission spéciale : autorise UNIQUEMENT le changement de mot de passe.
    Si l'utilisateur a must_change_password=True, il ne peut faire que ça.
    """
    message = (
        'Vous devez changer votre mot de passe temporaire avant de continuer. '
        'Utilisez le endpoint /api/accounts/change-password/'
    )
 
    def has_permission(self, request, view):
        # L'utilisateur doit être connecté
        if not request.user or not request.user.is_authenticated:
            return False
        # Si le mot de passe doit être changé, on bloque tout sauf
        # la vue de changement de mot de passe elle-même
        return True  # La logique est gérée dans les vues individuelles
