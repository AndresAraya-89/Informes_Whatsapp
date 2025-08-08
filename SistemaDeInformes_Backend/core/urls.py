# core/urls.py
from django.urls import path
from .views import(ContactoListCreateView, 
                    ContactoDetailView, 
                    ArchivoDetailView, 
                    ArchivoListView,
                    HistorialEnviosView,
                    EnvioCreateView,
                    EnviarInformeView,
                    EnviarMensajeTextView,
                    UploadToDriveAPIView,
                    AuthorizeView,
                    OAuth2CallbackView
                   )


urlpatterns = [
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


]
