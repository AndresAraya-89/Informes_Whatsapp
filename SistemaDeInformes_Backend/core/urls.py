# core/urls.py
from django.urls import path
from .views import(ContactoListCreateView, 
                    ContactoDetailView, 
                    ArchivoDetailView, 
                    ArchivoListView,
                    HistorialEnviosView,
                    EnvioCreateView,
                    EnviarInformeView,
                    EnviarMensajeTextView
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
]
