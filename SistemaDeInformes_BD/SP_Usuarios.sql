USE [SistemasDeInformes];
GO

SELECT * FROM [dbo].[core_usuario];
GO

SELECT TOP 10 * FROM [dbo].[Archivo] ORDER BY FechaSubida DESC;

-- DELETE [dbo].[Contacto]
-- WHERE NOT [IdContacto] IN (1, 11, 1003);

-- Este SP actualiza el password y activa el flag 'estadoRecuperacion'
CREATE OR ALTER PROCEDURE sp_EstablecerPasswordTemporal
    @Username VARCHAR(150),
    @NuevoPasswordEncriptado VARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE core_usuario
    SET 
        password = @NuevoPasswordEncriptado,
        estadoRecuperacion = 1 -- 1 = True (Requiere cambio)
    WHERE username = @Username;
    
    SELECT @@ROWCOUNT AS FilasAfectadas;
END
GO

-- Este SP cambia la contraseña y desactiva el flag 'estadoRecuperacion'
CREATE OR ALTER PROCEDURE sp_ActualizarPasswordDefinitivo
    @UsuarioID INT,
    @NuevoPasswordEncriptado VARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE core_usuario
    SET 
        password = @NuevoPasswordEncriptado,
        estadoRecuperacion = 0 -- 0 = False (Recuperación completada)
    WHERE id = @UsuarioID;
    
    SELECT @@ROWCOUNT AS FilasAfectadas;
END
GO

-- Este SP comprueba que los 3 campos coincidan y devuelve
-- los datos del usuario si es exitoso.

CREATE OR ALTER PROCEDURE sp_ValidarUsuarioParaRecuperacion
    @Username VARCHAR(150),
    @Telefono VARCHAR(100),
    @CorreoElectronico VARCHAR(254)
AS
BEGIN
    SET NOCOUNT ON;

    -- Busca un usuario que coincida con los TRES campos.
    -- Se asume que el teléfono ya viene con el formato "506..."
    SELECT 
        id,
        username,
        first_name,
        last_name,
        email,
        telefono,
        estadoActividad,
        is_staff
    FROM 
        core_usuario
    WHERE 
        username = @Username
        AND telefono = @Telefono
        AND email = @CorreoElectronico
        AND estadoActividad = 1; -- Solo permite recuperar cuentas activas
END
GO

