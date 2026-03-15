from django.urls import path
from . import views
 
# Préfixe : /api/accounts/
urlpatterns = [
    # Authentification
    path('login/',           views.LoginView.as_view(),          name='login'),
    path('logout/',          views.LogoutView.as_view(),         name='logout'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('me/',              views.MeView.as_view(),             name='me'),
 
    # Gestion des utilisateurs (Admin seulement)
    path('users/',           views.UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/',  views.UserDetailView.as_view(),     name='user-detail'),
    path(
        'users/<int:pk>/reset-password/',
        views.AdminResetPasswordView.as_view(),
        name='admin-reset-password'
    ),
    path('me/picture/', views.UpdateProfilePictureView.as_view(), name='update-picture'),
]
