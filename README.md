# Sistema de Automatización de Informes

Aplicación de escritorio (Tauri + React) y API REST (Django) para gestionar contactos, generar informes en PDF, almacenarlos en Google Drive y distribuirlos automáticamente a los destinatarios vía WhatsApp usando Twilio.

- **Repositorio:** https://github.com/AndresAraya-89/Sistema-de-automatizacion-de-informes-
- **ERS (Especificación de Requisitos):** [Documento en Google Docs](https://docs.google.com/document/d/1Mc-AiDY_6WtOAte8121rUEtukC_wwB8a/edit?usp=sharing&ouid=117814125588622869517&rtpof=true&sd=true)
- **Documentación complementaria (diagramas, modelos y video de prueba):** [Carpeta en Google Drive](https://drive.google.com/drive/folders/1xDTt1naCXOJFkHg-_-Q8r1IfWKGdIntA?usp=sharing)
- **Autor:** Andrés Araya

---

## Tabla de contenido

1. [Descripción general](#descripción-general)
2. [Arquitectura](#arquitectura)
3. [Stack tecnológico](#stack-tecnológico)
4. [Estructura del repositorio](#estructura-del-repositorio)
5. [Requisitos previos](#requisitos-previos)
6. [Configuración de la base de datos](#configuración-de-la-base-de-datos)
7. [Configuración del backend](#configuración-del-backend)
8. [Configuración del frontend](#configuración-del-frontend)
9. [Variables de entorno y secretos](#variables-de-entorno-y-secretos)
10. [Endpoints principales de la API](#endpoints-principales-de-la-api)
11. [Módulos funcionales](#módulos-funcionales)
12. [Integraciones externas](#integraciones-externas)
13. [Notas de seguridad](#notas-de-seguridad)
14. [Documentación complementaria](#documentación-complementaria)

---

## Descripción general

El sistema automatiza el flujo completo de envío de informes corporativos:

1. El usuario autenticado genera un informe en PDF desde el frontend.
2. El PDF se sube a Google Drive (vía OAuth2) y se registra en la base de datos.
3. El sistema dispara un mensaje por WhatsApp (Twilio) con el enlace al informe al contacto seleccionado.
4. Se registra el envío en el historial, permitiendo trazabilidad por contacto.

Incluye además gestión de usuarios con roles, recuperación de contraseña por WhatsApp y administración del catálogo de contactos y archivos.

---

## Arquitectura

Arquitectura clásica de tres capas:

```
┌──────────────────────┐      HTTPS/JSON      ┌─────────────────────┐      T-SQL      ┌────────────────────┐
│  Frontend (Tauri +   │ ───────────────────► │  Backend (Django +  │ ──────────────► │  SQL Server        │
│  React + Vite)       │ ◄─────────────────── │  DRF + JWT)         │ ◄────────────── │  (Stored Procs)    │
└──────────────────────┘                      └─────────┬───────────┘                 └────────────────────┘
                                                        │
                                          ┌─────────────┼──────────────┐
                                          ▼                            ▼
                                   ┌──────────────┐            ┌──────────────┐
                                   │ Google Drive │            │   Twilio     │
                                   │   (OAuth2)   │            │  (WhatsApp)  │
                                   └──────────────┘            └──────────────┘
```

- El acceso a datos se realiza casi en su totalidad mediante **Stored Procedures** (`SP_*.sql`) — Django se conecta a SQL Server vía ODBC y los modelos están marcados como `managed = False`.
- La autenticación usa **JWT** con tokens de acceso de 8 horas y refresh de 1 día.
- El frontend puede correr como aplicación web (Vite) o empaquetarse como aplicación de escritorio con **Tauri**.

---

## Stack tecnológico

### Backend
- Python 3 + Django 5
- Django REST Framework
- `djangorestframework-simplejwt` (autenticación JWT)
- `mssql-django` / driver ODBC 17 para SQL Server
- `reportlab` (generación de PDF)
- `twilio` (mensajería WhatsApp)
- `google-api-python-client` / OAuth2 (Google Drive)

### Frontend
- React 19 + Vite 7
- React Router DOM 7
- Bootstrap 5 / React-Bootstrap
- `axios` para consumir la API
- `jspdf` + `html2canvas` para componer PDFs en el cliente
- `jwt-decode` para leer el token
- Tauri 2 para empaquetar como app de escritorio (Windows)

### Base de datos
- Microsoft SQL Server
- Tablas: `Contacto`, `Archivo`, `Envio`, más la tabla de usuarios extendida de Django (`Usuario`)
- Procedimientos almacenados separados por dominio (`SP - Contactos.sql`, `SP - Archivos.sql`, `SP - Envios.sql`, `SP_Usuarios.sql`)

---

## Estructura del repositorio

```
SistemaDeInformes/
├── SistemaDeInformes_BD/                # Scripts SQL (DDL + Stored Procedures + backup)
│   ├── Creacion de tablas.sql
│   ├── SP - Contactos.sql
│   ├── SP - Archivos.sql
│   ├── SP - Envios.sql
│   ├── SP_Usuarios.sql
│   └── Backaup (cada 6 meses).sql
│
├── SistemaDeInformes_Backend/           # API Django
│   ├── core/                            # App principal (modelos, views, services, urls)
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── services.py                  # Lógica de negocio + llamadas a SP
│   │   ├── drive_service.py             # Wrapper de Google Drive
│   │   ├── serializers.py
│   │   ├── permissions.py
│   │   └── urls.py
│   ├── sistema_informes/                # Configuración del proyecto Django
│   ├── requirements.txt
│   └── manage.py
│
└── SistemasDeInformes_Frontend/
    └── sistema_informes_frontend/       # App React + Vite + Tauri
        ├── src/
        │   ├── components/              # LoginPage, UsersPage, GenerarReporte, archivoPDF, ...
        │   └── App.jsx
        ├── src-tauri/                   # Configuración del bundle de escritorio
        ├── package.json
        └── vite.config.js
```

---

## Requisitos previos

- **Python 3.11+**
- **Node.js 18+** y npm
- **Microsoft SQL Server** (local o remoto) con autenticación de Windows habilitada
- **ODBC Driver 17 for SQL Server**
- **Rust toolchain** (solo si se va a compilar la versión de escritorio con Tauri)
- Cuenta de **Twilio** con sandbox o número de WhatsApp aprobado
- Proyecto en **Google Cloud Console** con credenciales OAuth 2.0 para la API de Drive

---

## Configuración de la base de datos

1. Crear la base de datos `SistemasDeInformes` en SQL Server.
2. Ejecutar los scripts en este orden, dentro de la carpeta `SistemaDeInformes_BD/`:
   1. `Creacion de tablas.sql`
   2. `SP - Contactos.sql`
   3. `SP - Archivos.sql`
   4. `SP - Envios.sql`
   5. `SP_Usuarios.sql`
3. (Opcional) Ejecutar `Pruebas.sql` para datos de prueba.

> El backend está configurado para conectarse mediante `trusted_connection=yes` (autenticación de Windows). Si se necesita usuario/contraseña SQL, ajustar `DATABASES` en `sistema_informes/settings.py`.

---

## Configuración del backend

```powershell
cd SistemaDeInformes_Backend

# Crear y activar entorno virtual
python -m venv venv
.\venv\Scripts\Activate.ps1

# Instalar dependencias
pip install -r requirements.txt

# Aplicar migraciones (solo crea las tablas de auth/admin de Django; las tablas de negocio ya existen)
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Levantar el servidor
python manage.py runserver
```

La API quedará disponible en `http://127.0.0.1:8000/api/`.

Archivos `*.http` (`apiContacto.http`, `apiArchivos.http`, `apiEnvios.http`) incluyen ejemplos de requests para probar los endpoints desde VS Code REST Client.

---

## Configuración del frontend

```powershell
cd SistemasDeInformes_Frontend\sistema_informes_frontend

npm install

# Modo desarrollo web
npm run dev

# Build de producción web
npm run build

# Modo escritorio (Tauri)
npx tauri dev
npx tauri build
```

---

## Variables de entorno y secretos

El backend usa `python-dotenv`. Crear un archivo `.env` en `SistemaDeInformes_Backend/` con al menos:

```env
# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

Además, son necesarios los siguientes archivos (no deben subirse al repositorio):

| Archivo | Propósito |
| --- | --- |
| `client_secret.json` | Credenciales OAuth 2.0 de Google Cloud (flujo de usuario para Drive) |
| `service_account.json` | Cuenta de servicio de Google (uso programático sin intervención del usuario) |
| `token.pickle` | Token persistido tras la primera autorización OAuth |

> **Importante:** todos esos archivos contienen secretos. Asegurarse de que estén en `.gitignore`. La `SECRET_KEY` por defecto en `settings.py` y `DEBUG=True` deben sustituirse antes de cualquier despliegue.

---

## Endpoints principales de la API

Base URL: `/api/`

### Autenticación
| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/token/` | Login (devuelve access + refresh) |
| `POST` | `/token/refresh/` | Renovar access token |
| `POST` | `/recuperar-password/` | Genera contraseña temporal y la envía por WhatsApp |
| `POST` | `/cambiar-password/` | Cambio de contraseña del usuario autenticado |

### Usuarios
| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET/POST` | `/users/` | Listar / crear usuarios (admin) |
| `GET/PUT/DELETE` | `/users/{id}/` | CRUD de usuario (admin o el propio) |
| `GET` | `/users/me/` | Perfil del usuario autenticado |
| `PATCH` | `/users/update-status/{id}/` | Activar / desactivar usuario |

### Contactos
| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET/POST` | `/contactos/` | Lista (filtros: `nombre`, `telefono`, `correo`, `estado=activos\|inactivos\|todos\|gerenciales`) y creación |
| `GET/PUT/DELETE` | `/contactos/{id_contacto}/` | Detalle, actualización, eliminación lógica |
| `GET` | `/contactos/{id_contacto}/historial/` | Historial de envíos del contacto |

### Archivos y envíos
| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET/POST` | `/archivos/` | Listado y registro de archivos (URL pública) |
| `GET` | `/archivos/{id_archivo}/` | Detalle |
| `POST` | `/envios/` | Registrar un envío |
| `POST` | `/enviar-informe/` | Envía el PDF (vía URL de Drive) por WhatsApp al contacto |
| `POST` | `/enviar-mensaje-texto/` | Envía un mensaje de texto simple por WhatsApp |

### Google Drive
| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/upload-to-drive/` | Sube el PDF (base64), lo registra en BD y dispara el envío |
| `GET` | `/authorize/` | Inicia el flujo OAuth2 de Google |
| `GET` | `/oauth2callback/` | Callback de Google que persiste el token |

---

## Módulos funcionales

- **Seguridad / autenticación:** login con JWT, recuperación de contraseña vía WhatsApp con contraseña temporal generada y `estadoRecuperacion` que fuerza cambio en el siguiente login.
- **Gestión de usuarios:** alta, edición, desactivación lógica, perfil propio, control por rol (admin / usuario).
- **Gestión de contactos:** búsqueda por nombre / teléfono / correo, segmentación por estado y categoría gerencial.
- **Gestión de archivos:** registro de PDFs subidos a Drive con URL pública y nombre normalizado por la BD.
- **Generación de informes:** composición del PDF desde el frontend (`html2canvas` + `jspdf`).
- **Distribución automática:** subida a Drive + envío por WhatsApp en una sola operación, con registro en `Envio` y trazabilidad por contacto.
- **Historial:** consulta de todos los envíos asociados a un contacto.

---

## Integraciones externas

### Twilio (WhatsApp)
Se usan las credenciales del `.env`. Para desarrollo basta con el sandbox de Twilio (`whatsapp:+14155238886`) y el código de ingreso enviado al teléfono de prueba.

### Google Drive
- Crear un proyecto en Google Cloud Console.
- Habilitar la **Google Drive API**.
- Generar credenciales **OAuth 2.0 Client ID** (tipo *Desktop app* o *Web application* según se prefiera) y descargar `client_secret.json` en la carpeta del backend.
- La primera vez que se llama a `/upload-to-drive/` el backend devolverá `401 Authorization required`; el frontend debe redirigir a `/api/authorize/` para completar el flujo OAuth, lo que generará `token.pickle`.

---

## Notas de seguridad

- `SECRET_KEY`, `DEBUG=True` y `CORS_ALLOW_ALL_ORIGINS = True` en `settings.py` son adecuados solo para desarrollo. **Endurecer antes de producción.**
- `client_secret.json`, `service_account.json`, `token.pickle` y `.env` deben permanecer fuera del control de versiones.
- El campo `ALLOWED_HOSTS` está vacío; configurarlo cuando el backend se exponga.
- Los stored procedures concentran la lógica de acceso a datos: cualquier cambio de esquema requiere actualizar el SP correspondiente además del modelo Django.

---

## Documentación complementaria

Toda la documentación adicional del proyecto está disponible en la siguiente carpeta de Google Drive:

**[📂 Carpeta de documentación en Google Drive](https://drive.google.com/drive/folders/1xDTt1naCXOJFkHg-_-Q8r1IfWKGdIntA?usp=sharing)**

Incluye:

- **Diagramas de casos de uso** — actores y funcionalidades del sistema.
- **Diagramas de secuencia** — flujos de interacción entre frontend, backend, base de datos y servicios externos (Twilio / Google Drive).
- **Modelo Entidad-Relación (E-R)** — diseño conceptual de la base de datos.
- **Modelo relacional** — diseño lógico con tablas, llaves primarias y foráneas.
- **Video de prueba** — demostración funcional del sistema en ejecución.
