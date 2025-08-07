# core/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services import ArchivoService, ContactoService, EnvioService, InformeService
import base64
from .drive_service import DriveService # Importamos nuestro nuevo servicio


# =============================================
# VISTAS PARA CONTACTOS
# =============================================
class ContactoListCreateView(APIView):
    """
    Vista para listar, buscar por nombre y crear contactos.
    Endpoint: /api/contactos/
    """
    def get(self, request):
        """
        Maneja las peticiones GET. Revisa los parámetros de consulta en la URL 
        para decidir qué lista de contactos devolver.
        """
        # Revisa los parámetros de consulta en la URL (ej. /api/contactos/?nombre=Ivan)
        nombre = request.query_params.get('nombre', None)
        telefono = request.query_params.get('telefono', None)
        correo = request.query_params.get('correo', None)
        # Por defecto, si no se especifica el estado, se devuelven los activos.
        estado = request.query_params.get('estado', 'activos') 

        contactos = []
        try:
            if nombre:
                contactos = ContactoService.buscar_por_nombre(nombre)
            elif telefono:
                # La búsqueda por teléfono devuelve un solo objeto, lo ponemos en una lista para ser consistentes.
                contacto = ContactoService.buscar_por_telefono(telefono)
                if contacto:
                    contactos = [contacto]
            elif correo:
                # La búsqueda por correo devuelve un solo objeto, lo ponemos en una lista.
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
        """
        Maneja la creación de un nuevo contacto, incluyendo la validación de duplicados
        y un manejo de errores robusto con depuración.
        """
        try:
            data = request.data
            resultado = ContactoService.crear_contacto(
                nombre=data.get('Nombre'),
                telefono=data.get('Telefono'),
                correo_electronico=data.get('CorreoElectronico')
            )

            # --- AÑADIDO PARA DEPURACIÓN ---
            # Esto imprimirá la respuesta del servicio en la terminal donde corre Django.
            print(f"DEBUG: Resultado del servicio = {resultado}")

            # Si el SP devuelve 'SUCCESS', respondemos con 201 Created
            if resultado and resultado.get('Status') == 'SUCCESS':
                return Response({'id_contacto': resultado.get('NewId')}, status=status.HTTP_201_CREATED)
            
            # Si el SP devuelve 'CONFLICT', respondemos con 409 Conflict y el mensaje de error
            elif resultado and resultado.get('Status') == 'CONFLICT':
                return Response({'error': resultado.get('Message')}, status=status.HTTP_409_CONFLICT)
                
            # Para cualquier otro caso, devolvemos una respuesta de error más detallada
            else:
                return Response({
                    'error': 'El servicio devolvió una respuesta inesperada.',
                    'detalle_del_servicio': resultado # <-- Esto nos mostrará qué contenía 'resultado'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            # Captura cualquier excepción no manejada y devuelve un error 500 con el detalle.
            return Response({'error': f"Ocurrió un error interno en el servidor: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            
class ContactoDetailView(APIView):
    """
    Vista para obtener, actualizar y eliminar (lógicamente) un contacto por su ID.
    Endpoint: /api/contactos/<int:id_contacto>/
    """
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
    """
    Vista para listar todos los archivos o buscar por nombre y CREAR nuevos archivos.
    Endpoint: /api/archivos/
    """
    def get(self, request):
        nombre = request.query_params.get('nombre', None)
        if nombre:
            archivos = ArchivoService.buscar_archivo_por_nombre(nombre)
        else:
            archivos = ArchivoService.obtener_todos_los_archivos()
        return Response(archivos, status=status.HTTP_200_OK)

    # --- CORRECCIÓN: Añadir el método POST ---
    def post(self, request):
        """
        Maneja la creación de un nuevo registro de archivo.
        """
        data = request.data
        nuevo_id = ArchivoService.crear_archivo(
            nombre=data.get('Nombre'),
            url_publica=data.get('URLPublica')
        )
        if nuevo_id:
            return Response({'id_archivo': nuevo_id}, status=status.HTTP_201_CREATED)
        return Response({'error': 'No se pudo crear el registro del archivo'}, status=status.HTTP_400_BAD_REQUEST)

class ArchivoDetailView(APIView):
    """
    Vista para obtener un archivo por su ID.
    Endpoint: /api/archivos/<int:id_archivo>/
    """
    def get(self, request, id_archivo):
        archivo = ArchivoService.obtener_archivo_por_id(id_archivo)
        if archivo:
            return Response(archivo, status=status.HTTP_200_OK)
        return Response({'error': 'Archivo no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    

# =============================================
# VISTAS PARA ENVIOS
# =============================================
class EnvioCreateView(APIView):
    """
    Vista para crear un nuevo registro de envío.
    Endpoint: /api/envios/
    """
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
    """
    Vista para obtener el historial de envíos de un contacto específico.
    Endpoint: /api/contactos/<int:id_contacto>/historial/
    """
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
                # Si el servicio devuelve un error controlado, lo mostramos
                return Response(resultado, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # Para cualquier error no esperado en el proceso
            return Response({'status': 'error', 'message': f'Error interno del servidor: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================
# VISTA PARA ENVIAR MENSAJES DE TEXTO
# =============================================
class EnviarMensajeTextView(APIView):
    """
    Vista para enviar un mensaje de texto simple a un contacto.
    Endpoint: /api/enviar-mensaje-texto/
    """
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


class UploadToDriveAPIView(APIView):
    def post(self, request, *args, **kwargs):
        """
        Recibe un PDF en Base64 desde el frontend, lo sube a Google Drive
        y devuelve la URL pública.
        """
        pdf_base64 = request.data.get('pdf_data')
        file_name = request.data.get('file_name')

        if not pdf_base64 or not file_name:
            return Response(
                {"error": "Faltan los datos 'pdf_data' o 'file_name'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Decodificamos el string Base64 para obtener los datos binarios del PDF
            pdf_binary_data = base64.b64decode(pdf_base64)

            # Llamamos a nuestro servicio para que haga el trabajo pesado
            drive_url = DriveService.upload_pdf(pdf_binary_data, file_name)

            if drive_url:
                # Si todo sale bien, devolvemos la URL al frontend
                return Response({"drive_url": drive_url}, status=status.HTTP_201_CREATED)
            else:
                return Response(
                    {"error": "No se pudo obtener la URL del archivo subido."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception as e:
            return Response(
                {"error": f"Ocurrió un error en el servidor: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


