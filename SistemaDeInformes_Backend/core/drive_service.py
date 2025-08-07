# core/drive_service.py
# NOTA: Este código es correcto, pero depende 100% de que los permisos 
# en Google Drive estén bien configurados como se describe en el checklist.

import os
import io
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
# --- NUEVA IMPORTACIÓN para manejar errores específicos de la API ---
from googleapiclient.errors import HttpError
from django.conf import settings

# --- CONFIGURACIÓN ---
SERVICE_ACCOUNT_FILE = os.path.join(settings.BASE_DIR, 'service_account.json')
SCOPES = ['https://www.googleapis.com/auth/drive']
DRIVE_FOLDER_ID = '1DPLZUu9Gg54o9sCuR7jF5EJGUBkZB_Sp' 

class DriveService:
    _service = None

    @staticmethod
    def _get_service():
        """Crea y reutiliza una instancia del servicio de la API de Google Drive."""
        if DriveService._service is None:
            try:
                creds = service_account.Credentials.from_service_account_file(
                    SERVICE_ACCOUNT_FILE, scopes=SCOPES)
                
                # Usamos el método de construcción simplificado que es más estable
                DriveService._service = build('drive', 'v3', credentials=creds, cache_discovery=False)

            except Exception as e:
                print(f"Error al inicializar el servicio de Google: {e}")
                raise
        return DriveService._service

    @staticmethod
    def upload_pdf(pdf_binary_data, file_name):
        """Sube un archivo PDF a la carpeta especificada en Google Drive."""
        try:
            service = DriveService._get_service()

            file_metadata = {
                'name': file_name,
                'parents': [DRIVE_FOLDER_ID]
            }
            media = MediaIoBaseUpload(io.BytesIO(pdf_binary_data),
                                      mimetype='application/pdf',
                                      resumable=True)

            # El parámetro 'supportsAllDrives=True' es crucial para que la cuenta
            # de servicio pueda escribir en carpetas que no le pertenecen.
            file = service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, webViewLink',
                supportsAllDrives=True
            ).execute()

            file_id = file.get('id')
            if not file_id:
                raise Exception("La API de Google no devolvió un ID de archivo.")

            # Hacemos el archivo público para que cualquiera con el enlace pueda verlo
            service.permissions().create(
                fileId=file_id, 
                body={'role': 'reader', 'type': 'anyone'},
                supportsAllDrives=True
            ).execute()

            print(f"Archivo subido exitosamente. URL: {file.get('webViewLink')}")
            return file.get('webViewLink')

        # --- MANEJO DE ERRORES MEJORADO ---
        # Capturamos específicamente los errores de la API de Google
        except HttpError as error:
            print(f"Ocurrió un error de la API de Google: {error}")
            # Devolvemos el contenido del error para que la vista lo pueda manejar
            raise Exception(f"Error de la API de Google: {error.content.decode('utf-8')}")
        except Exception as e:
            print(f"Ocurrió un error DETALLADO al subir a Google Drive: {e}")
            raise e

