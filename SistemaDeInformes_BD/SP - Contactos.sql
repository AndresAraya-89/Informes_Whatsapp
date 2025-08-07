USE SistemasDeInformes
GO

-- =============================================
-- SCRIPT CORREGIDO PARA EL PROCEDIMIENTO ALMACENADO
-- =============================================
ALTER PROCEDURE [dbo].[sp_CrearContacto_ConValidacion]
    @Nombre VARCHAR(100),
    @Telefono VARCHAR(100),
    @CorreoElectronico VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Verificar si el teléfono ya existe (esto está bien)
    IF EXISTS (SELECT 1 FROM Contacto WHERE Telefono = @Telefono)
    BEGIN
        SELECT 'CONFLICT' AS Status, 'El número de teléfono ya existe.' AS Message, NULL AS NewId;
        RETURN;
    END

    -- 2. Verificar si el correo ya existe (esto está bien)
    IF @CorreoElectronico IS NOT NULL AND @CorreoElectronico != '' AND EXISTS (SELECT 1 FROM Contacto WHERE CorreoElectronico = @CorreoElectronico)
    BEGIN
        SELECT 'CONFLICT' AS Status, 'El correo electrónico ya existe.' AS Message, NULL AS NewId;
        RETURN;
    END

    -- 3. Iniciar la transacción explícitamente antes del TRY
    BEGIN TRANSACTION;

    BEGIN TRY
        -- Insertar el nuevo contacto
        INSERT INTO Contacto (Nombre, Telefono, CorreoElectronico)
        VALUES (@Nombre, @Telefono, @CorreoElectronico);
        
        -- Si la inserción es exitosa, confirmar la transacción
        COMMIT TRANSACTION;
        
        -- Devolver mensaje de éxito
        SELECT 'SUCCESS' AS Status, 'Contacto creado exitosamente.' AS Message, SCOPE_IDENTITY() AS NewId;
    END TRY
    BEGIN CATCH
        -- Si ocurre un error, verificar si hay una transacción abierta y revertirla
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        -- Devolver el mensaje de error de SQL Server
        SELECT 'ERROR' AS Status, ERROR_MESSAGE() AS Message, NULL AS NewId;
    END CATCH
END
GO

-- =============================================
-- 2. PROCEDIMIENTO PARA ACTUALIZAR UN CONTACTO EXISTENTE
-- =============================================
CREATE OR ALTER PROCEDURE sp_ActualizarContacto
    @IdContacto INT,
    @Nombre VARCHAR(100),
    @Telefono VARCHAR(100),
    @CorreoElectronico VARCHAR(100) = NULL,
    @Estado INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Contacto
    SET 
        Nombre = @Nombre,
        Telefono = @Telefono,
        CorreoElectronico = @CorreoElectronico,
        Estado = @Estado
    WHERE 
        IdContacto = @IdContacto;
END
GO

-- =============================================
-- 3. PROCEDIMIENTO PARA ELIMINAR UN CONTACTO (LÓGICAMENTE)
-- =============================================
CREATE OR ALTER PROCEDURE sp_EliminarContacto
    @IdContacto INT
AS
BEGIN
    SET NOCOUNT ON;

    -- En lugar de borrar el registro, se cambia el estado a 0 (Inactivo)
    UPDATE Contacto
    SET Estado = 0
    WHERE IdContacto = @IdContacto;
END
GO

-- =============================================
-- 4. PROCEDIMIENTOS DE BÚSQUEDA
-- =============================================

-- A. Buscar por Nombre (búsqueda parcial en contactos activos)
CREATE OR ALTER PROCEDURE sp_BuscarContactoPorNombre
    @Nombre VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT	
		IdContacto,
        Nombre,
        SUBSTRING(Telefono, 4, LEN(Telefono)) AS Telefono,
        Estado
    FROM Contacto
    WHERE Nombre LIKE '%' + @Nombre + '%' AND Estado = 1;
END
GO

-- B. Buscar por Número de Teléfono (búsqueda exacta)
CREATE OR ALTER PROCEDURE sp_BuscarContactoPorTelefono
    @Telefono VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
		IdContacto,
        Nombre,
        SUBSTRING(Telefono, 4, LEN(Telefono)) AS Telefono,
        Estado
    FROM Contacto
    WHERE Telefono = @Telefono;
END
GO

-- C. Buscar por Correo Electrónico (búsqueda exacta)
CREATE OR ALTER PROCEDURE sp_BuscarContactoPorCorreo
    @CorreoElectronico VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT	
		IdContacto,
        Nombre,
        SUBSTRING(Telefono, 4, LEN(Telefono)) AS Telefono,
        Estado
    FROM Contacto
    WHERE CorreoElectronico = @CorreoElectronico;
END
GO


-- D. Obtener todos los contactos activos
CREATE OR ALTER PROCEDURE sp_ObtenerContactosActivos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
		IdContacto,
        Nombre,
        SUBSTRING(Telefono, 4, LEN(Telefono)) AS Telefono,
        Estado
    FROM Contacto
    WHERE Estado = 1
    ORDER BY Nombre;
END
GO

-- E. Obtener todos los contactos activos y inactivos
CREATE OR ALTER PROCEDURE sp_ObtenerContactosActivosInactivos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
		IdContacto,
        Nombre,
        SUBSTRING(Telefono, 4, LEN(Telefono)) AS Telefono,
        Estado
    FROM Contacto
    ORDER BY Nombre;
END
GO

-- F. Obtener todos los contactos inactivos
CREATE OR ALTER PROCEDURE sp_ObtenerContactosInactivos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
		IdContacto,
        Nombre,
        SUBSTRING(Telefono, 4, LEN(Telefono)) AS Telefono,
        Estado
    FROM Contacto
	WHERE Estado = 0
    ORDER BY Nombre;
END
GO


-- G. Obtener un contacto por medio de su id
CREATE OR ALTER PROCEDURE sp_ObtenerContactoPorId
    @Id INT
AS
BEGIN
    SELECT 
		IdContacto,
        Nombre,
        SUBSTRING(Telefono, 4, LEN(Telefono)) AS Telefono,
        Estado
    FROM Contacto
    WHERE [IdContacto] = @Id;
END
GO


-- H. Obtener todos los contactos gerenciales
CREATE OR ALTER PROCEDURE sp_ObtenerContactosGerenciales
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
		IdContacto,
        Nombre,
        SUBSTRING(Telefono, 4, LEN(Telefono)) AS Telefono,
        Estado
    FROM Contacto
	WHERE Estado = 2
    ORDER BY Nombre;
END
GO


use SistemasDeInformes
EXEC sp_ObtenerContactosGerenciales;