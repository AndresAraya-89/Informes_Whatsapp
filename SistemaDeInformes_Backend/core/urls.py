# core/urls.py
from django.urls import path, include
from .views import(
    ContactoListCreateView, 
    ContactoDetailView, 
    ArchivoDetailView, 
    ArchivoListView,
    HistorialEnviosView,
    EnvioCreateView,
    EnviarInformeView,
    EnviarMensajeTextView,
    UploadToDriveAPIView,
    AuthorizeView,
    OAuth2CallbackView,
    UserViewSet,
    UserProfileView,
    UserStatusUpdateView,
    MyTokenObtainPairView,
    ForgotPasswordView,
    ChangePasswordView
)

from rest_framework_simplejwt.views import (
    # TokenObtainPairView, <-- Ya no la usamos, la reemplazamos por la nuestra
    TokenRefreshView,
)
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')


urlpatterns = [
    # Rutas existentes
    path('contactos/', ContactoListCreateView.as_view(), name='lista-crear-contactos'),
    path('contactos/<int:id_contacto>/', ContactoDetailView.as_view(), name='detalle-contacto'),
    
    path('archivos/', ArchivoListView.as_view(), name='lista-archivos'),
    path('archivos/<int:id_archivo>/', ArchivoDetailView.as_view(), name='detalle-archivo'),
    
    path('envios/', EnvioCreateView.as_view(), name='crear-envio'),
    path('envios/<int:id_contacto>/historial/', HistorialEnviosView.as_view(), name='historial-envios-contacto'),
    path('contactos/<int:id_contacto>/historial/', HistorialEnviosView.as_view(), name='historial-envios'),
    path('enviar-informe/', EnviarInformeView.as_view(), name='enviar-informe'),
    path('enviar-mensaje-texto/', EnviarMensajeTextView.as_view(), name='enviar-mensaje-texto'),
    
    path('upload-to-drive/', UploadToDriveAPIView.as_view(), name='upload_to_drive'),
    path('authorize/', AuthorizeView.as_view(), name='authorize'),
    path('oauth2callback/', OAuth2CallbackView.as_view(), name='oauth2callback'),

    # --- RUTAS DE AUTENTICACIÓN ACTUALIZADAS ---
    
    # Ruta de Login (Usa nuestra vista personalizada)
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Nuevas rutas para recuperación
    path('recuperar-password/', ForgotPasswordView.as_view(), name='recuperar_password'),
    path('cambiar-password/', ChangePasswordView.as_view(), name='cambiar_password'),

    # Rutas de Usuarios
    path('users/me/', UserProfileView.as_view(), name='user-profile'), 
    path('users/update-status/<int:pk>/', UserStatusUpdateView.as_view(), name='user-status-update'),
    path('', include(router.urls)), 
]