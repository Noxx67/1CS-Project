from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
 
urlpatterns = [
    # Interface admin Django (utile pour le debug)
    path('django-admin/', admin.site.urls),
 
    # Rafraîchir le token JWT
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
 
    # Application comptes
    path('api/accounts/', include('accounts.urls')),
 
    # Futurs modules (à ajouter plus tard)
    # path('api/absences/', include('absences.urls')),
    # path('api/justificatifs/', include('justificatifs.urls')),
]
 
# Servir les fichiers médias en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
