# core/services.py
from multiprocessing.connection import Client
import os
from django.db import connection
from .models import Contacto, Archivo, Envio
from django.db import connection
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException


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
            # El SP ya no necesita el parámetro de nombre
            cursor.execute("EXEC sp_CrearArchivo @URLPublica=%s", [url_publica])
            # Usamos dictfetchone para leer la fila que devuelve el SP
            resultado = dictfetchone(cursor) 
            return resultado # Devuelve {'IdArchivo': 123, 'Nombre': '123_Reporte...'}

    @staticmethod
    def obtener_archivo_por_id(id_archivo):
        with connection.cursor() as cursor:
            cursor.execute("EXEC sp_ObtenerArchivoPorId @IdArchivo=%s", [id_archivo])
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
        
        
class InformeService:
    """
    Servicio para orquestar el envío de un informe cuya URL es proporcionada por el frontend.
    """
    def __init__(self):
        # Cargar credenciales de Twilio
        self.twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_sender_number = os.getenv("TWILIO_WHATSAPP_NUMBER")
        self.twilio_client = Client(self.twilio_account_sid, self.twilio_auth_token)

    def enviar_informe(self, id_contacto, nombre_archivo, pdf_url):
        """
        Orquesta el flujo de envío de un informe.
        """
        # 1. Obtener datos del contacto
        contacto = ContactoService.obtener_contacto_por_id(id_contacto)
        if not contacto:
            return {'status': 'error', 'message': 'Contacto no encontrado.'}

        try:
            # 2. Registrar el archivo en la BD
            id_archivo = ArchivoService.crear_archivo(nombre_archivo, pdf_url)
            if not id_archivo:
                raise Exception("Fallo al registrar el archivo en la base de datos.")

            # 3. Enviar mensaje por WhatsApp
            message = self.twilio_client.messages.create(
                from_=f"whatsapp:{self.twilio_sender_number}",
                to=f"whatsapp:{contacto['Telefono']}",
                body="Adjunto el informe solicitado.",
                media_url=[pdf_url]
            )
            twilio_sid = message.sid
            
            # 4. Registrar el envío exitoso en la BD
            EnvioService.crear_envio(id_contacto, id_archivo, 'Enviado', twilio_sid)
            
            return {'status': 'success', 'message': f'Informe enviado a {contacto["Nombre"]}.', 'sid': twilio_sid}

        except Exception as e:
            # 5. Si algo falla, registrar el envío fallido
            # (Asumimos que id_archivo ya se creó si el error ocurrió después)
            if 'id_archivo' in locals() and id_archivo:
                EnvioService.crear_envio(id_contacto, id_archivo, 'Fallido', None)
            return {'status': 'error', 'message': str(e)}
        
    def enviar_mensaje_texto(self, id_contacto, mensaje):
        """
        Orquesta el envío de un mensaje de texto simple.
        """
        # 1. Obtener datos del contacto
        contacto = ContactoService.obtener_contacto_por_id(id_contacto)
        if not contacto:
            return {'status': 'error', 'message': 'Contacto no encontrado.'}

        try:
            # 2. Enviar mensaje por WhatsApp
            message = self.twilio_client.messages.create(
                from_=f"whatsapp:{self.twilio_sender_number}",
                to=f"whatsapp:{contacto['Telefono']}",
                body=mensaje
            )
            twilio_sid = message.sid
            
            # Nota: Este envío simple no se registra en la tabla 'Envio' porque
            # no tiene un archivo asociado. Se podría añadir un registro de "dummy file"
            # o modificar la BD en el futuro si se necesita auditoría de textos.
            
            return {'status': 'success', 'message': f'Mensaje enviado a {contacto["Nombre"]}.', 'sid': twilio_sid}

        except TwilioRestException as e:
            return {'status': 'error', 'message': str(e)}

