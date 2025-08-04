USE SistemasDeInformes
GO

-- =============================================
-- 1. PROCEDIMIENTO PARA CREAR UN NUEVO REGISTRO DE ENVIO
-- =============================================
CREATE OR ALTER PROCEDURE sp_CrearEnvio
    @IdContacto INT,
    @IdArchivo INT,
    @EstadoEnvio VARCHAR(20),
    @TwilioSID VARCHAR(100) = NULL -- El SID de Twilio es opcional
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        INSERT INTO Envio (IdContacto, IdArchivo, EstadoEnvio, TwilioSID)
        VALUES (@IdContacto, @IdArchivo, @EstadoEnvio, @TwilioSID);
        
        -- Devuelve el ID del env�o reci�n creado
        SELECT SCOPE_IDENTITY() AS IdEnvioCreado;
    END TRY
    BEGIN CATCH
        -- Devuelve informaci�n del error si la inserci�n falla (ej. por un IdContacto que no existe)
        SELECT 
            ERROR_NUMBER() AS ErrorNumber,
            ERROR_MESSAGE() AS ErrorMessage;
    END CATCH
END
GO

-- =============================================
-- 2. PROCEDIMIENTO PARA OBTENER EL HISTORIAL DE ENV�OS DE UN CONTACTO
-- =============================================
CREATE OR ALTER PROCEDURE sp_ObtenerEnviosPorContacto
    @IdContacto INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        E.IdEnvio,
        E.FechaEnvio,
        E.EstadoEnvio,
        A.Nombre AS NombreArchivo,
        A.URLPublica,
        E.TwilioSID
    FROM 
        Envio AS E
    INNER JOIN 
        Archivo AS A ON E.IdArchivo = A.IdArchivo
    WHERE 
        E.IdContacto = @IdContacto
    ORDER BY 
        E.FechaEnvio DESC;
END
GO
