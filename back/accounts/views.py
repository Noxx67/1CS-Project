from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
 
from .models import User
from .serializers import (
    UserSerializer, CreateUserSerializer,
    LoginSerializer, ChangePasswordSerializer, UpdateUserSerializer
)
from .permissions import IsAdmin
 
 
# ============================================================
# VUE 1 : CONNEXION
# POST /api/accounts/login/
# ============================================================
class LoginView(APIView):
    """
    Permet à un utilisateur de se connecter avec email + mot de passe.
    Retourne un token JWT + info sur si le mot de passe doit être changé.
    """
    permission_classes = [AllowAny]  # Pas besoin d'être connecté pour se connecter !
 
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
 
        if not serializer.is_valid():
            return Response(
                {'error': 'Données invalides', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
 
        email    = serializer.validated_data['email']
        password = serializer.validated_data['password']
 
        # Chercher l'utilisateur par email
        try:
            user_obj = User.objects.get(email=email.lower())
        except User.DoesNotExist:
            return Response(
                {'error': 'Email ou mot de passe incorrect.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
 
        # Vérifier que le compte est actif
        if not user_obj.is_active:
            return Response(
                {'error': 'Ce compte est désactivé. Contactez l administrateur.'},
                status=status.HTTP_403_FORBIDDEN
            )
 
        # Vérifier le mot de passe
        user = authenticate(request, username=email.lower(), password=password)
        if user is None:
            return Response(
                {'error': 'Email ou mot de passe incorrect.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
 
        # Générer les tokens JWT
        refresh = RefreshToken.for_user(user)
        access  = str(refresh.access_token)
 
        # Préparer la réponse
        response_data = {
            'access':               access,
            'refresh':              str(refresh),
            'user':                 UserSerializer(user).data,
            'must_change_password': user.must_change_password,
        }
 
        # Message spécial si mot de passe temporaire
        if user.must_change_password:
            response_data['message'] = (
                'Connexion réussie. Vous devez changer votre mot de passe temporaire.'
            )
        else:
            response_data['message'] = 'Connexion réussie.'
 
        return Response(response_data, status=status.HTTP_200_OK)
 
 
# ============================================================
# VUE 2 : CHANGER LE MOT DE PASSE
# POST /api/accounts/change-password/
# ============================================================
class ChangePasswordView(APIView):
    """
    Permet à un utilisateur de changer son mot de passe.
    Fonctionne pour :
    - Le changement forcé du mot de passe temporaire
    - Le changement volontaire du mot de passe
    L'utilisateur DOIT être connecté (avoir un token JWT valide).
    """
    permission_classes = [IsAuthenticated]
 
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
 
        if not serializer.is_valid():
            return Response(
                {'error': 'Données invalides', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
 
        user        = request.user
        old_password = serializer.validated_data['old_password']
        new_password = serializer.validated_data['new_password']
 
        # Vérifier que l'ancien mot de passe est correct
        if not user.check_password(old_password):
            return Response(
                {'error': "L'ancien mot de passe est incorrect."},
                status=status.HTTP_400_BAD_REQUEST
            )
 
        # Vérifier que le nouveau mot de passe est différent de l'ancien
        if old_password == new_password:
            return Response(
                {'error': 'Le nouveau mot de passe doit être différent de l ancien.'},
                status=status.HTTP_400_BAD_REQUEST
            )
 
        # Changer le mot de passe
        user.set_password(new_password)
        # IMPORTANT : Marquer que le mot de passe n'est plus temporaire
        user.must_change_password = False
        user.save()
 
        # Générer de nouveaux tokens (les anciens sont invalidés)
        refresh = RefreshToken.for_user(user)
 
        return Response({
            'message': 'Mot de passe changé avec succès.',
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_200_OK)
 
 
# ============================================================
# VUE 3 : DÉCONNEXION
# POST /api/accounts/logout/
# ============================================================
class LogoutView(APIView):
    """
    Invalide le refresh token pour déconnecter l'utilisateur.
    """
    permission_classes = [IsAuthenticated]
 
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Le refresh token est obligatoire.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            token = RefreshToken(refresh_token)
            token.blacklist()  # Invalide le token
            return Response(
                {'message': 'Déconnexion réussie.'},
                status=status.HTTP_200_OK
            )
        except Exception:
            return Response(
                {'error': 'Token invalide ou déjà utilisé.'},
                status=status.HTTP_400_BAD_REQUEST
            )
 
 
# ============================================================
# VUE 4 : PROFIL DE L'UTILISATEUR CONNECTÉ
# GET /api/accounts/me/
# ============================================================
class MeView(APIView):
    """
    Retourne les informations de l'utilisateur actuellement connecté.
    """
    permission_classes = [IsAuthenticated]
 
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
 
 
# ============================================================
# VUE 5 : LISTE DE TOUS LES UTILISATEURS (Admin seulement)
# GET  /api/accounts/users/         -> Lister tous les utilisateurs
# POST /api/accounts/users/         -> Créer un nouvel utilisateur
# ============================================================
class UserListCreateView(APIView):
    """
    Admin peut voir tous les utilisateurs et en créer de nouveaux.
    """
    permission_classes = [IsAuthenticated, IsAdmin]
 
    def get(self, request):
        """Retourne la liste de tous les utilisateurs."""
        # Filtres optionnels via paramètres URL
        # Exemple: /api/accounts/users/?role=STUDENT
        role   = request.query_params.get('role', None)
        active = request.query_params.get('is_active', None)
 
        users = User.objects.all().order_by('last_name', 'first_name')
 
        if role:
            users = users.filter(role=role.upper())
        if active is not None:
            users = users.filter(is_active=active.lower() == 'true')
 
        serializer = UserSerializer(users, many=True)
        return Response({
            'count': users.count(),
            'users': serializer.data
        })
 
    def post(self, request):
        """Crée un nouvel utilisateur avec un mot de passe temporaire."""
        serializer = CreateUserSerializer(data=request.data)
 
        if not serializer.is_valid():
            return Response(
                {'error': 'Données invalides', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
 
        user = serializer.save()
 
        return Response({
            'message': f'Compte créé avec succès pour {user.full_name}.',
            'user':    UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)
 
 
# ============================================================
# VUE 6 : DÉTAIL D'UN UTILISATEUR (Admin seulement)
# GET    /api/accounts/users/<id>/  -> Voir un utilisateur
# PUT    /api/accounts/users/<id>/  -> Modifier un utilisateur
# DELETE /api/accounts/users/<id>/  -> Supprimer un utilisateur
# ============================================================
class UserDetailView(APIView):
    """
    Admin peut voir, modifier ou supprimer un utilisateur spécifique.
    """
    permission_classes = [IsAuthenticated, IsAdmin]
 
    def get_user(self, pk):
        return get_object_or_404(User, pk=pk)
 
    def get(self, request, pk):
        """Voir les détails d'un utilisateur."""
        user = self.get_user(pk)
        serializer = UserSerializer(user)
        return Response(serializer.data)
 
    def put(self, request, pk):
        """Modifier les informations d'un utilisateur."""
        user = self.get_user(pk)
        serializer = UpdateUserSerializer(user, data=request.data, partial=True)
 
        if not serializer.is_valid():
            return Response(
                {'error': 'Données invalides', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
 
        serializer.save()
        return Response({
            'message': 'Utilisateur mis à jour avec succès.',
            'user':    UserSerializer(user).data
        })
 
    def delete(self, request, pk):
        """Désactiver (soft delete) un utilisateur plutôt que de le supprimer."""
        user = self.get_user(pk)
 
        # On ne supprime pas vraiment - on désactive juste
        user.is_active = False
        user.save()
 
        return Response(
            {'message': f'Compte de {user.full_name} désactivé avec succès.'},
            status=status.HTTP_200_OK
        )
 
 
# ============================================================
# VUE 7 : RÉINITIALISER LE MOT DE PASSE (Admin seulement)
# POST /api/accounts/users/<id>/reset-password/
# ============================================================
class AdminResetPasswordView(APIView):
    """
    L'admin peut réinitialiser le mot de passe d'un utilisateur
    et lui en donner un nouveau temporaire.
    """
    permission_classes = [IsAuthenticated, IsAdmin]
 
    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        new_temp_password = request.data.get('new_password')
 
        if not new_temp_password:
            return Response(
                {'error': 'Le nouveau mot de passe temporaire est obligatoire.'},
                status=status.HTTP_400_BAD_REQUEST
            )
 
        if len(new_temp_password) < 8:
            return Response(
                {'error': 'Le mot de passe doit avoir au moins 8 caractères.'},
                status=status.HTTP_400_BAD_REQUEST
            )
 
        # Changer le mot de passe et forcer le changement à la prochaine connexion
        user.set_password(new_temp_password)
        user.must_change_password = True  # Force le changement au prochain login
        user.save()
 
        return Response({
            'message': f'Mot de passe de {user.full_name} réinitialisé. '
                       'L utilisateur devra le changer à la prochaine connexion.'
        })
    
# ============================================================
# VUE 8 : PHOTO DE PROFIL
# PUT /api/accounts/me/picture/
# ============================================================
class UpdateProfilePictureView(APIView):
    """
    Permet à un utilisateur de mettre à jour sa photo de profil.
    """
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user

        if 'profile_picture' not in request.data:
            return Response(
                {'error': 'Aucune image fournie.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.profile_picture = request.data['profile_picture']
        user.save()

        return Response({
            'message': 'Photo de profil mise à jour avec succès.',
            'profile_picture': request.build_absolute_uri(user.profile_picture.url)
        })
