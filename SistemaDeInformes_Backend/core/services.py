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
            resultado = dictfetchone(cursor) 
            return resultado 

    

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
        
    
    def obtener_id_archivo_por_url(url_archivo):
        with connection.cursor() as cursor:
            cursor.execute("EXEC sp_BuscarIdAchivoConURL @URL_archivo=%s", [url_archivo])
            resultado_dict = dictfetchone(cursor)
            if resultado_dict:
                return resultado_dict.get('IdArchivo')
            return None
        
        
        



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
        
        
# En tu archivo core/services.py

class InformeService:
    """
    Servicio para orquestar el envío de informes y mensajes.
    """
    def __init__(self):
        # Cargar credenciales de Twilio
        self.twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_sender_number = os.getenv("TWILIO_WHATSAPP_NUMBER")
        self.twilio_client = Client(self.twilio_account_sid, self.twilio_auth_token)

    def _convert_drive_url_to_direct_download(self, url):
        """
        Convierte una URL de vista de Google Drive a una URL de descarga directa.
        Ej: .../view -> .../uc?export=download&id=...
        """
        try:
            # Extraemos el ID del archivo de la URL
            file_id = url.split('/d/')[1].split('/')[0]
            return f"https://drive.google.com/uc?export=download&id={file_id}"
        except IndexError:
            # Si la URL no tiene el formato esperado, devolvemos None
            return None
    


    def enviar_informe(self, id_contacto, pdf_url):
        """
        Orquesta el flujo de envío de un informe.
        """
        telefono_contacto = ContactoService.obtener_telefono_por_id(id_contacto)
        if not telefono_contacto:
            return {'status': 'error', 'message': 'Contacto no encontrado o sin número de teléfono.'}

        # --- CAMBIO CLAVE: Transformar la URL ---
        direct_download_url = self._convert_drive_url_to_direct_download(pdf_url)
        if not direct_download_url:
            return {'status': 'error', 'message': 'La URL de Google Drive proporcionada no es válida.'}

        try:
            id_archivo = ArchivoService.obtener_id_archivo_por_url(pdf_url)
        
            # Enviar mensaje por WhatsApp usando la URL de descarga directa
            message = self.twilio_client.messages.create(
                from_=f"whatsapp:{self.twilio_sender_number}",
                to=f"whatsapp:{telefono_contacto}",
                body="Adjunto reporte de insicente.",
                media_url=[direct_download_url] # <-- Usamos la URL transformada
            )
            twilio_sid = message.sid
                
                   
            print ('Id Contacto:' + str(id_contacto))
            print ('Id Archivo:' + str(id_archivo))
            print ('Twilio SID:' + twilio_sid)
            
            EnvioService.crear_envio(id_contacto, id_archivo, 'Enviado', twilio_sid)
            return {'status': 'success', 'message': f'Informe enviado al contacto con ID {id_contacto}.', 'sid': twilio_sid}


        except Exception as e:
            if 'id_archivo' in locals() and id_archivo:
                EnvioService.crear_envio(id_contacto, id_archivo, 'Fallido', None)
            return {'status': 'error', 'message': str(e)}
        
    ''''
    def enviar_respaldo_rol_gerencial(self, direct_download_url):
        try:
        lista_contactos = ContactoService.obtener_contactos_gerenciales()
        
        for contacto in lista_contactos:
            telefono_contacto = ContactoService.obtener_telefono_por_id(contacto['IdContacto'])
            if not telefono_contacto:
                continue
            
            message = self.twilio_client.messages.create(
                from_=f"whatsapp:{self.twilio_sender_number}",
                to=f"whatsapp:{telefono_contacto}",
                body="Adjunto reporte de insicente.",
                media_url=[direct_download_url] # <-- Usamos la URL transformada
            )
            twilio_sid = message.sid
            
        except Exception as e:
            return {'status': 'error', 'message': str(e)}  
        '''
         
        
    def enviar_mensaje_texto(self, id_contacto, mensaje):
        """
        Orquesta el envío de un mensaje de texto simple.
        """
        # --- CAMBIO 4: Obtener solo el teléfono, de forma más eficiente ---
        telefono_contacto = ContactoService.obtener_telefono_por_id(id_contacto)
        if not telefono_contacto:
            return {'status': 'error', 'message': 'Contacto no encontrado o sin número de teléfono.'}

        try:
            # 2. Enviar mensaje por WhatsApp
            message = self.twilio_client.messages.create(
                from_=f"whatsapp:{self.twilio_sender_number}",
                # --- CAMBIO 5: Usar la variable 'telefono_contacto' ---
                to=f"whatsapp:{telefono_contacto}",
                body=mensaje
            )
            twilio_sid = message.sid
            
            # --- CAMBIO 6: Mensaje de éxito actualizado ---
            return {'status': 'success', 'message': f'Mensaje enviado al contacto con ID {id_contacto}.', 'sid': twilio_sid}

        except TwilioRestException as e:
            return {'status': 'error', 'message': str(e)}

