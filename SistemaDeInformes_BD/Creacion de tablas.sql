USE SistemasDeInformes
GO

-- =============================================
-- Tabla: Contacto
-- Almacena la información de los destinatarios con todas las restricciones en línea.
-- =============================================
CREATE TABLE Contacto (
    IdContacto INT IDENTITY (1,1) PRIMARY KEY,
    Nombre VARCHAR (100) NOT NULL,
    Telefono VARCHAR (100) NOT NULL UNIQUE,
    CorreoElectronico VARCHAR (100) UNIQUE,
    Estado INT NOT NULL DEFAULT 1, -- 1 = Activo, 0 = Inactivo
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================
-- Tabla: Archivo
-- Almacena la información de los informes en PDF con todas las restricciones en línea.
-- =============================================
CREATE TABLE Archivo (
    IdArchivo INT IDENTITY (1, 1) PRIMARY KEY,
    Nombre VARCHAR (100) NOT NULL UNIQUE,
    URLPublica VARCHAR (500) NOT NULL, -- URL pública (ej. de Cloudinary o Dropbox)
    FechaSubida DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================
-- Tabla: Envio
-- Registra cada intento de envío, uniendo Contactos y Archivos.
-- Las llaves foráneas se definen directamente en la creación de la tabla.
-- =============================================
CREATE TABLE Envio (
    IdEnvio INT IDENTITY (1, 1) PRIMARY KEY,
    IdContacto INT NOT NULL FOREIGN KEY REFERENCES Contacto(IdContacto),
    IdArchivo INT NOT NULL FOREIGN KEY REFERENCES Archivo(IdArchivo),
    FechaEnvio DATETIME NOT NULL DEFAULT GETDATE(),
    EstadoEnvio VARCHAR(20) NOT NULL, -- Ej: 'Enviado', 'Fallido'
    TwilioSID VARCHAR(100) NULL -- Para rastrear el mensaje en Twilio
);
GO


