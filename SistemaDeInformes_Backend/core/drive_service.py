# core/drive_service.py
# VERSIÓN FINAL Y CORRECTA PARA AUTENTICACIÓN PERSONAL (OAUTH 2.0)

import os
import io
import pickle
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request as GoogleAuthRequest
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from googleapiclient.errors import HttpError
from django.conf import settings

# --- CONFIGURACIÓN PARA AUTENTICACIÓN PERSONAL ---
CLIENT_SECRET_FILE = os.path.join(settings.BASE_DIR, 'client_secret.json')
TOKEN_FILE = os.path.join(settings.BASE_DIR, 'token.pickle')
SCOPES = ['https://www.googleapis.com/auth/drive']
DRIVE_FOLDER_ID = '1DPLZUu9Gg54o9sCuR7jF5EJGUBkZB_Sp' 

class DriveService:

    @staticmethod
    def get_authorization_url():
        """Genera la URL para que el usuario dé permiso."""
        flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET_FILE, SCOPES)
        flow.redirect_uri = 'http://127.0.0.1:8000/api/oauth2callback'
        auth_url, _ = flow.authorization_url(access_type='offline', prompt='consent')
        return auth_url

    @staticmethod
    def exchange_code_for_token(code):
        """Intercambia el código de autorización por credenciales y las guarda."""
        flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET_FILE, SCOPES)
        flow.redirect_uri = 'http://127.0.0.1:8000/api/oauth2callback'
        flow.fetch_token(code=code)
        creds = flow.credentials
        with open(TOKEN_FILE, 'wb') as token:
            pickle.dump(creds, token)
        return True

    @staticmethod
    def _get_credentials():
        """Carga las credenciales guardadas. Si no existen o son inválidas, devuelve None."""
        creds = None
        if os.path.exists(TOKEN_FILE):
            with open(TOKEN_FILE, 'rb') as token:
                creds = pickle.load(token)
        
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(GoogleAuthRequest())
            with open(TOKEN_FILE, 'wb') as token:
                pickle.dump(creds, token)
        
        return creds

    @staticmethod
    def upload_pdf(pdf_binary_data, file_name):
        """Sube un archivo PDF usando las credenciales guardadas."""
        creds = DriveService._get_credentials()
        if not creds or not creds.valid:
            raise Exception("Authorization required")

        try:
            service = build('drive', 'v3', credentials=creds)
            
            file_metadata = {'name': file_name, 'parents': [DRIVE_FOLDER_ID]}
            media = MediaIoBaseUpload(io.BytesIO(pdf_binary_data), mimetype='application/pdf', resumable=True)

            file = service.files().create(
                body=file_metadata, 
                media_body=media, 
                fields='id, webViewLink'
            ).execute()

            file_id = file.get('id')
            service.permissions().create(fileId=file_id, body={'role': 'reader', 'type': 'anyone'}).execute()

            # --- CORRECCIÓN AQUÍ ---
            # Devolvemos un diccionario con el ID y la URL, no solo la URL.
            return {'file_id': file.get('id'), 'webViewLink': file.get('webViewLink')}

        except HttpError as error:
            print(f"Ocurrió un error de la API de Google: {error}")
            raise Exception(f"Error de la API de Google: {error.content.decode('utf-8')}")
        except Exception as e:
            print(f"Ocurrió un error DETALLADO al subir a Google Drive: {e}")
            raise e
    @staticmethod
    def rename_file(file_id, new_name):
        """
        Renombra un archivo existente en Google Drive usando su ID.
        """
        creds = DriveService._get_credentials()
        if not creds or not creds.valid:
            raise Exception("Authorization required")
        
        try:
            service = build('drive', 'v3', credentials=creds)
            
            file_metadata = {'name': new_name}
            
            service.files().update(
                fileId=file_id,
                body=file_metadata
            ).execute()
            
            print(f"Archivo con ID {file_id} renombrado a '{new_name}'")
            return True
        except Exception as e:
            print(f"Ocurrió un error al renombrar el archivo en Google Drive: {e}")
            raise e