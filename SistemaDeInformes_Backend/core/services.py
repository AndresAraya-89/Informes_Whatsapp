# core/services.py
from multiprocessing.connection import Client
import os
from django.db import connection
from .models import Contacto, Archivo, Envio
from django.db import connection
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from rest_framework import serializers
from .models import Usuario
from django.contrib.auth.hashers import make_password

# Django no mapea automáticamente los resultados de SQL crudo a objetos,
# así que creamos una función de ayuda para hacerlo.
def dictfetchall(cursor):
    "Return all rows from a cursor as a dict"
    columns = [col[0] for col in cursor.description]
    return [
        dict(zip(columns, row))
        for row in cursor.fetchall()
    ]

def dictfetchone(cursor):
    columns = [col[0] for col in cursor.description]
    row = cursor.fetchone()
    return dict(zip(columns, row)) if row else None

class ContactoService:
    """
    Esta clase contiene toda la lógica para interactuar con los
    procedimientos almacenados de la tabla Contacto.
    """

    @staticmethod
    def crear_contacto(nombre, telefono, correo_electronico=None):
        """
        Llama a un único SP que valida y crea el contacto de forma atómica.
        Devuelve un diccionario con el resultado de la operación.
        """
        with connection.cursor() as cursor:
            cursor.execute("EXEC sp_CrearContacto_ConValidacion @Nombre=%s, @Telefono=%s, @CorreoElectronico=%s", 
                           [nombre, telefono, correo_electronico])
            # El SP ahora devuelve un diccionario completo con el estado
            resultado = dictfetchone(cursor)
            return resultado

    @staticmethod
    def actualizar_contacto(id_contacto, nombre, telefono, correo_electronico, estado):
        """
        Llama al procedimiento almacenado sp_ActualizarContacto.
        """
        with connection.cursor() as cursor:
            cursor.execute("EXEC sp_ActualizarContacto @IdContacto=%s, @Nombre=%s, @Telefono=%s, @CorreoElectronico=%s, @Estado=%s", 
                           [id_contacto, nombre, telefono, correo_electronico, estado])

    @staticmethod
    def eliminar_contacto(id_contacto):
        """
        Llama al procedimiento almacenado sp_EliminarContacto (eliminación lógica).
        """
        with connection.cursor() as cursor:
            cursor.execute("EXEC sp_EliminarContacto @IdContacto=%s", [id_contacto])

    @staticmethod
    def obtener_contacto_por_id(id_contacto):
        """
        Llama al procedimiento almacenado sp_ObtenerContactoPorId.
        """
        with connection.cursor() as cursor:
            # --- CORRECCIÓN: Se cambió @IdContacto por @Id ---
            cursor.execute("EXEC sp_ObtenerContactoPorId @Id=%s", [id_contacto])
            return dictfetchone(cursor)

    # --- NUEVOS MÉTODOS DE BÚSQUEDA ---
    @staticmethod
    def buscar_por_nombre(nombre):
        with connection.cursor() as cursor:
            cursor.execute("EXEC sp_BuscarContactoPorNombre @Nombre=%s", [nombre])
            return dictfetchall(cursor)

    @staticmethod
    def buscar_por_telefono(telefono):
        with connection.cursor() as cursor:
            cursor.execute("EXEC sp_BuscarContactoPorTelefono @Telefono=%s", [telefono])
            return dictfetchone(cursor) # Devuelve uno solo o ninguno

    @staticmethod
    def buscar_por_correo(correo):
        with connection.cursor() as cursor:
            cursor.execute("EXEC sp_BuscarContactoPorCorreo @CorreoElectronico=%s", [correo])
            return dictfetchone(cursor) # Devuelve uno solo o ninguno

    @staticmethod
    def obtener_contactos_activos():
        with connection.cursor() as cursor:
            cursor.execute("EXEC sp_ObtenerContactosActivos")
            return dictfetchall(cursor)

    @staticmethod
    def obtener_todos_contactos():
        with connection.cursor() as cursor:
            cursor.execute("EXEC sp_ObtenerContactosActivosInactivos")
            return dictfetchall(cursor)

    @staticmethod
    def obtener_contactos_inactivos():
        with connection.cursor() as cursor:
            cursor.execute("EXEC sp_ObtenerContactosInactivos")
            return dictfetchall(cursor)
        
    @staticmethod
    def obtener_contactos_gerenciales():
        with connection.cursor() as cursor:
            cursor.execute("EXEC sp_ObtenerContactosGerenciales")
            return dictfetchall(cursor)
    
    
    def obtener_telefono_por_id(id_contacto):
        """
        Llama al SP para obtener solo el número de teléfono de un contacto por su ID.
        """
        with connection.cursor() as cursor:
            cursor.execute("EXEC sp_ObtenerTelefonoDeContactoPorId @Id=%s", [id_contacto])
            row = cursor.fetchone()
            return row[0] if row else None
    
    

