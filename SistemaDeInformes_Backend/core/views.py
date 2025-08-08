# core/views.py

# --- CORRECCIÓN CLAVE: Usar el redirect de Django, no el de Flask ---
from django.shortcuts import redirect 
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services import ArchivoService, ContactoService, EnvioService, InformeService
import base64
from .drive_service import DriveService

# =============================================
# VISTAS PARA CONTACTOS (Tu código original, sin cambios)
# =============================================
class ContactoListCreateView(APIView):
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
                if contacto: contactos = [contacto]
            elif correo:
                contacto = ContactoService.buscar_por_correo(correo)
                if contacto: contactos = [contacto]
            elif estado == 'todos':
                contactos = ContactoService.obtener_todos_contactos()
            elif estado == 'inactivos':
                contactos = ContactoService.obtener_contactos_inactivos()
            elif estado == 'gerenciales':
                contactos = ContactoService.obtener_contactos_gerenciales()
            else:
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

# ... (El resto de tus vistas para Archivos, Envios, etc., van aquí sin cambios) ...
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
        nuevo_id = ArchivoService.crear_archivo(
            nombre=data.get('Nombre'),
            url_publica=data.get('URLPublica')
        )
        if nuevo_id:
            return Response({'id_archivo': nuevo_id}, status=status.HTTP_201_CREATED)
        return Response({'error': 'No se pudo crear el registro del archivo'}, status=status.HTTP_400_BAD_REQUEST)

class ArchivoDetailView(APIView):
    def get(self, request, id_archivo):
        archivo = ArchivoService.obtener_archivo_por_id(id_archivo)
        if archivo:
            return Response(archivo, status=status.HTTP_200_OK)
        return Response({'error': 'Archivo no encontrado'}, status=status.HTTP_404_NOT_FOUND)

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
    def get(self, request, id_contacto):
        historial = EnvioService.obtener_envios_por_contacto(id_contacto)
        return Response(historial, status=status.HTTP_200_OK)

class EnviarInformeView(APIView):
    def post(self, request):
        data = request.data
        id_contacto = data.get('id_contacto')
        nombre_archivo = data.get('nombre_archivo')
        pdf_url = data.get('pdf_url')
        if not all([id_contacto, nombre_archivo, pdf_url]):
            return Response(
                {'error': 'Se requiere "id_contacto", "nombre_archivo" y "pdf_url".'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            informe_service = InformeService()
            resultado = informe_service.enviar_informe(id_contacto, nombre_archivo, pdf_url)
            if resultado.get('status') == 'success':
                return Response(resultado, status=status.HTTP_200_OK)
            else:
                return Response(resultado, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'status': 'error', 'message': f'Error interno del servidor: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EnviarMensajeTextView(APIView):
    def post(self, request):
        data = request.data
        id_contacto = data.get('id_contacto')
        mensaje = data.get('mensaje')
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


# --- VISTA DE SUBIDA MODIFICADA PARA EL NUEVO FLUJO ---
class UploadToDriveAPIView(APIView):
    def post(self, request, *args, **kwargs):
        try:
            pdf_base64 = request.data.get('pdf_data')
            temp_file_name = request.data.get('file_name') 
            pdf_binary_data = base64.b64decode(pdf_base64)

            # 1. Subir a Drive con nombre temporal para obtener ID y URL
            drive_response = DriveService.upload_pdf(pdf_binary_data, temp_file_name)
            file_id = drive_response.get('file_id')
            web_view_link = drive_response.get('webViewLink')

            if not file_id or not web_view_link:
                raise Exception("La subida a Drive no devolvió la información necesaria.")
            
            
            # 2. Registrar en la base de datos usando la URL
            db_response = ArchivoService.crear_archivo(web_view_link)
            final_name = db_response.get('Nombre')

            if not final_name:
                raise Exception("El registro en la base de datos no devolvió el nombre final.")

            # 3. Renombrar el archivo en Google Drive con el nombre final
            DriveService.rename_file(file_id, final_name)
            
            # 4. Devolver la URL original al frontend
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
            
# --- VISTAS DE AUTORIZACIÓN (Sin cambios) ---
class AuthorizeView(APIView):
    def get(self, request, *args, **kwargs):
        auth_url = DriveService.get_authorization_url()
        return redirect(auth_url) 

class OAuth2CallbackView(APIView):
    def get(self, request, *args, **kwargs):
        code = request.query_params.get('code')
        if code:
            DriveService.exchange_code_for_token(code)
            return Response({"message": "¡Autorización completada! Ya puedes cerrar esta ventana."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "No se recibió el código de autorización."}, status=status.HTTP_400_BAD_REQUEST)

