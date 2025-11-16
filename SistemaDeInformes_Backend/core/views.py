# core/views.py
from django.shortcuts import redirect
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets, permissions
# --- AÑADIMOS 'services' y 'random' ---
from .services import (
    ArchivoService, 
    ContactoService, 
    EnvioService, 
    InformeService, 
    UsuarioService # <-- Importamos el servicio de usuario
)
import base64
from .drive_service import DriveService
from .models import Usuario
from .serializers import (
    UserSerializer, 
    UserStatusSerializer, 
    MyTokenObtainPairSerializer, # <-- Importamos el serializador de token
    ChangePasswordSerializer
)
from .permissions import IsAdminOrSelf, IsAdminOrReadOnly
from rest_framework_simplejwt.views import TokenObtainPairView

# --- AÑADIMOS 'string' y 'random' PARA LA CONTRASEÑA ---
import string
import random

# =============================================
# VISTAS PARA CONTACTOS
# =============================================
class ContactoListCreateView(APIView):
    """
    Vista para listar, buscar por nombre y crear contactos.
    Endpoint: /api/contactos/
    """
    def get(self, request):
        nombre = request.query_params.get('nombre', None)
        telefono = request.query_params.get('telefono', None)
        correo = request.query_params.get('correo', None)
        estado = request.query_params.get('estado', 'activos') 

        contactos = []
        try:
            if nombre:
                contactos = ContactoService.buscar_por_nombre(nombre)
            elif telefono:
                contacto = ContactoService.buscar_por_telefono(telefono)
                if contacto:
                    contactos = [contacto]
            elif correo:
                contacto = ContactoService.buscar_por_correo(correo)
                if contacto:
                    contactos = [contacto]
            elif estado == 'todos':
                contactos = ContactoService.obtener_todos_contactos()
            elif estado == 'inactivos':
                contactos = ContactoService.obtener_contactos_inactivos()
            elif estado == 'gerenciales':
                contactos = ContactoService.obtener_contactos_gerenciales()
            else: # Por defecto o si estado == 'activos'
                contactos = ContactoService.obtener_contactos_activos()
            
            return Response(contactos, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': f"Ocurrió un error en el servidor: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def post(self, request):
        try:
            data = request.data
            resultado = ContactoService.crear_contacto(
                nombre=data.get('Nombre'),
                telefono=data.get('Telefono'),
                correo_electronico=data.get('CorreoElectronico')
            )

            print(f"DEBUG: Resultado del servicio = {resultado}")

            if resultado and resultado.get('Status') == 'SUCCESS':
                return Response({'id_contacto': resultado.get('NewId')}, status=status.HTTP_201_CREATED)
            
            elif resultado and resultado.get('Status') == 'CONFLICT':
                return Response({'error': resultado.get('Message')}, status=status.HTTP_409_CONFLICT)
                
            else:
                return Response({
                    'error': 'El servicio devolvió una respuesta inesperada.',
                    'detalle_del_servicio': resultado
                }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({'error': f"Ocurrió un error interno en el servidor: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            
class ContactoDetailView(APIView):
    def get(self, request, id_contacto):
        contacto = ContactoService.obtener_contacto_por_id(id_contacto)
        if contacto:
            return Response(contacto, status=status.HTTP_200_OK)
        return Response({'error': 'Contacto no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, id_contacto):
        data = request.data
        ContactoService.actualizar_contacto(
            id_contacto=id_contacto,
            nombre=data.get('Nombre'),
            telefono=data.get('Telefono'),
            correo_electronico=data.get('CorreoElectronico'),
            estado=data.get('Estado')
        )
        return Response({'mensaje': 'Contacto actualizado con éxito'}, status=status.HTTP_200_OK)

    def delete(self, request, id_contacto):
        ContactoService.eliminar_contacto(id_contacto)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
# =============================================
# VISTAS PARA ARCHIVOS
# =============================================
class ArchivoListView(APIView):
    def get(self, request):
        nombre = request.query_params.get('nombre', None)
        if nombre:
            archivos = ArchivoService.buscar_archivo_por_nombre(nombre)
        else:
            archivos = ArchivoService.obtener_todos_los_archivos()
        return Response(archivos, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data
        url_publica = data.get('URLPublica')
        if not url_publica:
            return Response({'error': 'Se requiere "URLPublica".'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            db_response = ArchivoService.crear_archivo(url_publica) # Crear registro 1 en BD
            if db_response and db_response.get('IdArchivo'):
                return Response(db_response, status=status.HTTP_201_CREATED)
            else:
                return Response({'error': 'No se pudo crear el registro del archivo.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'Error interno del servidor: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class ArchivoDetailView(APIView):
    def get(self, request, id_archivo):
        archivo = ArchivoService.obtener_archivo_por_id(id_archivo)
        if archivo:
            return Response(archivo, status=status.HTTP_200_OK)
        return Response({'error': 'Archivo no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        

# =============================================
# VISTAS PARA ENVIOS
# (Tu código existente - sin cambios)
# =============================================
class EnvioCreateView(APIView):
    def post(self, request):
        data = request.data
        nuevo_id = EnvioService.crear_envio(
            id_contacto=data.get('IdContacto'),
            id_archivo=data.get('IdArchivo'),
            estado_envio=data.get('EstadoEnvio'),
            twilio_sid=data.get('TwilioSID')
        )
        if nuevo_id:
            return Response({'id_envio': nuevo_id}, status=status.HTTP_201_CREATED)
        return Response({'error': 'No se pudo crear el registro de envío'}, status=status.HTTP_400_BAD_REQUEST)

class HistorialEnviosView(APIView):
    # ... (tu código existente) ...
    def get(self, request, id_contacto):
        historial = EnvioService.obtener_envios_por_contacto(id_contacto)
        return Response(historial, status=status.HTTP_200_OK)
    

# =============================================
# VISTA PRINCIPAL PARA ENVIAR INFORMES 
# =============================================
class EnviarInformeView(APIView):
    """
    Vista para iniciar el proceso de envío de un informe.
    Recibe la URL del PDF desde el frontend.
    Endpoint: /api/enviar-informe/
    """
    def post(self, request):
        data = request.data
        id_contacto = data.get('id_contacto')
        pdf_url = data.get('pdf_url') # Ya no necesitamos 'nombre_archivo'

        # --- CORRECCIÓN 1: Actualizar la validación ---
        # Ahora solo requerimos id_contacto y pdf_url
        if not all([id_contacto, pdf_url]):
            return Response(
                {'error': 'Se requiere "id_contacto" y "pdf_url".'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            informe_service = InformeService()
            
            # --- CORRECCIÓN 2: Llamar al servicio solo con los 2 argumentos ---
            resultado = informe_service.enviar_informe(id_contacto, pdf_url)

            if resultado.get('status') == 'success':
                return Response(resultado, status=status.HTTP_200_OK)
            else:
                return Response(resultado, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'status': 'error', 'message': f'Error interno del servidor: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
# =============================================
# VISTA PARA ENVIAR MENSAJES DE TEXTO
# (Tu código existente - sin cambios)
# =============================================
class EnviarMensajeTextView(APIView):
    """
    Vista para enviar un mensaje de texto simple a un contacto.
    Endpoint: /api/enviar-mensaje-texto/
    """
    def post(self, request):
        data = request.data

        # --- AÑADE ESTAS LÍNEAS PARA CAPTURAR LOS DATOS ---
        print("=============================================")
        print("DATOS RECIBIDOS EN EnviarMensajeTextView:")
        print(f"Data (JSON completo): {data}")
        
        id_contacto = data.get('id_contacto')
        mensaje = data.get('mensaje')

        print(f"ID Contacto extraído: {id_contacto}")
        print(f"Mensaje extraído: {mensaje}")
        print("=============================================")
        # --- FIN DEL BLOQUE DE CAPTURA ---

        if not all([id_contacto, mensaje]):
            return Response(
                {'error': 'Se requiere "id_contacto" y "mensaje".'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            informe_service = InformeService()
            resultado = informe_service.enviar_mensaje_texto(id_contacto, mensaje)

            if resultado.get('status') == 'success':
                return Response(resultado, status=status.HTTP_200_OK)
            else:
                return Response(resultado, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'status': 'error', 'message': f'Error interno del servidor: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
# =============================================
# VISTAS DE GOOGLE DRIVE (OAUTH)
# =============================================
class UploadToDriveAPIView(APIView):
    def post(self, request, *args, **kwargs):
        """
        Intenta subir el archivo. Si no hay autorización, le dice al frontend que la inicie.
        """
        try:
            pdf_base64 = request.data.get('pdf_data')
            temp_file_name = request.data.get('file_name') 
            id_contacto = request.data.get('id_contacto') # <-- Recibimos el ID
            pdf_binary_data = base64.b64decode(pdf_base64)

            # 1. Subir a Drive
            drive_response = DriveService.upload_pdf(pdf_binary_data, temp_file_name)
            
            # --- CORRECCIÓN 3: Extraer la URL del diccionario ---
            file_id = drive_response.get('file_id')
            web_view_link = drive_response.get('webViewLink')

            if not file_id or not web_view_link:
                raise Exception("La subida a Drive no devolvió la información necesaria.")
            
            # 2. Registrar en la base de datos
            db_response = ArchivoService.crear_archivo(web_view_link)
            final_name = db_response.get('Nombre')
            id_archivo = db_response.get('IdArchivo')

            if not final_name or not id_archivo:
                raise Exception("El registro en la base de datos no devolvió el nombre final o el ID.")

            # 3. Renombrar el archivo en Google Drive
            DriveService.rename_file(file_id, final_name) 
            
            # 4. Enviar mensaje de WhatsApp (Ahora se hace aquí)
            if id_contacto:
                informe_service = InformeService()
                informe_service.enviar_informe(id_contacto, web_view_link)
            
            # 5. Devolver la URL original al frontend
            return Response({"drive_url": web_view_link}, status=status.HTTP_201_CREATED)

        except Exception as e:
            if "Authorization required" in str(e):
                return Response(
                    {"error": "Authorization required"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            return Response(
                {"error": f"Ocurrió un error en el servidor: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
class AuthorizeView(APIView):
    # ... (tu código existente) ...
    def get(self, request, *args, **kwargs):
        auth_url = DriveService.get_authorization_url()
        return redirect(auth_url) 

class OAuth2CallbackView(APIView):
    # ... (tu código existente) ...
    def get(self, request, *args, **kwargs):
        code = request.query_params.get('code')
        if code:
            DriveService.exchange_code_for_token(code)
            return Response({"message": "¡Autorización completada! Ya puedes cerrar esta ventana."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "No se recibió el código de autorización."}, status=status.HTTP_400_BAD_REQUEST)

# =============================================
# VISTAS PARA GESTIÓN DE USUARIOS (NUEVO)
# =============================================

class UserViewSet(viewsets.ModelViewSet):
    """
    Un ViewSet completo para el CRUD de Usuarios.
    """
    queryset = Usuario.objects.all().order_by('id')
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action == 'create' or self.action == 'destroy':
            permission_classes = [permissions.IsAdminUser]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsAdminOrSelf]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_destroy(self, instance):
        instance.estadoActividad = False
        instance.is_active = False 
        instance.save()
        print(f"Usuario {instance.username} desactivado lógicamente.")

class UserStatusUpdateView(APIView):
    """
    Un endpoint especial para que un usuario pueda cambiar el estado de otro.
    """
    permission_classes = [permissions.IsAuthenticated] 

    def patch(self, request, *args, **kwargs):
        try:
            user_to_update = Usuario.objects.get(id=kwargs.get('pk'))
        except Usuario.DoesNotExist:
            return Response({"error": "Usuario no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        if user_to_update == request.user:
            return Response({"error": "No puedes modificar tu propio estado."}, status=status.HTTP_403_FORBIDDEN)

        serializer = UserStatusSerializer(user_to_update, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(APIView):
    """
    Un endpoint para que el usuario obtenga sus *propios* datos
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
class MyTokenObtainPairView(TokenObtainPairView):
    """
    Reemplaza la vista de token por defecto para usar
    nuestro serializador personalizado (que añade el flag de recuperación).
    """
    serializer_class = MyTokenObtainPairSerializer
    
class ForgotPasswordView(APIView):
    """
    Maneja la solicitud de recuperación de contraseña.
    Requiere username, telefono y email.
    """
    # Esta vista debe ser pública (sin permisos)
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        telefono = request.data.get('telefono')
        email = request.data.get('email')

        if not all([username, telefono, email]):
            return Response(
                {"error": "Se requieren nombre de usuario, teléfono y correo electrónico."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # 1. Validar si el usuario existe con esos 3 datos
            # Usamos un objeto Usuario temporal solo para pasar el teléfono al InformeService
            usuario_validado = UsuarioService.validar_usuario_para_recuperacion(username, telefono, email)
            
            # 2. Lógica de seguridad:
            # Si el usuario es válido, procedemos.
            # Si es None (no encontrado), NO hacemos nada, pero devolvemos 200 OK.
            if usuario_validado:
                
                # 3. Generar contraseña temporal
                # Genera una contraseña aleatoria de 8 caracteres (mayúsculas y números)
                caracteres = string.ascii_uppercase + string.digits
                temp_password = ''.join(random.choice(caracteres) for _ in range(8))

                # 4. Guardar la contraseña en la BD y activar el flag de recuperación
                UsuarioService.establecer_password_temporal(username, temp_password)
                
                # 5. Enviar la contraseña por WhatsApp
                # Creamos un objeto simple (dummy) con los datos del usuario para el servicio de envío
                class TempUsuario:
                    pass
                
                usuario_obj = TempUsuario()
                usuario_obj.telefono = usuario_validado.get('telefono')
                usuario_obj.first_name = usuario_validado.get('first_name', username)
                usuario_obj.username = username
                
                informe_service = InformeService()
                envio_resultado = informe_service.enviar_password_temporal_a_usuario(
                    usuario_obj, 
                    temp_password
                )

                if envio_resultado.get('status') == 'error':
                    # Si falla el envío por WhatsApp, lo reportamos (esto es opcional)
                    # En un escenario de alta seguridad, también devolveríamos 200 OK aquí.
                    print(f"Error de Twilio al recuperar password: {envio_resultado.get('message')}")
                    # Aún así, devolvemos un mensaje genérico al usuario
            
            # 6. Devolver siempre una respuesta genérica por seguridad
            return Response(
                {"message": "Solicitud procesada. Si sus datos son correctos, recibirá un mensaje en breve."}, 
                status=status.HTTP_200_OK
            )

        except Exception as e:
            # Captura cualquier error inesperado (ej. BD caída)
            print(f"Error en ForgotPasswordView: {str(e)}")
            return Response(
                {"error": "Ocurrió un error inesperado."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
class ChangePasswordView(APIView):
    """
    Permite a un usuario ya logueado (con token) cambiar su contraseña.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # Pasamos 'context={'request': request}' para que el serializador
        # pueda acceder al 'request.user'
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            # El método .save() del serializador se encarga de:
            # 1. Validar la contraseña antigua
            # 2. Guardar la nueva contraseña encriptada
            # 3. Llamar al SP para poner estadoRecuperacion = 0
            serializer.save()
            return Response({"message": "Contraseña actualizada exitosamente."}, status=status.HTTP_200_OK)
        
        # Si la validación falla (ej. contraseña antigua incorrecta),
        # devuelve los errores.
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST) 