class ArchivoService:
    """
    Servicios para interactuar con los procedimientos almacenados de la tabla Archivo.
    """
    @staticmethod
    def crear_archivo(url_publica):
        """
        Llama al SP mejorado para crear el registro y obtener el nombre final.
        Devuelve un diccionario con el nuevo ID y el nombre generado.
        """
        with connection.cursor() as cursor:
            cursor.execute("EXEC sp_CrearArchivo @URLPublica=%s", [url_publica])
            
            # --- ESTA ES LA CORRECCIÓN ---
            # Usamos dictfetchone para leer la fila que devuelve el SP como un diccionario
            resultado = dictfetchone(cursor) 
            
            return resultado # Devuelve {'IdArchivo': 123, 'Nombre': '123_Reporte...'}

    @staticmethod
    def obtener_archivo_por_id(id_archivo):
        with connection.cursor() as cursor:
            cursor.execute("EXEC sp_ObtenerArchivoPorId @IdArchivo=%s", [id_archivo])
            return dictfetchone(cursor)
        
    @staticmethod
    def obtener_archivo_por_url(url_publica):
        with connection.cursor() as cursor:
            cursor.execute("EXEC sp_ObtenerArchivoPorURL @urlPublica=%s", [url_publica])
            return dictfetchone(cursor)

    @staticmethod
    def obtener_todos_los_archivos():
        with connection.cursor() as cursor:
            cursor.execute("EXEC sp_ObtenerTodosLosArchivos")
            return dictfetchall(cursor)

    @staticmethod
    def buscar_archivo_por_nombre(nombre):
        with connection.cursor() as cursor:
            cursor.execute("EXEC sp_BuscarArchivoPorNombre @Nombre=%s", [nombre])
            return dictfetchall(cursor)
        
    
        
class EnvioService:
    """
    Servicios para interactuar con los procedimientos almacenados de la tabla Envio.
    """
    @staticmethod
    def crear_envio(id_contacto, id_archivo, estado_envio, twilio_sid=None):
        """
        Llama al procedimiento almacenado sp_CrearEnvio.
        """
        with connection.cursor() as cursor:
            cursor.execute("EXEC sp_CrearEnvio @IdContacto=%s, @IdArchivo=%s, @EstadoEnvio=%s, @TwilioSID=%s",
                           [id_contacto, id_archivo, estado_envio, twilio_sid])
            row = cursor.fetchone()
            return row[0] if row else None

    @staticmethod
    def obtener_envios_por_contacto(id_contacto):
        """
        Llama al procedimiento almacenado sp_ObtenerEnviosPorContacto.
        """
        with connection.cursor() as cursor:
            cursor.execute("EXEC sp_ObtenerEnviosPorContacto @IdContacto=%s", [id_contacto])
            return dictfetchall(cursor)
        
# --- SERVICIO DE INFORMES (Actualizado) ---
class InformeService:
    """
    Servicio para orquestar el envío de informes y mensajes.
    """
    def __init__(self):
        self.twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_sender_number = os.getenv("TWILIO_WHATSAPP_NUMBER")
        self.twilio_client = Client(self.twilio_account_sid, self.twilio_auth_token)

    def _convert_drive_url_to_direct_download(self, url):
        try:
            file_id = url.split('/d/')[1].split('/')[0]
            return f"https://drive.google.com/uc?export=download&id={file_id}"
        except IndexError:
            return None

    # Se eliminó el parámetro 'nombre_archivo' que ya no se usa.
    def enviar_informe(self, id_contacto, pdf_url):
        """
        Orquesta el flujo de envío de un informe a un CONTACTO (cliente).
        """
        telefono_contacto = ContactoService.obtener_telefono_por_id(id_contacto)
        if not telefono_contacto:
            return {'status': 'error', 'message': 'Contacto no encontrado o sin número de teléfono.'}

        direct_download_url = self._convert_drive_url_to_direct_download(pdf_url)
        if not direct_download_url:
            return {'status': 'error', 'message': 'La URL de Google Drive proporcionada no es válida.'}

        try:
            # Registramos el archivo en la BD
            db_response = ArchivoService.obtener_archivo_por_url(url_publica=pdf_url)
            
            # 2. Si no existe (es None), lo CREAMOS
            if not db_response:
                db_response = ArchivoService.crear_archivo(url_publica=pdf_url)
                
            id_archivo = db_response.get('IdArchivo') if db_response else None
            
            if not id_archivo:
                # Si ambos casos (obtener y crear) fallaron, se lanza la excepción
                raise Exception("Fallo al obtener o registrar el archivo en la base de datos.")
            
            message = self.twilio_client.messages.create(
                from_=f"whatsapp:{self.twilio_sender_number}",
                to=f"whatsapp:{telefono_contacto}",
                body="Adjunto el informe solicitado.",
                media_url=[direct_download_url]
            )
            twilio_sid = message.sid
            
            EnvioService.crear_envio(id_contacto, id_archivo, 'Enviado', twilio_sid)
            
            return {'status': 'success', 'message': f'Informe enviado al contacto con ID {id_contacto}.', 'sid': twilio_sid}

        except Exception as e:
            if 'id_archivo' in locals() and id_archivo:
                EnvioService.crear_envio(id_contacto, id_archivo, 'Fallido', None)
            return {'status': 'error', 'message': str(e)}
        
    def enviar_mensaje_texto(self, id_contacto, mensaje):
        telefono_contacto = ContactoService.obtener_telefono_por_id(id_contacto)
        if not telefono_contacto:
            return {'status': 'error', 'message': 'Contacto no encontrado o sin número de teléfono.'}

        try:
            message = self.twilio_client.messages.create(
                from_=f"whatsapp:{self.twilio_sender_number}",
                to=f"whatsapp:{telefono_contacto}",
                body=mensaje
            )
            twilio_sid = message.sid
            
            return {'status': 'success', 'message': f'Mensaje enviado al contacto con ID {id_contacto}.', 'sid': twilio_sid}

        except TwilioRestException as e:
            return {'status': 'error', 'message': str(e)}

    def enviar_password_temporal_a_usuario(self, usuario, temp_password):
        telefono_usuario = usuario.telefono 
        if not telefono_usuario:
            return {'status': 'error', 'message': 'El usuario no tiene un número de teléfono registrado.'}

        try:
            mensaje_body = f"Hola {usuario.first_name}, su nueva contraseña temporal para SIRYM es: {temp_password}\n\nSe le pedirá cambiarla al iniciar sesión."
            message = self.twilio_client.messages.create(
                from_=f"whatsapp:{self.twilio_sender_number}",
                to=f"whatsapp:{telefono_usuario}", 
                body=mensaje_body
            )
            return {'status': 'success', 'message': f'Contraseña temporal enviada a {usuario.username}.'}
        except TwilioRestException as e:
            return {'status': 'error', 'message': f"Error de Twilio: {str(e)}"}
  
class UserSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo de Usuario.
    Maneja la lógica de creación y actualización de usuarios,
    incluyendo el hash seguro de las contraseñas.
    """
    
    # Hacemos que el password sea de solo escritura (write_only)
    # y opcional (required=False) para que no sea necesario al actualizar el perfil.
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})

    class Meta:
        model = Usuario
        # Definimos los campos que la API expondrá
        fields = (
            'id', 
            'username', 
            'password', 
            'first_name', 
            'last_name', 
            'email', 
            'telefono', 
            'estadoActividad', 
            'estadoRecuperacion',
            'is_staff' # 'is_staff' es el campo de Django para permisos de "admin"
        )
        # Hacemos que estos campos solo se puedan leer en la API, no editar (excepto por el admin)
        read_only_fields = ('estadoActividad', 'estadoRecuperacion', 'is_staff')

    def create(self, validated_data):
        """
        Sobrescribe el método 'create' para usar el helper de Django
        que encripta (hashea) la contraseña correctamente.
        """
        user = Usuario.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            telefono=validated_data.get('telefono', '')
        )
        return user

    def update(self, instance, validated_data):
        """
        Sobrescribe el método 'update' para manejar la actualización
        de la contraseña de forma segura si se proporciona.
        """
        # Actualiza todos los campos excepto la contraseña
        instance = super().update(instance, validated_data)

        # Revisa si se incluyó una nueva contraseña en la petición
        password = validated_data.get('password')
        if password:
            instance.set_password(password) # set_password se encarga de encriptarla
            instance.save()
            
        return instance

class UserStatusSerializer(serializers.ModelSerializer):
    """
    Un serializador más simple, usado por usuarios normales
    para actualizar el estado de otros usuarios.
    """
    class Meta:
        model = Usuario
        fields = ('estadoActividad',) # Solo permite modificar este campo
        
class UsuarioService:
    """
    Servicios para manejar la lógica de negocio de los
    Usuarios del sistema (colaboradores).
    """

    @staticmethod
    def obtener_usuario_por_username(username):
        """
        Busca un usuario (colaborador) por su 'username'.
        """
        try:
            # Usamos el ORM de Django para una búsqueda segura
            return Usuario.objects.get(username=username)
        except Usuario.DoesNotExist:
            return None

    @staticmethod
    def establecer_password_temporal(username, nuevo_password):
        """
        Llama al SP para actualizar el password y el flag de recuperación.
        """
        # Encriptamos la contraseña temporal antes de guardarla
        password_encriptado = make_password(nuevo_password)
        with connection.cursor() as cursor:
            cursor.execute("EXEC sp_EstablecerPasswordTemporal @Username=%s, @NuevoPasswordEncriptado=%s", 
                           [username, password_encriptado])
            row = cursor.fetchone()
            # Devuelve el número de filas afectadas (debería ser 1)
            return row[0] if row else 0    
        
    @staticmethod
    def validar_usuario_para_recuperacion(username, telefono, email):
        """
        Valida si existe un usuario activo con los 3 datos.
        Llama al SP sp_ValidarUsuarioParaRecuperacion.
        """
        # Formateamos el teléfono para que coincida con la BD (con "506")
        telefono_formateado = f"506{telefono}"
        
        with connection.cursor() as cursor:
            cursor.execute("EXEC sp_ValidarUsuarioParaRecuperacion @Username=%s, @Telefono=%s, @CorreoElectronico=%s",
                           [username, telefono_formateado, email])
            # Devuelve el diccionario del usuario si se encontró, o None si no.
            return dictfetchone(cursor)